import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
import { LoaderService } from '../../../../../../../../../../../src/app/services/loader.service'
import {
  comprehensiveAssessment,
  CONTENT_COURSE_CATEGORY,
  QUESTIONSET_PRIMARY_CATEGORY,
} from '../../models/comprehensive-assessment.model'

/**
 * Step 2 of the builder. Delegates the whole question set authoring to
 * `sb-uic-assessment-main` from `@sunbird-cb/consumption`, which internally renders
 * `sb-uic-assessment-basic-info` (Assessment Settings) followed by Add Questions.
 */
@Component({
  selector: 'ws-app-assessment-builder',
  templateUrl: './assessment-builder.component.html',
  styleUrls: ['./assessment-builder.component.scss'],
  standalone: false,
})
export class AssessmentBuilderComponent implements OnChanges {

  @Input() assessmentId = ''
  @Input() openMode = 'edit'
  /** The name given in step 1, which seeds the title of the settings step. */
  @Input() assessmentName = ''
  /** Emits the question set identifier as soon as the assessment is created. */
  @Output() assessmentSaved = new EventEmitter<string>()

  config!: comprehensiveAssessment.IAssessmentConfig

  constructor(private loaderService: LoaderService) {
    this.config = this.buildConfig()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.assessmentId || changes.openMode || changes.assessmentName) {
      this.config = this.buildConfig()
    }
  }

  buildConfig(): comprehensiveAssessment.IAssessmentConfig {
    return {
      identifier: this.assessmentId || '',
      primaryCategory: QUESTIONSET_PRIMARY_CATEGORY,
      // written onto the question set as it is created, and the only thing that tells a Live
      // comprehensive assessment from any other Course Assessment
      contextCategory: CONTENT_COURSE_CATEGORY,
      name:  '',
      isReadOnly: this.openMode === 'view',
    }
  }

  onAssessmentSaved(identifier: string) {
    if (identifier) {
      this.assessmentSaved.emit(identifier)
    }
  }

  onLoader(show: boolean) {
    this.loaderService.changeLoaderState(show)
  }

}
