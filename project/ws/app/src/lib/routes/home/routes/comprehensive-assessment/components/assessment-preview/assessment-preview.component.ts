import { AfterViewInit, Component, ElementRef, Input, NgZone, OnChanges, OnDestroy } from '@angular/core'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import * as _ from 'lodash'
import { CA_DRAFT_PREVIEW_PARAM } from '../../../../../../../../../../../src/app/services/ca-hierarchy-interceptor.service'
import { ComprehensiveAssessmentService } from '../../services/comprehensive-assessment.service'
import { QUESTIONSET_PRIMARY_CATEGORY } from '../../models/comprehensive-assessment.model'

/**
 * Where the toc's View button points. It builds `/viewer/...`, which the app redirects into
 * `app/home/explore-content/viewer/...` on navigation — either form can turn up on the
 * anchor, so both are matched.
 */
const VIEWER_PATH = /^(?:\/app\/home\/explore-content)?\/viewer(?=\/)/
/** The same player, on a page of its own with no shell around it. */
const PLAYER_PATH = '/app/assessment-player'
/** The player treats the assessment collection as a course. */
const COLLECTION_TYPE = 'Course'
/** The class the toc puts on its View anchor. */
const VIEW_ANCHOR = 'a.action-button'
/**
 * Names where the player's Finish should land. Declared here rather than imported from the
 * viewer: that component already reaches the other way into this project, and one constant
 * is not worth the cycle. It has to match `FINISH_URL_PARAM` in
 * `viewer-secondary-top-bar.component.ts`.
 */
const FINISH_URL_PARAM = 'finishUrl'

/**
 * Step 3 of the builder.
 *
 * The card's View button opens the player here rather than navigating to it. Following the
 * link would unmount the stepper and lose the half built assessment, so the click is taken
 * and the player is framed instead, on `app/assessment-player` — the same ViewerModule
 * mounted away from the home shell, so it arrives without the portal's left menu.
 *
 * Note on the component choice: `ws-app-app-toc-home` is deliberately NOT exported by
 * `AppTocLibModule` in @sunbird-cb/toc (it is commented out of the module's exports) and
 * the installed build only declares a `forPreview` input on it, so it cannot be used from
 * here. `ws-app-app-toc-home-v2` is exported and reads `inputContent` when the route has
 * no resolved content, which is exactly the embedded preview case.
 */
@Component({
  selector: 'ws-app-assessment-preview',
  templateUrl: './assessment-preview.component.html',
  styleUrls: ['./assessment-preview.component.scss'],
  standalone: false,
})
export class AssessmentPreviewComponent implements AfterViewInit, OnChanges, OnDestroy {

  /** A full content hierarchy response, re-read from the api after the draft is saved. */
  @Input() content: any

  readonly breadcrumbs = [
    { url: '/app/home/comprehensive-assessment/live', title: 'Home', icon: '' },
    { url: '', title: 'Comprehensive Assessment', icon: '' },
  ]

  /** Set once View is clicked, which is what swaps the card for the player. */
  playerUrl: SafeResourceUrl | null = null

  private readonly captureClick = (event: Event) => this.ngZone.run(() => this.onPreviewClick(event))

  constructor(
    private sanitizer: DomSanitizer,
    private assessmentSvc: ComprehensiveAssessmentService,
    private elementRef: ElementRef,
    private ngZone: NgZone
  ) { }

  /**
   * The View is an `<a [routerLink]>`, and RouterLink answers the click on the anchor
   * itself. A listener bound the ordinary way runs after that, in the bubble phase, by
   * which point the router has already been asked to navigate and preventing the default
   * stops nothing. Capturing on the way down is what lets the click be taken first.
   */
  ngAfterViewInit(): void {
    this.elementRef.nativeElement.addEventListener('click', this.captureClick, true)
  }

  ngOnDestroy(): void {
    this.elementRef.nativeElement.removeEventListener('click', this.captureClick, true)
  }

  /** A newer draft means whatever is open is stale, so the card comes back. */
  ngOnChanges(): void {
    this.playerUrl = null
  }

  get isPlayerOpen(): boolean {
    return !!this.playerUrl
  }

  /**
   * The toc's View is an `<a [routerLink]>`, so the address it would have navigated to is
   * already sitting on the anchor. Taking that href is what keeps the frame and the card in
   * step: whatever View would have opened is what opens here, with no second opinion about
   * the parameters. Only when the toc worked no link out does this address the player itself.
   */
  onPreviewClick(event: Event): void {
    const target = event.target as HTMLElement
    const anchor = target && target.closest ? target.closest(VIEW_ANCHOR) : null
    if (!anchor) {
      return
    }
    // The player opens on this step, so the click never reaches RouterLink at all:
    // stopping it on the way down is what keeps the builder on screen.
    event.preventDefault()
    event.stopPropagation()
    const url = anchor.getAttribute('href') || this.buildPlayerUrl()
    if (!url) {
      this.playerUrl = null
      return
    }
    const framed = this.markAsDraftPreview(this.onPlayerPage(url))
    this.playerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.withFinishLanding(framed))
  }

  /**
   * Finish otherwise lands on the content preview page, which the builder never came from
   * and which arrives wearing the whole portal. Naming the player's own opening screen keeps
   * Finish inside the frame, where the step's own control is the way back out.
   */
  private withFinishLanding(url: string): string {
    return this.withParam(url, FINISH_URL_PARAM, url)
  }

  /**
   * The toc addresses the player under the home shell, which wraps it in the portal's left
   * menu and leaves it its own way back out. The very same routes are mounted on a page of
   * their own for this step to frame, so the address is moved onto that page.
   */
  private onPlayerPage(url: string): string {
    return url.replace(VIEWER_PATH, PLAYER_PATH)
  }

  /**
   * Inside the frame the location is the player's own, so nothing about it says the draft
   * being previewed is a comprehensive assessment. This marker is what tells the hierarchy
   * interceptor to read through the authoring endpoint rather than the course reader.
   */
  private markAsDraftPreview(url: string): string {
    return this.withParam(url, CA_DRAFT_PREVIEW_PARAM, 'true')
  }

  /** Adds a query param, leaving a url that already names it as it is. */
  private withParam(url: string, key: string, value: string): string {
    if (url.includes(`${key}=`)) {
      return url
    }
    return `${url}${url.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(value)}`
  }

  /** Back to the card, which was only hidden and so is still the one already loaded. */
  closePlayer(): void {
    this.playerUrl = null
  }

  /**
   * The player is addressed by the question set, not by the collection, and carries the
   * collection alongside it. `preview` and `editMode` are what make it read the draft
   * rather than the published copy, the same pair the builder url carries.
   */
  buildPlayerUrl(): string {
    const collectionId = _.get(this.content, 'identifier', '')
    const assessmentId = this.assessmentSvc.getLinkedAssessmentId(this.content)
    if (!collectionId || !assessmentId) {
      return ''
    }
    const queryParams: { [key: string]: string } = {
      collectionId,
      primaryCategory: QUESTIONSET_PRIMARY_CATEGORY,
      collectionType: COLLECTION_TYPE,
      courseName: _.get(this.content, 'name', ''),
      preview: 'true',
      editMode: 'true',
      batchId: '',
      channelId: _.get(this.content, 'channel', ''),
    }
    const query = Object.keys(queryParams)
      .map((key: string) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
      .join('&')
    return `${PLAYER_PATH}/practice/${assessmentId}?${query}`
  }

}
