import { ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core'
import { Location } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { MatStepper } from '@angular/material/stepper'
import { StepperSelectionEvent } from '@angular/cdk/stepper'
import { HttpErrorResponse } from '@angular/common/http'
import { Observable, of } from 'rxjs'
import { catchError, map, switchMap, tap } from 'rxjs/operators'
import * as _ from 'lodash'
import {
  aparPlan,
  comprehensiveAssessment,
  comprehensiveAssessmentList,
  DEFAULT_LICENSE,
  noSpecialCharAssessment,
} from '../../models/comprehensive-assessment.model'
import { richTextValidator } from '../../models/rich-text.validator'
import { ComprehensiveAssessmentService } from '../../services/comprehensive-assessment.service'
import { LoaderService } from '../../../../../../../../../../../src/app/services/loader.service'
import { ConfirmDialogComponent } from '../../../../../workallocation-v2/components/confirm-dialog/confirm-dialog.component'
import { PublishResourceComponent } from '../../dialogs/publish-resource/publish-resource.component'

/** A section of the question set: the questions it promised against the ones it holds. */
interface ISectionCount {
  name: string
  declared: number
  added: number
}

const STEP_BASIC_DETAILS = 'Basic Details'
const STEP_ASSESSMENT = 'Assessment'
const STEP_PREVIEW = 'Preview'

@Component({
  selector: 'ws-app-create-assessment',
  templateUrl: './create-assessment.component.html',
  styleUrls: ['./create-assessment.component.scss'],
  standalone: false,
})
export class CreateAssessmentComponent implements OnInit {

  //#region (global variables)
  private readonly locationService = inject(Location)
  @ViewChild(MatStepper) stepper: MatStepper | undefined

  contentId = ''
  contentDetails: any
  previewContent: any
  previewReady = false
  assessmentDetailsForm!: FormGroup
  linkedAssessmentId = ''
  /** Duration in seconds, mirrored from the question set built in step 2. */
  duration = 0
  currentStepperIndex = 0
  selectedStepperLable = STEP_BASIC_DETAILS
  openMode = 'edit'
  /** Tab the listing was on when this assessment was opened, so Back returns to it. */
  pathUrl = 'live'
  userProfile: any
  /** Set while moving to a step the guard has just cleared, so it is not checked twice. */
  private bypassStepGuard = false
  //#endregion

  constructor(
    private assessmentSvc: ComprehensiveAssessmentService,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private router: Router,
    private matSnackBar: MatSnackBar,
    private loaderService: LoaderService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) { }

  //#region (onInit)
  ngOnInit(): void {
    this.initializeForm()
    this.getDetailsFromResolver()
  }

  initializeForm() {
    this.assessmentDetailsForm = this.formBuilder.group({
      // the plan is held as one object, changing it recomputes every derived value together
      linkedPlan: new FormControl(null, [Validators.required]),
      assessmentName: new FormControl('', [
        Validators.required,
        Validators.minLength(comprehensiveAssessment.NAME_MIN_LENGTH),
        Validators.maxLength(comprehensiveAssessment.NAME_MAX_LENGTH),
        Validators.pattern(noSpecialCharAssessment),
      ]),
      description: new FormControl('', [
        richTextValidator(
          comprehensiveAssessment.DESCRIPTION_MIN_LENGTH,
          comprehensiveAssessment.DESCRIPTION_MAX_LENGTH
        ),
      ]),
      learningOutcome: new FormControl('', [
        richTextValidator(
          comprehensiveAssessment.LEARNING_OUTCOME_MIN_LENGTH,
          comprehensiveAssessment.LEARNING_OUTCOME_MAX_LENGTH
        ),
      ]),
      // classification: what the platform holds as difficultyLevel, license and keywords
      difficultyLevel: new FormControl('', [Validators.required]),
      license: new FormControl(DEFAULT_LICENSE, [Validators.required]),
      keywords: new FormControl([], [Validators.required]),
      // the thumbnail is mandatory, the logo is optional
      appIcon: new FormControl('', [Validators.required]),
      creatorLogo: new FormControl(''),
    })

    // any edit invalidates the saved copy the preview step renders
    this.assessmentDetailsForm.valueChanges.subscribe(() => {
      this.previewReady = false
    })
  }

  getDetailsFromResolver() {
    this.activatedRoute.queryParams.subscribe((params: any) => {
      this.openMode = params['mode'] || 'edit'
      this.pathUrl = params['pathUrl'] || this.pathUrl
      if (this.openMode === 'view') {
        this.assessmentDetailsForm.disable()
      }
      this.ensurePreviewQueryParams(params)
    })
    this.userProfile = _.get(this.activatedRoute, 'snapshot.data.configService.userProfile')
    const resolved = _.get(this.activatedRoute, 'snapshot.data.assessmentDetails')
    if (_.get(resolved, 'data')) {
      this.contentDetails = _.get(resolved, 'data')
      this.patchAssessmentDetails()
    } else if (_.get(resolved, 'error')) {
      this.openSnackBar('Unable to load the assessment, please try again')
    }
  }

  /**
   * `@sunbird-cb/toc` picks its hierarchy endpoint by sniffing `window.location.href`:
   * without `&preview=true` it calls the live `course/v1/hierarchy` which returns nothing
   * for a draft, and with `editMode=true` it calls the draft aware `?mode=edit` variant.
   * Both markers are therefore kept on the builder url so the preview can read the draft.
   */
  ensurePreviewQueryParams(params: any) {
    if (params['preview'] === 'true' && params['editMode'] === 'true') {
      return
    }
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { preview: 'true', editMode: 'true' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    })
  }

  patchAssessmentDetails() {
    const thumbnail = this.contentDetails?.status?.toLowerCase() === 'live' ? this.contentDetails?.posterImage : this.contentDetails?.appIcon
    this.contentId = _.get(this.contentDetails, 'identifier', '')
    this.assessmentDetailsForm.patchValue({
      linkedPlan: this.assessmentSvc.readPlanMetadata(this.contentDetails),
      assessmentName: _.get(this.contentDetails, 'name', ''),
      description: _.get(this.contentDetails, 'description', ''),
      learningOutcome: _.get(this.contentDetails, 'purpose', ''),
      difficultyLevel: _.get(this.contentDetails, 'difficultyLevel', ''),
      license: _.get(this.contentDetails, 'license', '') || DEFAULT_LICENSE,
      keywords: _.get(this.contentDetails, 'keywords', []) || [],
      appIcon: thumbnail || '',
      creatorLogo: _.get(this.contentDetails, 'creatorLogo', ''),
    })
    this.assessmentDetailsForm.updateValueAndValidity()

    this.duration = Number(_.get(this.contentDetails, 'duration', 0)) || 0
    this.linkedAssessmentId = this.assessmentSvc.getLinkedAssessmentId(this.contentDetails)
    if (this.linkedAssessmentId) {
      this.refreshDuration()
    }
  }
  //#endregion

  //#region (stepper interactions)
  /**
   * A step header moves the stepper before anything is checked. The assessment step is
   * checked against the question set the api holds, so a forward move is applied only once
   * that read answers and is taken back when it refuses.
   */
  onSelectionChange(event: StepperSelectionEvent) {
    const steps = this.stepper?.steps?.toArray() || []
    const previousLabel = _.get(steps, `[${event.previouslySelectedIndex}].label`, '')
    const selectedLabel = _.get(steps, `[${event.selectedIndex}].label`, '')
    const guardBypassed = this.bypassStepGuard
    this.bypassStepGuard = false

    if (!guardBypassed && event.selectedIndex > event.previouslySelectedIndex) {
      this.canMoveToStep(steps, event.previouslySelectedIndex, event.selectedIndex)
        .subscribe((allowed: boolean) => {
          if (allowed) {
            this.applyStep(event.selectedIndex, selectedLabel, previousLabel)
            return
          }
          this.revertToStep(event.previouslySelectedIndex, previousLabel)
        })
      return
    }

    this.applyStep(event.selectedIndex, selectedLabel, previousLabel)
  }

  private applyStep(index: number, label: string, previousLabel: string) {
    if (previousLabel === STEP_BASIC_DETAILS) {
      this.assessmentDetailsForm.markAllAsTouched()
      this.assessmentDetailsForm.updateValueAndValidity()
    }

    this.currentStepperIndex = index
    this.selectedStepperLable = label || ''
    if (this.selectedStepperLable === STEP_PREVIEW && !this.previewReady) {
      this.saveBeforePreview()
    }
    this.cdr.detectChanges()
  }

  /** Puts the stepper back on the step it was moved off, header and binding together. */
  private revertToStep(index: number, label: string) {
    this.currentStepperIndex = index
    this.selectedStepperLable = label || this.selectedStepperLable
    setTimeout(() => {
      if (this.stepper) {
        this.stepper.selectedIndex = index
      }
    })
  }

  /** Moves to a step that has already passed the guard, so it is not checked a second time. */
  private selectStep(index: number) {
    if (index === this.currentStepperIndex) {
      return
    }
    const steps = this.stepper?.steps?.toArray() || []
    this.bypassStepGuard = true
    this.currentStepperIndex = index
    this.selectedStepperLable = _.get(steps, `[${index}].label`, '') || this.selectedStepperLable
  }

  /** Every Next persists the current step and carries the saved content to the next one. */
  moveToNextForm() {
    this.assessmentDetailsForm.markAllAsTouched()
    this.assessmentDetailsForm.updateValueAndValidity()
    this.validateSteps([this.selectedStepperLable]).subscribe((valid: boolean) => {
      if (!valid) {
        return
      }
      if (!this.contentId) {
        this.goToNextStep()
        return
      }
      this.loaderService.changeLoaderState(true)
      this.persistContent().subscribe({
        next: () => {
          this.loaderService.changeLoaderState(false)
          this.goToNextStep()
        },
        error: (error: HttpErrorResponse) => {
          this.loaderService.changeLoaderState(false)
          this.openSnackBar(_.get(error, 'error.message', 'Something went wrong while saving, please try again'))
        },
      })
    })
  }

  private goToNextStep() {
    if (this.stepper && this.currentStepperIndex < this.stepper.steps.length - 1) {
      this.selectStep(this.currentStepperIndex + 1)
    }
  }

  /**
   * Saves the authored fields and reads the hierarchy back, so whatever the next step
   * renders is the content the api actually holds rather than a local copy. A step that
   * changed nothing is not saved - the hierarchy is still read, it is what the next step
   * renders from. Neither is a view only assessment: Next still walks its steps to reach
   * the preview, but nothing was authored to write back, and the content api answers a
   * write there with `ERR_TOKEN_INVALID` rather than with the content the step needs.
   */
  private persistContent(): Observable<any> {
    const body = this.getContentUpdateBody()
    const saved$ = this.openMode === 'view' || this.isContentUnchanged(body)
      ? of(null)
      : this.assessmentSvc.updateContent(this.contentId, body).pipe(tap((res: any) => this.syncVersionKey(res)))

    return saved$.pipe(
      switchMap(() => this.assessmentSvc.getContentHierarchy(this.contentId)),
      tap((res: any) => {
        const content = _.get(res, 'result.content')
        if (content) {
          this.contentDetails = content
          this.previewContent = content
          this.previewReady = true
        }
      })
    )
  }

  /**
   * Whether the update would write anything the assessment does not already hold. Reopening
   * one and stepping through it without an edit used to save every field over itself on
   * every Next, and take a new version key for it each time.
   *
   * The form is the comparison rather than its pristine flag: the plan picker, the basic
   * info dialog and the keyword box all patch their values in, which changes the assessment
   * without ever marking a control dirty.
   */
  private isContentUnchanged(body: any): boolean {
    if (!this.contentDetails) {
      return false
    }
    const saved: any = {
      name: _.get(this.contentDetails, 'name', ''),
      description: _.get(this.contentDetails, 'description', ''),
      purpose: _.get(this.contentDetails, 'purpose', ''),
      appIcon: _.get(this.contentDetails, 'appIcon', ''),
      posterImage: _.get(this.contentDetails, 'posterImage', ''),
      creatorLogo: _.get(this.contentDetails, 'creatorLogo', ''),
      difficultyLevel: _.get(this.contentDetails, 'difficultyLevel', ''),
      license: _.get(this.contentDetails, 'license', ''),
      keywords: _.get(this.contentDetails, 'keywords', []) || [],
      // the content schema types duration as a String, so the saved copy is read as one
      duration: String(Number(_.get(this.contentDetails, 'duration', 0)) || 0),
    }
    if (_.some(_.keys(saved), (key: string) => !_.isEqual(_.get(body, key), saved[key]))) {
      return false
    }
    // the linkage is written as an object and a content schema that types it as a String
    // hands it back serialised, so the two are read as the plan they carry rather than
    // compared as whatever the api happened to return
    return _.isEqual(
      this.assessmentSvc.readPlanMetadata({
        [aparPlan.TRAINING_PLAN_KEY]: _.get(body, aparPlan.TRAINING_PLAN_KEY),
      }),
      this.assessmentSvc.readPlanMetadata(this.contentDetails)
    )
  }

  moveToPreviousForm() {
    this.currentStepperIndex = this.currentStepperIndex - 1
  }

  /** Every step being stepped over has to pass, not just the one being left. */
  private canMoveToStep(steps: any[], fromIndex: number, toIndex: number): Observable<boolean> {
    const labels = _.map(_.range(fromIndex, toIndex), (index: number) => _.get(steps, `[${index}].label`, ''))
    return this.validateSteps(labels)
  }

  /**
   * Nothing is authored on a view only assessment, so nothing is asked of it. The basic
   * details answer from the form, the assessment step from the question set the api holds.
   */
  private validateSteps(labels: string[]): Observable<boolean> {
    if (this.openMode === 'view') {
      return of(true)
    }
    if (_.includes(labels, STEP_BASIC_DETAILS) && !this.validateBasicDetails()) {
      return of(false)
    }
    if (_.includes(labels, STEP_ASSESSMENT)) {
      return this.validateAssessment()
    }
    return of(true)
  }

  private validateBasicDetails(): boolean {
    this.assessmentDetailsForm.markAllAsTouched()
    this.assessmentDetailsForm.updateValueAndValidity()
    if (!_.get(this.assessmentDetailsForm, 'controls.linkedPlan.value')) {
      this.openSnackBar('Link an APAR plan, the reporting year and access criteria are read from it')
      return false
    }
    if (this.assessmentDetailsForm.invalid) {
      this.openSnackBar('Please fill mandatory fields')
      return false
    }
    return true
  }

  /**
   * The settings step takes "the number of questions you will be adding" as a promise and
   * lets the section be saved long before those questions are authored, so the promise is
   * checked here against the question set the api actually holds.
   */
  private validateAssessment(): Observable<boolean> {
    if (!this.linkedAssessmentId) {
      this.openSnackBar('Please create the assessment before moving ahead')
      return of(false)
    }
    this.loaderService.changeLoaderState(true)
    return this.readQuestionSet().pipe(
      map((questionSet: any) => {
        this.loaderService.changeLoaderState(false)
        return this.validateQuestionCounts(questionSet)
      }),
      catchError(() => {
        this.loaderService.changeLoaderState(false)
        this.openSnackBar('Unable to read the questions added so far, please try again')
        return of(false)
      })
    )
  }

  private validateQuestionCounts(questionSet: any): boolean {
    const sections = this.readSectionCounts(questionSet)
    if (!sections.length) {
      this.openSnackBar('Save the assessment settings and add its questions before moving ahead')
      return false
    }
    // a section declaring nothing still has to hold a question, an empty one cannot be taken
    const incomplete = _.find(sections, (section: ISectionCount) => section.added < Math.max(section.declared, 1))
    if (!incomplete) {
      return true
    }
    // the section name only helps while there is more than one of them
    const subject = sections.length > 1 ? incomplete.name : 'This assessment'
    this.openSnackBar(incomplete.declared
      ? `${subject} is set to have ${incomplete.declared} questions, only ${incomplete.added} added so far`
      : `${subject} has no questions added yet`)
    return false
  }

  /**
   * What every section of the question set promised against what it holds: `totalQuestions`
   * is the count typed into the settings, its `children` are the questions authored under it.
   */
  private readSectionCounts(questionSet: any): ISectionCount[] {
    return _.map(_.get(questionSet, 'children', []), (section: any, index: number) => ({
      name: _.get(section, 'name', '') || `Section ${index + 1}`,
      declared: Number(_.get(section, 'totalQuestions', 0)) || 0,
      added: _.get(section, 'children', []).length,
    }))
  }
  //#endregion

  //#region (assessment linking and duration)
  /**
   * `sb-uic-assessment-main` creates the question set on its own. Once it hands back the
   * identifier we link it to this collection and pull the duration it was configured with.
   */
  onAssessmentSaved(assessmentId: string) {
    this.linkedAssessmentId = assessmentId
    this.linkAssessment(assessmentId)
    this.refreshDuration()
  }

  linkAssessment(assessmentId: string) {
    if (!this.contentDetails || !assessmentId) {
      return
    }
    this.assessmentSvc.linkAssessmentToCollection(this.contentDetails, assessmentId).subscribe({
      next: () => this.reloadContentHierarchy(),
      error: (error: HttpErrorResponse) => {
        // linking is not fatal for authoring, the question set itself is already saved
        this.openSnackBar(_.get(error, 'error.message', 'Unable to attach the assessment to this collection'))
      },
    })
  }

  refreshDuration() {
    if (!this.linkedAssessmentId) {
      return
    }
    this.readQuestionSet().subscribe({
      next: () => this.cdr.detectChanges(),
      error: () => {
        // duration stays at whatever is already stored on the content
      },
    })
  }

  /**
   * The duration as the question set currently holds it, for the saves that are not already
   * behind a step check. One that cannot be read leaves the duration the content has.
   */
  private readLinkedDuration(): Observable<any> {
    if (!this.linkedAssessmentId) {
      return of(null)
    }
    return this.readQuestionSet().pipe(catchError(() => of(null)))
  }

  /** Reads the question set back, mirroring the duration it is currently configured with. */
  private readQuestionSet(): Observable<any> {
    return this.assessmentSvc.getQuestionSetHierarchy(this.linkedAssessmentId).pipe(
      tap((questionSet: any) => {
        this.duration = Number(_.get(questionSet, 'expectedDuration', 0)) || 0
      })
    )
  }

  reloadContentHierarchy() {
    if (!this.contentId) {
      return
    }
    this.assessmentSvc.getContentHierarchy(this.contentId).subscribe({
      next: (res: any) => {
        const content = _.get(res, 'result.content')
        if (content) {
          this.contentDetails = content
        }
      },
      error: () => {
        // keep the currently loaded hierarchy
      },
    })
  }
  //#endregion

  //#region (save and preview)
  /**
   * The toc preview renders whatever content object it is handed, so the draft is saved and
   * read back first, otherwise the preview would show stale description / learning outcome.
   */
  saveBeforePreview() {
    if (!this.contentId) {
      return
    }
    this.loaderService.changeLoaderState(true)
    this.persistContent().subscribe({
      next: () => {
        this.loaderService.changeLoaderState(false)
        this.cdr.detectChanges()
      },
      error: (error: HttpErrorResponse) => {
        this.loaderService.changeLoaderState(false)
        this.openSnackBar(_.get(error, 'error.message', 'Unable to refresh the preview, please try again'))
      },
    })
  }

  /** Every content update returns a new versionKey, a stale one fails the next save. */
  syncVersionKey(res: any) {
    const versionKey = _.get(res, 'result.versionKey')
    if (versionKey && this.contentDetails) {
      this.contentDetails.versionKey = versionKey
    }
  }

  getContentUpdateBody() {
    const formValues = this.assessmentDetailsForm.getRawValue()
    return {
      versionKey: _.get(this.contentDetails, 'versionKey', ''),
      name: (formValues.assessmentName || '').trim(),
      description: formValues.description || '',
      purpose: formValues.learningOutcome || '',
      appIcon: formValues.appIcon,
      posterImage: formValues.appIcon,
      creatorLogo: formValues.creatorLogo || '',
      difficultyLevel: formValues.difficultyLevel || '',
      license: formValues.license || DEFAULT_LICENSE,
      keywords: formValues.keywords || [],
      // the content schema types duration as a String, a number fails validation
      duration: String(this.duration || 0),
      ...this.assessmentSvc.buildPlanMetadata(formValues.linkedPlan),
    }
  }

  saveAndExit() {
    if (!this.validateBasicDetails()) {
      return
    }
    this.loaderService.changeLoaderState(true)
    // the duration lives on the question set and the collection only mirrors it, so it is
    // read back first - step 2 can have changed it since it was last mirrored
    this.readLinkedDuration().pipe(
      switchMap(() => this.assessmentSvc.updateContent(this.contentId, this.getContentUpdateBody()))
    ).subscribe({
      next: (res: any) => {
        this.syncVersionKey(res)
        this.openSnackBar('Assessment details saved successfully')
        setTimeout(() => {
          this.loaderService.changeLoaderState(false)
          this.navigateBack()
        }, 1000)
      },
      error: (error: HttpErrorResponse) => {
        this.loaderService.changeLoaderState(false)
        this.openSnackBar(_.get(error, 'error.message', 'Something went wrong while saving, please try again'))
      },
    })
  }

  preview() {
    this.validateSteps([STEP_BASIC_DETAILS, STEP_ASSESSMENT]).subscribe((valid: boolean) => {
      if (!valid) {
        return
      }
      const steps = this.stepper?.steps?.toArray() || []
      const previewIndex = steps.findIndex((step: any) => step.label === STEP_PREVIEW)
      if (previewIndex !== -1) {
        this.selectStep(previewIndex)
      }
    })
  }
  //#endregion

  /**
   * Publishing is offered on the preview step, once the admin has seen what the officer
   * will. The window is the linked plan's, and only the plan can correct it, so a window
   * that has already ended blocks the publish rather than asking for a date to be changed
   * here. The server validates all of this again, this is only the near check.
   */
  get canPublish(): boolean {
    return this.openMode === 'edit' && !!this.contentId && !!this.linkedAssessmentId
  }

  publishAssessment() {
    this.validateSteps([STEP_BASIC_DETAILS, STEP_ASSESSMENT]).subscribe((valid: boolean) => {
      if (!valid) {
        return
      }
      const linkedPlan = _.get(this.assessmentDetailsForm, 'controls.linkedPlan.value')
      if (!this.assessmentSvc.isWindowOpen(_.get(linkedPlan, 'endDate'))) {
        this.openSnackBar(comprehensiveAssessmentList.WINDOW_CLOSED_MESSAGE)
        return
      }
      this.openPublishDialog()
    })
  }

  /**
   * The draft is saved before the dialog opens, so what goes Live is what the preview just
   * showed - and so the dialog lists the resources as they were last saved. The two
   * publishes themselves belong to the dialog, which closes true once the assessment is
   * Live and leaves everything as it was if the admin backs out part way through.
   */
  private openPublishDialog() {
    this.loaderService.changeLoaderState(true)
    this.persistContent().subscribe({
      next: () => {
        this.loaderService.changeLoaderState(false)
        const dialogRef = this.dialog.open(PublishResourceComponent, {
          width: '600px',
          height: 'auto',
          autoFocus: false,
          disableClose: true,
          panelClass: 'publish-resource-dialog',
          data: { collection: this.contentDetails, userProfile: this.userProfile },
        })
        dialogRef.afterClosed().subscribe((published: boolean) => {
          if (published) {
            this.openSnackBar('Assessment published successfully')
            // a published assessment belongs to the Live tab, whichever tab it was opened from
            this.pathUrl = 'live'
            // the platform is still finishing the publish, so the tab is opened once it has
            // had its seconds - the loader stays up for them rather than the builder sitting
            // there looking as though nothing happened
            this.loaderService.changeLoaderState(true)
            setTimeout(() => {
              this.loaderService.changeLoaderState(false)
              this.navigateBack()
            }, comprehensiveAssessmentList.PUBLISH_SETTLE_MS)
            return
          }
          // the dialog can have linked another plan on the way out, which leaves the form
          // and the version key here answering for an assessment that has moved on
          this.reloadContent()
        })
      },
      error: (error: HttpErrorResponse) => {
        this.loaderService.changeLoaderState(false)
        this.openSnackBar(_.get(error, 'error.message', 'Unable to save the assessment, please try again'))
      },
    })
  }
  /**
   * Reads the assessment back and patches the form from it. Nothing is lost by it: the draft
   * is saved before the publish dialog opens, so what the api holds is what the form held.
   *
   * Patching the form is an edit as far as the form is concerned, and an edit stales the
   * preview. Here it does not: the content being patched in is the one the api just
   * answered with, and it is what the preview renders - so the preview is marked ready
   * again after the patch, rather than leaving the step blank with nothing to bring it back.
   */
  private reloadContent() {
    this.assessmentSvc.getContentHierarchy(this.contentId).subscribe((res: any) => {
      const content = _.get(res, 'result.content')
      if (content) {
        this.contentDetails = content
        this.previewContent = content
        this.patchAssessmentDetails()
        this.previewReady = true
        this.cdr.detectChanges()
      }
    })
  }
  //#endregion

  //#region (navigation)
  openConfirmationPopup() {
    if (this.openMode !== 'edit') {
      this.navigateBack()
      return
    }
    const dialogData = {
      dialogType: 'warning',
      icon: {
        iconName: 'error_outline',
        iconClass: 'warning-icon',
      },
      message: 'Are you sure you want to exit without saving?',
      buttonsList: [
        { btnAction: false, displayText: 'No', btnClass: 'btn-outline-primary' },
        { btnAction: true, displayText: 'Yes', btnClass: 'successBtn' },
      ],
    }
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      height: 'auto',
      data: dialogData,
      autoFocus: false,
      disableClose: true,
    })
    dialogRef.afterClosed().subscribe((btnAction: any) => {
      if (btnAction) {
        this.navigateBack()
      }
    })
  }

  navigateBack() {
    if (this.router.url.includes('/app/home/comprehensive-assessment')) {
      this.router.navigate(['/app/home/comprehensive-assessment', this.pathUrl])
    } else {
      this.locationService.back()
    }
  }
  //#endregion

  //#region (helpers)
  private openSnackBar(message: string) {
    this.matSnackBar.open(message)
  }
  //#endregion
}
