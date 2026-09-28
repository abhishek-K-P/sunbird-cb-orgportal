/**
 * Content categories used while creating the "Comprehensive assessment" collection.
 * The collection itself is created as a `Standalone Assessment` content, the
 * question set built in step 2 is created as a `Course Assessment` question set.
 *
 * The platform has no `Comprehensive Assessment` course category yet. When the backend
 * takes one, only `CONTENT_COURSE_CATEGORY` moves to it: the settings step of the
 * consumption library already accepts either value, so this is the only line to change.
 */
export const CONTENT_PRIMARY_CATEGORY = 'Standalone Assessment'
export const CONTENT_COURSE_CATEGORY = 'Comprehensive Assessment'
export const COLLECTION_MIME_TYPE = 'application/vnd.ekstep.content-collection'
export const QUESTIONSET_MIME_TYPE = 'application/vnd.sunbird.questionset'
export const QUESTIONSET_PRIMARY_CATEGORY = 'Course Assessment'
/**
 * What the question set is written with as its `contextCategory`, and how the consumption
 * side tells a comprehensive assessment from any other `Course Assessment` once it is Live.
 * It has its own constant rather than borrowing `CONTENT_COURSE_CATEGORY`: that one is a
 * placeholder waiting on a platform category and is meant to move, this is what is written
 * onto the question set.
 */
export const QUESTIONSET_CONTEXT_CATEGORY = 'Comprehensive Assessment'
export const DEFAULT_ACCESS_SETTING = 'allUsers'
export const DEFAULT_FRAMEWORK = 'igot'
export const DEFAULT_LICENSE = 'CC BY 4.0'

export const noSpecialCharAssessment = new RegExp(
  /^[a-zA-Z0-9.\-_$\/:\[\]' !]*$/ // NOSONAR
)

export namespace comprehensiveAssessment {
  /** Config contract expected by `sb-uic-assessment-main` of `@sunbird-cb/consumption` */
  export interface IAssessmentConfig {
    identifier: string
    primaryCategory: string
    /** Tells the settings step this is a comprehensive assessment, which fixes several of them. */
    courseCategory: string
    contextCategory: string
    /** Seeds the settings title, so the name given in step 1 is not typed a second time. */
    name: string
    isReadOnly: boolean
  }

  /**
   * A resource the assessment holds - the question set built in step 2. The publish dialog
   * lists them by name, and each has to be Live before the assessment can follow.
   */
  export interface ILinkedResource {
    identifier: string
    name: string
    status: string
  }

  export const IMAGE_MAX_SIZE = (500 * 1024)
  export const NAME_MIN_LENGTH = 10
  export const NAME_MAX_LENGTH = 70
  /** The description is plain text, the learning outcome is authored as rich text. */
  export const DESCRIPTION_MIN_LENGTH = 100
  export const DESCRIPTION_MAX_LENGTH = 1000
  export const LEARNING_OUTCOME_MIN_LENGTH = 250
  export const LEARNING_OUTCOME_MAX_LENGTH = 2000
  export const KEYWORD_MAX_LENGTH = 50

  /** The knowledge level the assessment is pitched at, stored as `difficultyLevel`. */
  export const KNOWLEDGE_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

  /** Licenses the content platform accepts, `DEFAULT_LICENSE` being the one seeded. */
  export const LICENSES = [
    'CC BY 4.0',
    'CC BY-NC 4.0',
    'CC BY-NC-SA 4.0',
    'CC BY-SA 4.0',
    'Standard YouTube License',
  ]
}

export namespace aparPlan {
  /**
   * The linkage itself: the plan and the courses it gates, written as one object so the
   * unlock rule can be read off the assessment without going back to the plan for it.
   */
  export const TRAINING_PLAN_KEY = 'trainingPlan_v2'

  /**
   * Keys the plan used to be denormalised to on the assessment collection, beside the
   * linkage. Nothing writes them any more - the linkage above carries the plan - but the
   * dashboard columns and the reopened builder still read them, so an assessment saved
   * while they were written keeps answering for its plan. A rename only happens here.
   */
  export const METADATA = {
    planId: 'aparPlanId',
    planName: 'aparPlanName',
    reportingYear: 'aparYear',
    windowEndDate: 'aparPlanEndDate',
    owningOrg: 'aparPlanOrgName',
    gatingCourseCount: 'aparGatingCourseCount',
  }

  /** One course of the plan, `mandatory` being the flag that gates the assessment. */
  export interface IPlanContent {
    identifier: string
    mandatory: boolean
  }

  /**
   * The shape `trainingPlan_v2` holds on the assessment content. It carries the plan itself
   * as well as the courses it gates: the flat `apar*` copies are no longer written, so this
   * is the only place the reopened builder and the dashboard can read the plan from.
   */
  export interface ITrainingPlanLink {
    identifier: string
    name: string
    planYear: string
    endDate: string
    orgName: string
    contentList: IPlanContent[]
  }

  export const PAGE_SIZE = 20
  /** Value the reporting year filter carries while it is not narrowed to one year. */
  export const ALL_YEARS = 'all'

  /**
   * The assessment a plan is already held by, written onto the plan itself. The picker asks
   * the search for the plans that do not carry it, so a plan cannot be linked to a second
   * assessment - it is the api side of what the picker used to work out for itself.
   */
  export const LINKED_ASSESSMENT_FIELD = 'caLinkedId'

  /** A Live APAR plan, flattened off the cbplan search row for the picker table. */
  export interface IPlanRow {
    id: string
    name: string
    planYear: string
    endDate: string
    endDateDisplay: string
    orgName: string
    gatingCourseCount: number
    /** The plan's courses, carried through so the linkage can be written from the row. */
    contentList: IPlanContent[]
    /** A Live assessment already points at this plan, so it cannot be linked again. */
    hasActiveAssessment: boolean
    /** The reporting year is closed, so no new assessment can be linked to this plan. */
    isYearClosed: boolean
  }

  /** What is kept on the assessment once a plan is linked, the source of every derived value. */
  export interface ILinkedPlan {
    id: string
    name: string
    planYear: string
    endDate: string
    orgName: string
    gatingCourseCount: number
    contentList: IPlanContent[]
  }
}

export namespace comprehensiveAssessmentList {
  /** Status values the listing tabs map onto, as indexed by the composite search. */
  export const STATUS_LIVE = 'Live'
  export const STATUS_DRAFT = 'Draft'
  /** What the content api leaves behind on a delete - see `retireAssessment`. */
  export const STATUS_RETIRED = 'Retired'
  export const DEFAULT_PAGE_SIZE = 20

  /**
   * What the platform is given to finish a publish before the Live tab is opened on it. The
   * publish call answers as soon as it is taken, and the search indexes the assessment a
   * moment after that - opening the tab straight away lists everything but what was just
   * published, which reads as the publish having failed.
   */
  export const PUBLISH_SETTLE_MS = 10000

  /**
   * The same grace for a delete. Retiring answers as soon as it is taken and the search drops
   * the assessment a moment later, so listing a tab straight away still answers with the row
   * that was just deleted - which reads as the delete having failed.
   */
  export const DELETE_SETTLE_MS = 10000

  /** Where the window end sits on a listing row, resolved from the plan the row carries. */
  export const WINDOW_END_KEY = 'windowEndDate'
  export const WINDOW_CLOSED_MESSAGE =
    'The assessment window of the linked APAR plan has ended, this assessment can no longer be published'

  export interface columnData {
    displayName: string
    key: string
    cellType: string
    imageKey?: string
    /** Read when `imageKey` holds nothing, or when the image it named could not be loaded. */
    fallbackImageKey?: string
    cellClass?: string
  }

  export interface tableData {
    columns: columnData[]
    showSearchBox: boolean
    showPagination: boolean
    noDataMessage?: string
  }

  export interface pagination {
    startIndex: number
    lastIndex: number
    pageSize: number
    pageIndex: number
    totalCount: number
  }

  export interface menuItems {
    icon?: string
    btnText: string
    action: string
  }

  /** Fields the listing needs back from the search, everything else is dropped by the api. */
  export const SEARCH_FIELDS = [
    'name',
    'appIcon',
    'posterImage',
    'status',
    'primaryCategory',
    'courseCategory',
    'contentType',
    'mimeType',
    'duration',
    'creator',
    'createdBy',
    'createdFor',
    'createdOn',
    'lastUpdatedOn',
    'lastPublishedOn',
    'versionKey',
    // the linked plan, which the dashboard reads the plan name, year and window off
    aparPlan.TRAINING_PLAN_KEY,
    // the same values as an assessment saved before the linkage carried them holds them
    'aparPlanName',
    'aparYear',
    'aparPlanEndDate',
  ]
}
