import { DatePipe } from '@angular/common'
import { Component, Input } from '@angular/core'
import { FormGroup } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import * as _ from 'lodash'
import {
  type EditorConfig,
  ClassicEditor,
  Autosave,
  BlockQuote,
  Bold,
  Essentials,
  Heading,
  Indent,
  IndentBlock,
  Italic,
  Link,
  List,
  Paragraph,
  Underline,
} from 'ckeditor5'
import { aparPlan, comprehensiveAssessment } from '../../models/comprehensive-assessment.model'
import { richTextLength } from '../../models/rich-text.validator'
import { BasicInfoComponent } from '../../dialogs/basic-info/basic-info.component'
import { PlanPickerComponent } from '../../dialogs/plan-picker/plan-picker.component'

@Component({
  selector: 'ws-app-assessment-basic-details',
  templateUrl: './assessment-basic-details.component.html',
  styleUrls: ['./assessment-basic-details.component.scss'],
  standalone: false,
})
export class AssessmentBasicDetailsComponent {

  @Input() assessmentDetails!: FormGroup
  @Input() openMode = 'edit'
  @Input() userProfile: any
  /** Duration in seconds, derived from the question set built in step 2. */
  @Input() duration = 0

  descriptionMinLength = comprehensiveAssessment.DESCRIPTION_MIN_LENGTH
  descriptionMaxLength = comprehensiveAssessment.DESCRIPTION_MAX_LENGTH
  learningOutcomeMinLength = comprehensiveAssessment.LEARNING_OUTCOME_MIN_LENGTH
  learningOutcomeMaxLength = comprehensiveAssessment.LEARNING_OUTCOME_MAX_LENGTH
  keywordMaxLength = comprehensiveAssessment.KEYWORD_MAX_LENGTH
  knowledgeLevels = comprehensiveAssessment.KNOWLEDGE_LEVELS
  licenses = comprehensiveAssessment.LICENSES

  ckEditor = ClassicEditor
  ckEditorConfig: EditorConfig = {}

  constructor(
    private dialog: MatDialog,
    private datePipe: DatePipe,
  ) {
    this.ckEditorConfig = {
      toolbar: {
        items: [
          'undo',
          'redo',
          '|',
          'heading',
          '|',
          'bold',
          'italic',
          'underline',
          '|',
          'bulletedList',
          'numberedList',
          '|',
          'link',
        ],
        shouldNotGroupWhenFull: false,
      },
      plugins: [
        Autosave,
        BlockQuote,
        Bold,
        Essentials,
        Heading,
        Indent,
        IndentBlock,
        Italic,
        Link,
        List,
        Paragraph,
        Underline,
      ],
      heading: {
        options: [
          { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
          { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
          { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
          { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
        ],
      },
      link: {
        addTargetToExternalLinks: true,
        defaultProtocol: 'https://',
      },
      typing: {
        // stops auto transformations from bypassing the length checks
        transformations: { include: [] },
      },
    }
  }

  /** The linked plan, the single source of every value this step does not ask for. */
  get linkedPlan(): aparPlan.ILinkedPlan | null {
    return _.get(this.assessmentDetails, 'controls.linkedPlan.value', null)
  }

  /** End of the assessment window, read off the plan timeline. */
  get planWindowDisplay(): string {
    const endDate = _.get(this.linkedPlan, 'endDate', '')
    return endDate ? (this.datePipe.transform(endDate, 'dd MMM, yyyy') || '') : ''
  }

  /**
   * The access criteria the plan carries, as the chip on the plan card reads it. A plan with
   * no gating course says so in words: `0 gating course(s)` read as a value that had failed
   * to load rather than a plan that is open from the start.
   */
  get gatingDisplay(): string {
    const count = _.get(this.linkedPlan, 'gatingCourseCount', 0)
    if (!count) {
      return 'No gating courses'
    }
    return `Unlocks after ${count} gating ${count === 1 ? 'course' : 'courses'}`
  }

  /**
   * Changing the plan recomputes every derived value together, so the plan is patched as one
   * object and never field by field.
   */
  openPlanPicker() {
    const dialogRef = this.dialog.open(PlanPickerComponent, {
      panelClass: 'apar-plan-picker-dialog',
      width: '840px',
      maxWidth: '92vw',
      autoFocus: false,
      data: {
        userProfile: this.userProfile,
        selectedPlanId: _.get(this.linkedPlan, 'id', ''),
      },
    })

    dialogRef.afterClosed().subscribe((plan: aparPlan.ILinkedPlan) => {
      if (!plan) {
        return
      }
      this.assessmentDetails.patchValue({ linkedPlan: plan })
      this.assessmentDetails.updateValueAndValidity()
    })
  }

  get appIcon(): string {
    return _.get(this.assessmentDetails, 'controls.appIcon.value', '')
  }

  get creatorLogo(): string {
    return _.get(this.assessmentDetails, 'controls.creatorLogo.value', '')
  }

  get assessmentName(): string {
    return _.get(this.assessmentDetails, 'controls.assessmentName.value', '')
  }

  /**
   * Name and image are authored together in the same dialog that creates the assessment,
   * so editing them reuses it in `edit` mode and patches whatever it hands back.
   */
  openBasicInfoDialog() {
    const dialogRef = this.dialog.open(BasicInfoComponent, {
      panelClass: 'create-comprehensive-assessment-dialog',
      autoFocus: false,
      data: {
        mode: 'edit',
        userProfile: this.userProfile,
        assessmentName: this.assessmentName,
        appIcon: this.appIcon,
        creatorLogo: this.creatorLogo,
      },
    })

    dialogRef.afterClosed().subscribe((updated: any) => {
      if (!updated) {
        return
      }
      this.assessmentDetails.patchValue({
        assessmentName: _.get(updated, 'assessmentName', ''),
        appIcon: _.get(updated, 'appIcon', ''),
        creatorLogo: _.get(updated, 'creatorLogo', ''),
      })
      this.assessmentDetails.updateValueAndValidity()
    })
  }

  /** Duration is never typed in, it always mirrors the assessment built in step 2. */
  get durationDisplay(): string {
    if (!this.duration || this.duration <= 0) {
      return ''
    }
    const hours = Math.floor(this.duration / 3600)
    const minutes = Math.floor((this.duration % 3600) / 60)
    const seconds = Math.floor(this.duration % 60)
    const parts: string[] = []
    if (hours > 0) {
      parts.push(`${hours} hr`)
    }
    if (minutes > 0) {
      parts.push(`${minutes} min`)
    }
    if (seconds > 0 && hours === 0) {
      parts.push(`${seconds} sec`)
    }
    return parts.join(' ')
  }

  get descriptionLength(): number {
    return richTextLength(_.get(this.assessmentDetails, 'controls.description.value', ''))
  }

  get keywords(): string[] {
    return _.get(this.assessmentDetails, 'controls.keywords.value', []) || []
  }

  /**
   * Keywords are held as the array the content platform stores, so each one is added on
   * Enter or on leaving the field. A repeat is dropped rather than refused - the keyword
   * is already there, which is what the author was after.
   */
  addKeyword(input: HTMLInputElement, event?: Event): void {
    if (event) {
      event.preventDefault()
    }
    const keyword = (input.value || '').trim()
    input.value = ''
    if (!keyword || this.keywords.includes(keyword)) {
      return
    }
    this.patchKeywords([...this.keywords, keyword])
  }

  removeKeyword(keyword: string): void {
    this.patchKeywords(this.keywords.filter((existing: string) => existing !== keyword))
  }

  private patchKeywords(keywords: string[]): void {
    this.assessmentDetails.patchValue({ keywords })
    // the field is mandatory, so emptying it has to report itself without a visit first
    this.assessmentDetails.controls['keywords'].markAsTouched()
    this.assessmentDetails.updateValueAndValidity()
  }

  get learningOutcomeLength(): number {
    return richTextLength(_.get(this.assessmentDetails, 'controls.learningOutcome.value', ''))
  }

  getConfig(): EditorConfig {
    return this.ckEditorConfig
  }

  onEditorReady(editor: any) {
    editor.editing.view.change((writer: any) => {
      writer.setStyle('min-height', '150px', editor.editing.view.document.getRoot())
    })
    this.removePoweredBy()
    if (this.openMode === 'view') {
      editor.enableReadOnlyMode('comprehensive-assessment-preview')
    }
  }

  onEditorFocus() {
    this.removePoweredBy()
  }

  private removePoweredBy() {
    const poweredByEl = document.querySelector('.ck.ck-powered-by')
    if (poweredByEl) {
      poweredByEl.remove()
    }
  }

  showValidationMsg(controlName: string, validationType: string): boolean {
    const control = _.get(this.assessmentDetails, `controls.${controlName}`)
    return !!(control && control.touched && control.invalid && control.hasError(validationType))
  }
}
