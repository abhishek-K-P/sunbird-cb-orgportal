import { DatePipe } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, of, throwError } from 'rxjs'
import { catchError, map, mergeMap } from 'rxjs/operators'
import * as _ from 'lodash'
import { environment } from '../../../../../../../../../../src/environments/environment'
import {
  COLLECTION_MIME_TYPE, CONTENT_COURSE_CATEGORY, CONTENT_PRIMARY_CATEGORY, DEFAULT_ACCESS_SETTING,
  DEFAULT_FRAMEWORK, DEFAULT_LICENSE, QUESTIONSET_MIME_TYPE, aparPlan, comprehensiveAssessment,
  comprehensiveAssessmentList,
} from '../models/comprehensive-assessment.model'

const API_END_POINTS = {
  CREATE_CONTENT: 'apis/proxies/v8/action/content/v3/create',
  UPLOAD_CONTENT: 'apis/proxies/v8/upload/action/content/v3/upload',
  CONTENT_HIERARCHY_EDIT: (contentId: string) => `apis/proxies/v8/action/content/v3/hierarchy/${contentId}?mode=edit`,
  UPDATE_CONTENT: (contentId: string) => `apis/proxies/v8/action/content/v3/update/${contentId}`,
  CONTENT_HIERARCHY_UPDATE: 'apis/proxies/v8/action/content/v3/hierarchy/update',
  QUESTIONSET_HIERARCHY_EDIT: (questionSetId: string) => `apis/proxies/v8/questionset/v1/hierarchy/${questionSetId}?mode=edit`,
  // no `mode=edit`: the published copy, the only one that can answer whether it is Live
  QUESTIONSET_READ: (questionSetId: string) => `apis/proxies/v8/questionset/v1/read/${questionSetId}`,
  PUBLISH_QUESTIONSET: (questionSetId: string) => `apis/proxies/v8/ca/questionset/v1/publish/${questionSetId}`,
  CONTENT_SEARCH: 'apis/proxies/v8/sunbirdigot/v4/search',
  PUBLISH_ASSESSMENT: (contentId: string) => `apis/proxies/v8/action/ca/v1/publish/${contentId}`,
  RETIRE_CONTENT: 'apis/proxies/v8/v1/content/retire',
  APAR_PLAN_SEARCH: 'apis/proxies/v8/cbplan/v4/search',
  APAR_PLAN_READ: (planId: string) => `apis/proxies/v8/cbplan/v4/read/${planId}`,
}

const STORAGE_URL_TO_REPLACE = 'https://storage.googleapis.com/igot'
/**
 * The org the publish is made for. The `ca` routes answer against it rather than reading it
 * off the session, so every call of the publish flow carries the user's root org in it.
 */
const ORG_ID_HEADER = 'x-authenticated-user-orgid'

@Injectable()
export class ComprehensiveAssessmentService {

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe
  ) { }

  //#region (content apis)

  createContent(req: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.CREATE_CONTENT, req)
  }

  uploadContent(contentId: string, formData: FormData): Observable<any> {
    return this.http.post<any>(`${API_END_POINTS.UPLOAD_CONTENT}/${contentId}`, formData)
  }

  getContentHierarchy(contentId: string): Observable<any> {
    return this.http.get<any>(API_END_POINTS.CONTENT_HIERARCHY_EDIT(contentId))
  }

  updateContent(contentId: string, content: any): Observable<any> {
    return this.http.patch<any>(API_END_POINTS.UPDATE_CONTENT(contentId), { request: { content } })
  }

  /**
   * Links the question set built in step 2 as a child of the assessment collection so that
   * re-opening a draft (and the step 3 preview) can find it back from the content hierarchy.
   */
  linkAssessmentToCollection(collection: any, assessmentId: string): Observable<any> {
    const rootId = _.get(collection, 'identifier', '')
    const existingChildren: string[] = _.map(_.get(collection, 'children', []), (child: any) => child.identifier)
    const children = _.uniq([...existingChildren, assessmentId])
    const requestBody = {
      request: {
        data: {
          nodesModified: {
            [rootId]: {
              isNew: false,
              root: true,
              metadata: {},
            },
          },
          hierarchy: {
            [rootId]: {
              children,
              name: _.get(collection, 'name', ''),
              contentType: _.get(collection, 'contentType', 'Collection'),
              primaryCategory: _.get(collection, 'primaryCategory', CONTENT_PRIMARY_CATEGORY),
              root: true,
            },
          },
        },
      },
    }
    return this.http.patch<any>(API_END_POINTS.CONTENT_HIERARCHY_UPDATE, requestBody)
  }

  /**
   * Lists the org's comprehensive assessments for one status tab. The collection and the
   * question set built inside it are indexed separately, so the collection mimeType filter
   * is what keeps the linked question sets out of the listing.
   */
  searchAssessments(params: {
    status: string,
    rootOrgId: string,
    query: string,
    pageSize: number,
    pageIndex: number
  }): Observable<{ content: any[], count: number }> {
    const request = {
      locale: ['en'],
      request: {
        // a search always restarts at the first page, the offset belongs to the browsed list
        query: params.query || '',
        limit: params.pageSize,
        offset: params.query ? 0 : params.pageSize * params.pageIndex,
        fields: comprehensiveAssessmentList.SEARCH_FIELDS,
        filters: {
          status: [params.status],
          courseCategory: [CONTENT_COURSE_CATEGORY],
          mimeType: [COLLECTION_MIME_TYPE],
          createdFor: [params.rootOrgId],
        },
        sort_by: { lastUpdatedOn: 'desc' },
      },
    }

    return this.http.post<any>(API_END_POINTS.CONTENT_SEARCH, request).pipe(
      map((res: any) => ({
        content: _.map(_.get(res, 'result.content', []), (row: any) => this.toListRow(row)),
        count: _.get(res, 'result.count', 0),
      }))
    )
  }

  /**
   * Moves a draft collection to Live. The second of the two publishes: the question set it
   * holds has to be Live first, see `publishQuestionSet`.
   */
  publishAssessment(contentId: string, userId: string, rootOrgId: string): Observable<any> {
    return this.http.post<any>(
      API_END_POINTS.PUBLISH_ASSESSMENT(contentId),
      { request: { content: { lastPublishedBy: userId } } },
      this.orgHeader(rootOrgId)
    )
  }

  /**
   * Retire is the delete the content api offers, the row leaves every status tab. The api
   * retires a list at a time and takes it in the body of the DELETE, so the one assessment
   * being deleted is sent as a list of one.
   */
  retireAssessment(contentId: string): Observable<any> {
    return this.http.delete<any>(API_END_POINTS.RETIRE_CONTENT, {
      body: { request: { contentIds: [contentId] } },
    })
  }

  //#endregion

  //#region (question set apis)

  /** The first of the two publishes: the question set the assessment holds goes Live. */
  publishQuestionSet(questionSetId: string, rootOrgId: string): Observable<any> {
    return this.http.post<any>(
      API_END_POINTS.PUBLISH_QUESTIONSET(questionSetId),
      { request: { questionset: {} } },
      this.orgHeader(rootOrgId)
    )
  }

  /**
   * The status of the published question set. The draft read answers `Draft` however far
   * along the publish is, so the live copy is the only one worth asking. It does not exist
   * until the publish finishes, so a read that fails is reported as `not Live yet` rather
   * than as an error - the caller offers the publish again, it never blocks on this.
   */
  getQuestionSetStatus(questionSetId: string, rootOrgId: string): Observable<string> {
    return this.http.get<any>(API_END_POINTS.QUESTIONSET_READ(questionSetId), this.orgHeader(rootOrgId)).pipe(
      // the read answers under `questionset`, the hierarchy under `questionSet`
      map((res: any) => _.get(res, 'result.questionset.status', '') ||
        _.get(res, 'result.questionSet.status', '')),
      catchError(() => of(''))
    )
  }

  getQuestionSetHierarchy(questionSetId: string): Observable<any> {
    return this.http.get<any>(API_END_POINTS.QUESTIONSET_HIERARCHY_EDIT(questionSetId)).pipe(
      map((response: any) => _.get(response, 'result.questionSet', {}))
    )
  }

  //#endregion

  //#region (apar plan apis)

  /**
   * Live APAR plans of the org, one page at a time. The v4 search is asked in the query
   * language it takes, and it is the search that leaves out a plan another assessment
   * already holds - `applyOrgIdFilter` scopes it to the caller's org, so no org id is named.
   *
   * A plan with APAR assignment off is asked out by the query itself. The local drop below it
   * stays as a backstop, for an api answering with more than it was asked for: only an explicit
   * `false` drops a plan there, since a row carrying no `isApar` at all is a field the search
   * did not project rather than a plan with the toggle off, and dropping those would empty the
   * picker against an api that is otherwise answering correctly. Whatever it drops, the count
   * stays the one the api reports, so a page can render fewer rows than the paginator counts.
   */
  searchAparPlans(params: {
    planYear: string,
    searchString: string,
    pageIndex: number,
    pageSize: number
  }): Observable<{ plans: aparPlan.IPlanRow[], count: number }> {
    const must: any[] = [
      { term: { 'status.keyword': comprehensiveAssessmentList.STATUS_LIVE } },
      { term: { 'isApar': true } },
    ]
    if (params.planYear && params.planYear !== aparPlan.ALL_YEARS) {
      must.push({ term: { 'planYear.keyword': params.planYear } })
    }

    const request: any = {
      ...this.buildPlanSearchRequest(must, params.pageIndex, params.pageSize),
      searchString: params.searchString || '',
    }
    // the api orders by relevance while a search is on, the browsed list by newest first
    if (!params.searchString) {
      request.orderBy = 'createdAt'
      request.orderDirection = 'desc'
    }

    return this.http.post<any>(API_END_POINTS.APAR_PLAN_SEARCH, { request }).pipe(
      map((res: any) => ({
        plans: _.map(
          _.filter(_.get(res, 'result.result.data', []), (plan: any) => _.get(plan, 'isApar') !== false),
          (plan: any) => this.toPlanRow(plan)
        ),
        count: _.get(res, 'result.result.totalCount', 0),
      }))
    )
  }

  /**
   * A v4 plan search, in the query language it takes. Every search of the flow asks for the
   * plans no assessment holds yet - `caLinkedId` is what an assessment writes onto the plan
   * it takes - and is scoped to the caller's org by the api rather than by a named org id.
   */
  private buildPlanSearchRequest(must: any[], pageNumber: number, pageSize: number): any {
    return {
      query: {
        bool: {
          must,
          // a plan an assessment already holds is not offered for a second one
          must_not: [{ exists: { field: aparPlan.LINKED_ASSESSMENT_FIELD } }],
        },
      },
      pageNumber,
      pageSize,
      applyOrgIdFilter: true,
    }
  }

  /**
   * Whether this assessment can still be published against the plan it holds. The plan is
   * read rather than searched for, and `caLinkedId` on it is the whole answer: nothing holds
   * the plan, this assessment holds it, or another one has taken it since it was linked.
   *
   * The picker only guards the moment of linking, which can be days before the publish.
   */
  isPlanAvailable(planId: string, contentId: string): Observable<boolean> {
    if (!planId) {
      return of(false)
    }
    return this.http.get<any>(API_END_POINTS.APAR_PLAN_READ(planId)).pipe(
      map((res: any) => {
        const heldBy = _.get(this.readPlanResponse(res), aparPlan.LINKED_ASSESSMENT_FIELD, '') || ''
        return !heldBy || heldBy === contentId
      })
    )
  }

  /**
   * The plan out of a read. `api.cb.plan.v4.read.byId` answers under `result.content`, which
   * is not where the search answers (`result.result.data`) - reading the wrong one finds no
   * `caLinkedId` at all, and a plan another assessment holds then passes as free.
   */
  private readPlanResponse(res: any): any {
    return _.get(res, 'result.content', {}) || {}
  }

  /**
   * Writes the linked plan onto the assessment on its own. The publish dialog changes the
   * plan without the builder's form behind it, so only the linkage and the version key are
   * sent - the rest of the content is not the dialog's to know, let alone to overwrite.
   */
  updateLinkedPlan(contentId: string, versionKey: string, plan: aparPlan.ILinkedPlan): Observable<any> {
    return this.updateContent(contentId, {
      versionKey,
      ...this.buildPlanMetadata(plan),
    })
  }

  /** Shapes a cbplan search row into the row the picker table renders. */
  private toPlanRow(plan: any): aparPlan.IPlanRow {
    const endDate = _.get(plan, 'endDate', '')
    return {
      endDate,
      id: _.get(plan, 'id', ''),
      name: _.get(plan, 'name', ''),
      planYear: _.get(plan, 'planYear', ''),
      endDateDisplay: this.toDisplayDate(endDate),
      orgName: _.get(plan, 'orgName', '') || _.get(plan, 'departmentName', ''),
      gatingCourseCount: this.countGatingCourses(plan),
      contentList: this.readContentList(plan),
      // the plan says for itself what holds it, the search asks for the ones nothing does
      hasActiveAssessment: !!_.get(plan, aparPlan.LINKED_ASSESSMENT_FIELD, ''),
      // the open years are the picker's to know, the search does not answer for them
      isYearClosed: false,
    }
  }

  /** Courses the plan marks mandatory, the gating set the assessment unlock is derived from. */
  private countGatingCourses(plan: any): number {
    return _.filter(_.get(plan, 'contentList', []), (content: any) => !!_.get(content, 'mandatory')).length
  }

  /** The plan's courses, kept down to the identifier and the flag that gates the unlock. */
  private readContentList(plan: any): aparPlan.IPlanContent[] {
    return _.map(_.get(plan, 'contentList', []), (content: any) => ({
      identifier: _.get(content, 'identifier', ''),
      mandatory: !!_.get(content, 'mandatory'),
    }))
  }

  /**
   * The linked plan as it is written onto the assessment content. The linkage is the whole
   * of it: the plan used to be denormalised to a set of flat `apar*` keys beside it, and
   * those are no longer written. They are still read - see `readPlanMetadata` - so an
   * assessment saved with them opens the way it always did.
   */
  buildPlanMetadata(plan: aparPlan.ILinkedPlan | null): any {
    return {
      [aparPlan.TRAINING_PLAN_KEY]: this.buildTrainingPlanLink(plan),
    }
  }

  /**
   * The plan and the courses it gates, each carrying the flag the unlock is read off. The
   * plan's own values travel with it: nothing else on the assessment holds them any more,
   * and neither the reopened builder nor the dashboard can join back to the plan for them.
   */
  private buildTrainingPlanLink(plan: aparPlan.ILinkedPlan | null): aparPlan.ITrainingPlanLink {
    return {
      identifier: _.get(plan, 'id', ''),
      name: _.get(plan, 'name', ''),
      planYear: _.get(plan, 'planYear', ''),
      endDate: _.get(plan, 'endDate', ''),
      orgName: _.get(plan, 'orgName', ''),
      contentList: this.readContentList(plan),
    }
  }

  /**
   * The linked plan read back off a saved assessment, null while none is linked. The
   * linkage answers for the plan; the flat `apar*` keys are only what an assessment saved
   * before they stopped being written still has to be read from.
   */
  readPlanMetadata(content: any): aparPlan.ILinkedPlan | null {
    const link = this.readTrainingPlanLink(content)
    const id = _.get(link, 'identifier', '') || _.get(content, aparPlan.METADATA.planId, '')
    if (!id) {
      return null
    }
    const contentList = _.get(link, 'contentList', [])
    return {
      id,
      contentList,
      // the linkage answers for the plan, the flat copies only for an assessment saved
      // while they were still written
      name: _.get(link, 'name', '') || _.get(content, aparPlan.METADATA.planName, ''),
      planYear: _.get(link, 'planYear', '') || _.get(content, aparPlan.METADATA.reportingYear, ''),
      endDate: _.get(link, 'endDate', '') || _.get(content, aparPlan.METADATA.windowEndDate, ''),
      orgName: _.get(link, 'orgName', '') || _.get(content, aparPlan.METADATA.owningOrg, ''),
      // the course list is what says how many are gating, the stored count is only what an
      // assessment linked before the list was written onto it still has to answer from
      gatingCourseCount: contentList.length
        ? this.countGatingCourses({ contentList })
        : Number(_.get(content, aparPlan.METADATA.gatingCourseCount, 0)) || 0,
    }
  }

  /**
   * The linkage as the api hands it back. It is written as an object, but a content schema
   * that types the field as a String returns it serialised, so both are read.
   */
  private readTrainingPlanLink(content: any): aparPlan.ITrainingPlanLink | null {
    const link = _.get(content, aparPlan.TRAINING_PLAN_KEY)
    if (!link) {
      return null
    }
    if (_.isString(link)) {
      try {
        return JSON.parse(link)
      } catch (error) {
        // a linkage that cannot be read leaves the display copies to answer for the plan
        return null
      }
    }
    return link
  }

  //#endregion

  //#region (helpers)

  /** Shapes a search hit into the flat, display ready row the listing table renders. */
  private toListRow(row: any): any {
    const plan = this.readPlanMetadata(row)
    return {
      ...row,
      createdOn: this.toDisplayDate(_.get(row, 'createdOn')),
      lastUpdatedOn: this.toDisplayDate(_.get(row, 'lastUpdatedOn')),
      lastPublishedOn: this.toDisplayDate(_.get(row, 'lastPublishedOn')),
      creator: _.get(row, 'creator', '') || '-',
      // Served through the portal rather than straight off the bucket: a published
      // assessment's thumbnail is copied under `/collection`, and those objects are not
      // publicly readable - fetching one from storage answers 403 and the row falls back
      // to its placeholder. `toPublicUrl` is the same rewrite the upload does.
      appIcon: this.toPublicUrl(_.get(row, 'appIcon', '')),
      // the listing draws Live rows from the poster, so it needs the same rewrite - left
      // raw it is fetched straight off the bucket, which answers 403 for a published object
      posterImage: this.toPublicUrl(_.get(row, 'posterImage', '')),
      durationDisplay: this.toDisplayDuration(Number(_.get(row, 'duration', 0)) || 0),
      // The plan and everything derived from it are read off the assessment rather than
      // fetched again, they travel with the linkage written onto it
      planName: _.get(plan, 'name', '') || '-',
      reportingYear: _.get(plan, 'planYear', '') || '-',
      assessmentWindow: this.toDisplayDate(_.get(plan, 'endDate', '')) || '-',
      // the publish guard reads the window off the row rather than going back to the plan
      [comprehensiveAssessmentList.WINDOW_END_KEY]: _.get(plan, 'endDate', ''),
    }
  }

  /**
   * The assessment window is the linked plan's, and the plan is the only place it can be
   * corrected — so a window that has already ended blocks publishing rather than asking the
   * admin to change a date the assessment does not own.
   */
  isWindowOpen(endDate: any): boolean {
    if (!endDate) {
      return false
    }
    const windowEnd = new Date(endDate).getTime()
    if (Number.isNaN(windowEnd)) {
      return false
    }
    return windowEnd >= Date.now()
  }

  private toDisplayDate(value: any): string {
    return value ? (this.datePipe.transform(value, 'dd MMM, yyyy') || '') : ''
  }

  /** Same hr/min shape the basic details step shows, the api stores duration in seconds. */
  private toDisplayDuration(duration: number): string {
    if (!duration || duration <= 0) {
      return '-'
    }
    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    const parts: string[] = []
    if (hours > 0) {
      parts.push(`${hours} hr`)
    }
    if (minutes > 0) {
      parts.push(`${minutes} min`)
    }
    return parts.length ? parts.join(' ') : `${Math.floor(duration)} sec`
  }

  /**
   * Creates an `Asset` content for the picked image, uploads the file against it and
   * resolves with the public artifact url to be used as appIcon / posterImage.
   */
  uploadImageAsset(file: File, userProfile: any): Observable<string> {
    const request = {
      request: {
        content: {
          code: this.generateCode(),
          contentType: 'Asset',
          createdBy: _.get(userProfile, 'userId', ''),
          creator: this.readCreatorName(userProfile),
          mimeType: file.type,
          mediaType: 'image',
          name: file.name,
          language: ['English'],
          license: DEFAULT_LICENSE,
          primaryCategory: 'Asset',
          organisation: [_.get(userProfile, 'departmentName', '')],
          createdFor: [_.get(userProfile, 'rootOrgId', '')],
        },
      },
    }

    return this.createContent(request).pipe(
      mergeMap((res: any) => {
        const contentId = _.get(res, 'result.identifier', '')
        if (!contentId) {
          return throwError(() => new Error('Something went wrong while creating the image asset'))
        }
        const formData: FormData = new FormData()
        formData.append('data', file)
        return this.uploadContent(contentId, formData).pipe(
          map((fdata: any) => this.toPublicUrl(_.get(fdata, 'result.artifactUrl', '')))
        )
      })
    )
  }

  /** Creates the assessment collection with the name, thumbnail and logo captured in the dialog. */
  createAssessmentCollection(name: string, appIcon: string, creatorLogo: string, userProfile: any,
    userEmail: string): Observable<any> {
    const userId = _.get(userProfile, 'userId', '')
    const creator = this.readCreatorName(userProfile)
    const request = {
      request: {
        content: {
          appIcon,
          creator,
          name,
          posterImage: appIcon,
          ...(creatorLogo ? { creatorLogo } : {}),
          code: this.generateCode(),
          contentType: 'Collection',
          createdBy: userId,
          creatorContacts: [{
            id: userId,
            name: creator,
            email: userEmail || _.get(userProfile, 'email', ''),
          }],
          creatorIDs: [userId],
          createdFor: [_.get(userProfile, 'rootOrgId', '')],
          framework: DEFAULT_FRAMEWORK,
          mimeType: COLLECTION_MIME_TYPE,
          organisation: [_.get(userProfile, 'departmentName', '')],
          // who the assessment is from, as the learner reads it off the card: the org of the
          // admin creating it, which is the same name `organisation` carries
          source: _.get(userProfile, 'departmentName', ''),
          isExternal: false,
          primaryCategory: CONTENT_PRIMARY_CATEGORY,
          courseCategory: CONTENT_COURSE_CATEGORY,
          license: DEFAULT_LICENSE,
          ownershipType: ['createdFor'],
          language: ['English'],
          accessSetting: DEFAULT_ACCESS_SETTING,
          versionKey: '1',
        },
      },
    }
    return this.createContent(request)
  }

  /** Picks the question set linked to the collection, if any. */
  getLinkedAssessmentId(collection: any): string {
    const children = _.get(collection, 'children', [])
    const questionSet = _.find(children, (child: any) => _.get(child, 'mimeType', '') === QUESTIONSET_MIME_TYPE)
    return _.get(questionSet, 'identifier', '')
  }

  /**
   * The resources the assessment holds, listed for the publish dialog. A comprehensive
   * assessment carries the one question set built in step 2, but the collection is read for
   * all of them so the dialog lists whatever is actually there.
   */
  getLinkedResources(collection: any): comprehensiveAssessment.ILinkedResource[] {
    const questionSets = _.filter(
      _.get(collection, 'children', []),
      (child: any) => _.get(child, 'mimeType', '') === QUESTIONSET_MIME_TYPE
    )
    return _.map(questionSets, (child: any) => ({
      identifier: _.get(child, 'identifier', ''),
      name: _.get(child, 'name', ''),
      status: _.get(child, 'status', ''),
    }))
  }

  /** Nothing is sent for an org that is not known, rather than an empty header. */
  private orgHeader(rootOrgId: string): { headers?: { [header: string]: string } } {
    return rootOrgId ? { headers: { [ORG_ID_HEADER]: rootOrgId } } : {}
  }

  /**
   * The creator as the content api records them, on the content itself and in its contacts.
   * The profile answers the given name under either spelling depending on which read it came
   * from, so both are tried and the first that holds anything wins - they are the same field
   * rather than two halves of a name, so one is picked instead of joining them. The login
   * handle is deliberately not among them: `userName` is not what an assessment is authored by.
   */
  private readCreatorName(userProfile: any): string {
    const firstName = _.get(userProfile, 'firstName', '') || _.get(userProfile, 'firstname', '')
    return `${firstName || ''}`.trim()
  }

  /** Sunbird expects a 16 digit numeric code on create. */
  generateCode(): string {
    let code = ''
    // tslint:disable-next-line: no-increment-decrement
    for (let i = 0; i < 16; i++) {
      code += Math.floor(Math.random() * 10)
    }
    return code
  }

  /** Rewrites a raw storage url to the portal's public asset url. */
  toPublicUrl(createdUrl: string): string {
    if (createdUrl && createdUrl.startsWith(STORAGE_URL_TO_REPLACE)) {
      const urlSplice = createdUrl.slice(STORAGE_URL_TO_REPLACE.length).split('/')
      const domain = (environment.domainName || '').replace(/\/$/, '')
      return `${domain}/assets/public/${urlSplice.slice(1).join('/')}`
    }
    return createdUrl
  }

  //#endregion
}
