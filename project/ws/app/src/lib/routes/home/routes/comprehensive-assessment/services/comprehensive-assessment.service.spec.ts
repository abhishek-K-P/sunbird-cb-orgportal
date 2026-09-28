import { DatePipe } from '@angular/common'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { aparPlan } from '../models/comprehensive-assessment.model'
import { environment } from 'src/environments/environment'
import { ComprehensiveAssessmentService } from './comprehensive-assessment.service'

const PLAN_SEARCH_URL = 'apis/proxies/v8/cbplan/v4/search'
const PLAN_READ_URL = 'apis/proxies/v8/cbplan/v4/read/plan-1'
/**
 * A plan as `api.cb.plan.v4.read.byId` hands it back - under `result.content`, not where the
 * search answers - with `caLinkedId` naming the assessment that holds it.
 */
const planReadResponse = (caLinkedId: any = null) => ({
  params: { status: 'success' },
  result: { content: { ...planRow(), caLinkedId } },
})
/** The key the linkage is written under, read off the model so a version bump is one edit. */
const LINK_KEY = aparPlan.TRAINING_PLAN_KEY

/** One row as the cbplan v4 search hands it back. */
const planRow = (overrides: any = {}) => ({
  id: 'plan-1',
  name: 'APAR 2026-27 — Section Officer & Under Secretary',
  planYear: '2026-27',
  endDate: '2027-03-31T00:00:00.000Z',
  isApar: true,
  contentList: [
    { identifier: 'do-1', mandatory: true },
    { identifier: 'do-2', mandatory: false },
    { identifier: 'do-3', mandatory: true },
  ],
  ...overrides,
})

const planSearchResponse = (data: any[], totalCount = data.length) => ({
  params: { status: 'success' },
  result: { result: { data, totalCount } },
})

describe('ComprehensiveAssessmentService', () => {
  let service: ComprehensiveAssessmentService
  let httpMock: HttpTestingController

  const searchParams = {
    planYear: '2026-27',
    searchString: '',
    pageIndex: 0,
    pageSize: 20,
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        DatePipe,
        ComprehensiveAssessmentService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    })

    service = TestBed.inject(ComprehensiveAssessmentService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('searchAparPlans', () => {
    it('should post the query the cbplan v4 search expects', () => {
      service.searchAparPlans(searchParams).subscribe()

      const req = httpMock.expectOne(PLAN_SEARCH_URL)
      expect(req.request.method).toBe('POST')
      expect(req.request.body).toEqual({
        request: {
          query: {
            bool: {
              must: [
                { term: { 'status.keyword': 'Live' } },
                { term: { 'isApar': true } },
                { term: { 'planYear.keyword': '2026-27' } },
              ],
              must_not: [{ exists: { field: aparPlan.LINKED_ASSESSMENT_FIELD } }],
            },
          },
          pageNumber: 0,
          pageSize: 20,
          searchString: '',
          applyOrgIdFilter: true,
          orderBy: 'createdAt',
          orderDirection: 'desc',
        },
      })
      req.flush(planSearchResponse([]))
    })

    /** The api is the one that knows, the picker no longer works it out from a second search. */
    it('should ask the search to leave out a plan another assessment already holds', () => {
      service.searchAparPlans(searchParams).subscribe()

      const req = httpMock.expectOne(PLAN_SEARCH_URL)
      expect(req.request.body.request.query.bool.must_not).toEqual([
        { exists: { field: 'caLinkedId' } },
      ])
      req.flush(planSearchResponse([]))
    })

    it('should scope the search to the org without naming it', () => {
      service.searchAparPlans(searchParams).subscribe()

      const req = httpMock.expectOne(PLAN_SEARCH_URL)
      expect(req.request.body.request.applyOrgIdFilter).toBe(true)
      expect(JSON.stringify(req.request.body)).not.toContain('orgIdList')
      req.flush(planSearchResponse([]))
    })

    it('should leave planYear off the query while the list is not narrowed to one year', () => {
      service.searchAparPlans({ ...searchParams, planYear: aparPlan.ALL_YEARS }).subscribe()

      const req = httpMock.expectOne(PLAN_SEARCH_URL)
      expect(req.request.body.request.query.bool.must).toEqual([
        { term: { 'status.keyword': 'Live' } },
        { term: { 'isApar': true } },
      ])
      req.flush(planSearchResponse([]))
    })

    /** The picker is an APAR plan picker, so the api is asked for those alone. */
    it('should ask the search for the plans APAR assignment is on for', () => {
      service.searchAparPlans(searchParams).subscribe()

      const req = httpMock.expectOne(PLAN_SEARCH_URL)
      expect(req.request.body.request.query.bool.must).toContainEqual({
        term: { 'isApar': true },
      })
      req.flush(planSearchResponse([]))
    })

    it('should drop the ordering while a search is on, the api orders by relevance then', () => {
      service.searchAparPlans({ ...searchParams, searchString: 'section officer' }).subscribe()

      const req = httpMock.expectOne(PLAN_SEARCH_URL)
      expect(req.request.body.request.searchString).toBe('section officer')
      expect(req.request.body.request.orderBy).toBeUndefined()
      expect(req.request.body.request.orderDirection).toBeUndefined()
      req.flush(planSearchResponse([]))
    })

    it('should flatten a row into what the picker table renders', () => {
      let result: any
      service.searchAparPlans(searchParams).subscribe((res: any) => result = res)

      httpMock.expectOne(PLAN_SEARCH_URL).flush(planSearchResponse([planRow()], 7))

      expect(result.count).toBe(7)
      expect(result.plans).toEqual([{
        id: 'plan-1',
        name: 'APAR 2026-27 — Section Officer & Under Secretary',
        planYear: '2026-27',
        endDate: '2027-03-31T00:00:00.000Z',
        endDateDisplay: '31 Mar, 2027',
        orgName: '',
        // two of the three contents are marked mandatory, they are the gating set
        gatingCourseCount: 2,
        // the courses travel with the row, the linkage is written from them
        contentList: [
          { identifier: 'do-1', mandatory: true },
          { identifier: 'do-2', mandatory: false },
          { identifier: 'do-3', mandatory: true },
        ],
        // nothing holds the plan, which is what the search asked for
        hasActiveAssessment: false,
        isYearClosed: false,
      }])
    })

    /** The plan carries what holds it, so a row that slips through the filter still says so. */
    it('should flag a row the search answers with a linked assessment on', () => {
      let result: any
      service.searchAparPlans(searchParams).subscribe((res: any) => result = res)

      httpMock.expectOne(PLAN_SEARCH_URL).flush(planSearchResponse([
        planRow({ [aparPlan.LINKED_ASSESSMENT_FIELD]: 'do_123' }),
      ]))

      expect(result.plans[0].hasActiveAssessment).toBe(true)
    })

    it('should not offer a plan with APAR assignment switched off', () => {
      let result: any
      service.searchAparPlans(searchParams).subscribe((res: any) => result = res)

      httpMock.expectOne(PLAN_SEARCH_URL).flush(planSearchResponse([
        planRow({ id: 'plan-1', isApar: true }),
        planRow({ id: 'plan-2', isApar: false }),
      ]))

      expect(result.plans.map((plan: any) => plan.id)).toEqual(['plan-1'])
    })

    /**
     * The regression behind an empty picker: the field is absent, not false, whenever the
     * search does not project it, and a truthiness filter would then drop every plan.
     */
    it('should keep a plan whose row carries no isApar field at all', () => {
      let result: any
      service.searchAparPlans(searchParams).subscribe((res: any) => result = res)

      const row = planRow()
      delete (row as any).isApar
      httpMock.expectOne(PLAN_SEARCH_URL).flush(planSearchResponse([row]))

      expect(result.plans.length).toBe(1)
    })

    it('should resolve empty when the response carries no result envelope', () => {
      let result: any
      service.searchAparPlans(searchParams).subscribe((res: any) => result = res)

      httpMock.expectOne(PLAN_SEARCH_URL).flush({})

      expect(result).toEqual({ plans: [], count: 0 })
    })

    it('should count no gating course when the plan marks nothing mandatory', () => {
      let result: any
      service.searchAparPlans(searchParams).subscribe((res: any) => result = res)

      httpMock.expectOne(PLAN_SEARCH_URL).flush(planSearchResponse([planRow({ contentList: [] })]))

      expect(result.plans[0].gatingCourseCount).toBe(0)
    })
  })

  /**
   * The publish time check: the picker only guards the moment a plan is linked, and the plan
   * itself says which assessment holds it by then.
   */
  describe('isPlanAvailable', () => {
    const availability = (response: any, contentId = 'do_123'): boolean | undefined => {
      let available: boolean | undefined
      service.isPlanAvailable('plan-1', contentId).subscribe((res: boolean) => available = res)
      httpMock.expectOne(PLAN_READ_URL).flush(response)
      return available
    }

    it('should read the plan rather than search for it', () => {
      service.isPlanAvailable('plan-1', 'do_123').subscribe()

      const req = httpMock.expectOne(PLAN_READ_URL)
      expect(req.request.method).toBe('GET')
      httpMock.expectNone(PLAN_SEARCH_URL)
      req.flush(planReadResponse())
    })

    it('should answer that a plan no assessment holds is free', () => {
      expect(availability(planReadResponse(null))).toBe(true)
      expect(availability(planReadResponse(''))).toBe(true)
      expect(availability({ result: { content: planRow() } })).toBe(true)
    })

    /** Reopening the publish on an assessment that already holds the plan. */
    it('should answer that a plan this assessment holds is free to it', () => {
      expect(availability(planReadResponse('do_123'))).toBe(true)
    })

    it('should answer that a plan another assessment holds is taken', () => {
      expect(availability(planReadResponse('do_999'))).toBe(false)
    })

    /**
     * The read answers under `result.content` and the search under `result.result.data`. The
     * regression: read for the search's envelope and every plan answers as free, because
     * `caLinkedId` is not on the object being looked at.
     */
    it('should read caLinkedId off the plan the read actually answers with', () => {
      expect(availability({ result: { content: { caLinkedId: 'do_999' } } })).toBe(false)
    })

    it('should treat a response carrying no plan as free rather than throw', () => {
      expect(availability({ result: {} })).toBe(true)
      expect(availability({})).toBe(true)
    })

    it('should answer without asking at all for an assessment holding no plan', () => {
      let available: boolean | undefined

      service.isPlanAvailable('', 'do_123').subscribe((res: boolean) => available = res)

      expect(available).toBe(false)
      httpMock.expectNone(PLAN_READ_URL)
    })
  })

  describe('plan metadata', () => {
    const linkedPlan: aparPlan.ILinkedPlan = {
      id: 'plan-1',
      name: 'APAR 2026-27 — Section Officer & Under Secretary',
      planYear: '2026-27',
      endDate: '2027-03-31T00:00:00.000Z',
      orgName: 'Department of Personnel & Training',
      gatingCourseCount: 2,
      contentList: [
        { identifier: 'do-1', mandatory: true },
        { identifier: 'do-2', mandatory: false },
        { identifier: 'do-3', mandatory: true },
      ],
    }

    /** An assessment saved while the plan was still denormalised beside the linkage. */
    const legacyContent = {
      [LINK_KEY]: { identifier: 'plan-1', contentList: linkedPlan.contentList },
      aparPlanId: 'plan-1',
      aparPlanName: 'APAR 2026-27 — Section Officer & Under Secretary',
      aparYear: '2026-27',
      aparPlanEndDate: '2027-03-31T00:00:00.000Z',
      aparPlanOrgName: 'Department of Personnel & Training',
      aparGatingCourseCount: '2',
    }

    /**
     * The linkage the platform reads the unlock rule off, and the only place the plan
     * itself is held now that the flat copies are no longer written.
     */
    it('should write the plan and the courses it gates as the training plan link', () => {
      expect(service.buildPlanMetadata(linkedPlan)[LINK_KEY]).toEqual({
        identifier: 'plan-1',
        name: 'APAR 2026-27 — Section Officer & Under Secretary',
        planYear: '2026-27',
        endDate: '2027-03-31T00:00:00.000Z',
        orgName: 'Department of Personnel & Training',
        contentList: [
          { identifier: 'do-1', mandatory: true },
          { identifier: 'do-2', mandatory: false },
          { identifier: 'do-3', mandatory: true },
        ],
      })
    })

    /**
     * The platform reads the unlock rule off this key, so its name is part of the contract
     * rather than an internal detail - a version bump has to be a deliberate edit here.
     */
    it('should write the linkage under the key the platform reads', () => {
      expect(Object.keys(service.buildPlanMetadata(linkedPlan))).toContain('trainingPlan_v2')
    })

    /** Whatever else a plan's course carries, the linkage keeps the two fields it needs. */
    it('should keep the course list down to the identifier and the gating flag', () => {
      const plan = {
        ...linkedPlan,
        contentList: [{ identifier: 'do-1', mandatory: true, name: 'Ethics', duration: 3600 }],
      } as any

      expect(service.buildPlanMetadata(plan)[LINK_KEY].contentList)
        .toEqual([{ identifier: 'do-1', mandatory: true }])
    })

    /**
     * The plan used to be denormalised to a set of flat `apar*` keys beside the linkage.
     * The linkage carries it now, so the save writes that and nothing else.
     */
    it('should write nothing beside the linkage', () => {
      expect(service.buildPlanMetadata(linkedPlan)).toEqual({ [LINK_KEY]: expect.any(Object) })
    })

    it('should clear the linkage when no plan is linked', () => {
      expect(service.buildPlanMetadata(null)).toEqual({
        [LINK_KEY]: {
          identifier: '', name: '', planYear: '', endDate: '', orgName: '', contentList: [],
        },
      })
    })

    /** Everything the reopened builder and the dashboard show comes back off the linkage. */
    it('should read the plan back off the linkage the save wrote', () => {
      expect(service.readPlanMetadata(service.buildPlanMetadata(linkedPlan))).toEqual(linkedPlan)
    })

    /** Nothing writes the flat copies any more, but an assessment carrying them still reads. */
    it('should read the whole plan off an assessment that still carries the flat copies', () => {
      expect(service.readPlanMetadata(legacyContent)).toEqual(linkedPlan)
    })

    /**
     * The linkage is written as an object, but a content schema that types the field as a
     * String hands it back serialised.
     */
    it('should read a linkage the api serialised', () => {
      const content = {
        ...service.buildPlanMetadata(linkedPlan),
        [LINK_KEY]: JSON.stringify({
          identifier: 'plan-1',
          contentList: [{ identifier: 'do-1', mandatory: true }],
        }),
      }

      const linked = service.readPlanMetadata(content)

      expect(linked && linked.id).toBe('plan-1')
      expect(linked && linked.contentList).toEqual([{ identifier: 'do-1', mandatory: true }])
    })

    it('should fall back to the display copies when the linkage cannot be read', () => {
      const content = { ...legacyContent, [LINK_KEY]: '{ not json' }

      const linked = service.readPlanMetadata(content)

      expect(linked && linked.id).toBe('plan-1')
      expect(linked && linked.name).toBe('APAR 2026-27 — Section Officer & Under Secretary')
      expect(linked && linked.contentList).toEqual([])
      // nothing left to count them from, so the stored number is what answers
      expect(linked && linked.gatingCourseCount).toBe(2)
    })

    /** The course list is the live answer, the stored count only a copy of it. */
    it('should count the gating courses off the linkage rather than the stored count', () => {
      const content = {
        ...legacyContent,
        aparGatingCourseCount: '99',
      }

      const linked = service.readPlanMetadata(content)

      expect(linked && linked.gatingCourseCount).toBe(2)
    })

    it('should read a plan linked before the linkage was written onto it', () => {
      const linked = service.readPlanMetadata({
        aparPlanId: 'plan-1',
        aparPlanName: 'APAR 2026-27',
        aparGatingCourseCount: '3',
      })

      expect(linked && linked.id).toBe('plan-1')
      expect(linked && linked.contentList).toEqual([])
      expect(linked && linked.gatingCourseCount).toBe(3)
    })

    it('should read no plan while the assessment carries no plan id', () => {
      expect(service.readPlanMetadata({ name: 'A draft with no plan' })).toBeNull()
      expect(service.readPlanMetadata(null)).toBeNull()
    })

    it('should read a gating count of zero when the stored value is not a number', () => {
      const linked = service.readPlanMetadata({ aparPlanId: 'plan-1', aparGatingCourseCount: 'many' })

      expect(linked && linked.gatingCourseCount).toBe(0)
    })
  })

  describe('content apis', () => {
    const userProfile = {
      userId: 'user-1',
      userName: 'manjula_k',
      firstName: 'Manjula',
      rootOrgId: 'org-1',
      departmentName: 'Karnataka Postal Circle',
    }

    it('should create a content', () => {
      service.createContent({ request: {} }).subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/action/content/v3/create')
      expect(req.request.method).toBe('POST')
      req.flush({})
    })

    it('should upload a file against a content', () => {
      service.uploadContent('do-1', new FormData()).subscribe()

      httpMock.expectOne('apis/proxies/v8/upload/action/content/v3/upload/do-1').flush({})
    })

    it('should read the hierarchy in edit mode so a draft is returned', () => {
      service.getContentHierarchy('do-1').subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/action/content/v3/hierarchy/do-1?mode=edit')
      expect(req.request.method).toBe('GET')
      req.flush({})
    })

    it('should patch a content under the request envelope', () => {
      service.updateContent('do-1', { name: 'Renamed' }).subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/action/content/v3/update/do-1')
      expect(req.request.method).toBe('PATCH')
      expect(req.request.body).toEqual({ request: { content: { name: 'Renamed' } } })
      req.flush({})
    })

    it('should publish a draft naming who published it', () => {
      service.publishAssessment('do-1', 'user-1', 'org-1').subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/action/ca/v1/publish/do-1')
      expect(req.request.body).toEqual({ request: { content: { lastPublishedBy: 'user-1' } } })
      req.flush({})
    })

    /**
     * The `ca` routes answer against the org the publish is made for rather than reading it
     * off the session, so every call of the publish flow names it in the header.
     */
    it('should name the org the publish is made for on every call of the flow', () => {
      service.publishAssessment('do-1', 'user-1', 'org-1').subscribe()
      service.publishQuestionSet('qs-1', 'org-1').subscribe()
      service.getQuestionSetStatus('qs-1', 'org-1').subscribe()

      const requests = [
        httpMock.expectOne('apis/proxies/v8/action/ca/v1/publish/do-1'),
        httpMock.expectOne('apis/proxies/v8/ca/questionset/v1/publish/qs-1'),
        httpMock.expectOne('apis/proxies/v8/questionset/v1/read/qs-1'),
      ]

      requests.forEach((req: any) => {
        expect(req.request.headers.get('x-authenticated-user-orgid')).toBe('org-1')
        req.flush({})
      })
    })

    /** An empty header says less than no header at all, so none is sent. */
    it('should send no org header while the org is not known', () => {
      service.publishQuestionSet('qs-1', '').subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/ca/questionset/v1/publish/qs-1')
      expect(req.request.headers.has('x-authenticated-user-orgid')).toBe(false)
      req.flush({})
    })

    /** The first of the two publishes: the assessment can only follow its question set. */
    it('should publish the question set the assessment holds', () => {
      service.publishQuestionSet('qs-1', 'org-1').subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/ca/questionset/v1/publish/qs-1')
      expect(req.request.method).toBe('POST')
      expect(req.request.body).toEqual({ request: { questionset: {} } })
      req.flush({})
    })

    /** The draft copy answers Draft however far along the publish is, so it is not read. */
    it('should read the status off the published copy of the question set', () => {
      let status = ''
      service.getQuestionSetStatus('qs-1', 'org-1').subscribe((res: string) => status = res)

      const req = httpMock.expectOne('apis/proxies/v8/questionset/v1/read/qs-1')
      expect(req.request.method).toBe('GET')
      req.flush({ result: { questionset: { identifier: 'qs-1', status: 'Live' } } })

      expect(status).toBe('Live')
    })

    it('should read the status whichever casing the api answers under', () => {
      let status = ''
      service.getQuestionSetStatus('qs-1', 'org-1').subscribe((res: string) => status = res)

      httpMock.expectOne('apis/proxies/v8/questionset/v1/read/qs-1')
        .flush({ result: { questionSet: { status: 'Processing' } } })

      expect(status).toBe('Processing')
    })

    /** The live copy does not exist until the publish finishes, and a 404 is not a failure. */
    it('should report no status rather than fail when the read errors', () => {
      let status: string | undefined
      let errored = false
      service.getQuestionSetStatus('qs-1', 'org-1').subscribe({
        next: (res: string) => status = res,
        error: () => errored = true,
      })

      httpMock.expectOne('apis/proxies/v8/questionset/v1/read/qs-1')
        .flush('not found', { status: 404, statusText: 'Not Found' })

      expect(errored).toBe(false)
      expect(status).toBe('')
    })

    /** The api retires a list, so the one assessment goes in the body as a list of one. */
    it('should retire a content, the delete the api offers', () => {
      service.retireAssessment('do-1').subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/v1/content/retire')
      expect(req.request.method).toBe('DELETE')
      expect(req.request.body).toEqual({ request: { contentIds: ['do-1'] } })
      req.flush({})
    })

    it('should read a question set hierarchy down to the question set itself', () => {
      let questionSet: any
      service.getQuestionSetHierarchy('qs-1').subscribe((res: any) => questionSet = res)

      httpMock.expectOne('apis/proxies/v8/questionset/v1/hierarchy/qs-1?mode=edit')
        .flush({ result: { questionSet: { identifier: 'qs-1' } } })

      expect(questionSet).toEqual({ identifier: 'qs-1' })
    })

    it('should add the question set to the collection children without repeating one', () => {
      const collection = {
        identifier: 'do-1',
        name: 'A comprehensive assessment',
        children: [{ identifier: 'qs-1' }],
      }

      service.linkAssessmentToCollection(collection, 'qs-1').subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/action/content/v3/hierarchy/update')
      expect(req.request.body.request.data.hierarchy['do-1'].children).toEqual(['qs-1'])
      req.flush({})
    })

    it('should create the assessment collection with the name and thumbnail captured', () => {
      service.createAssessmentCollection('A new assessment', 'icon-url', '', userProfile, 'a@b.com').subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/action/content/v3/create')
      const content = req.request.body.request.content
      expect(content.name).toBe('A new assessment')
      expect(content.appIcon).toBe('icon-url')
      expect(content.posterImage).toBe('icon-url')
      expect(content.createdFor).toEqual(['org-1'])
      expect(content.creatorContacts[0].email).toBe('a@b.com')
      expect(content.creatorLogo).toBeUndefined()
      req.flush({})
    })

    it('should write the logo as creatorLogo, apart from the thumbnail', () => {
      service.createAssessmentCollection('A new assessment', 'icon-url', 'logo-url', userProfile, 'a@b.com').subscribe()

      const content = httpMock.expectOne('apis/proxies/v8/action/content/v3/create').request.body.request.content
      expect(content.creatorLogo).toBe('logo-url')
      expect(content.appIcon).toBe('icon-url')
      expect(content.posterImage).toBe('icon-url')
    })

    /**
     * The whole field set the content api is given, pinned so a field cannot go missing
     * unnoticed - `creatorContacts` in particular is what the platform records the author by.
     */
    it('should send every field the content api records an assessment by', () => {
      service.createAssessmentCollection('A new assessment', 'icon-url', '', userProfile, 'a@b.com').subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/action/content/v3/create')

      expect(Object.keys(req.request.body.request.content).sort()).toEqual([
        'accessSetting', 'appIcon', 'code', 'contentType', 'courseCategory', 'createdBy',
        'createdFor', 'creator', 'creatorContacts', 'creatorIDs', 'framework', 'isExternal',
        'language', 'license', 'mimeType', 'name', 'organisation', 'ownershipType',
        'posterImage', 'primaryCategory', 'source', 'versionKey',
      ])
      req.flush({})
    })

    it('should name the author in creatorContacts as well as on the content', () => {
      service.createAssessmentCollection('A new assessment', '', '', userProfile, 'a@b.com').subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/action/content/v3/create')
      const content = req.request.body.request.content

      expect(content.creatorContacts).toEqual([{ id: 'user-1', name: 'Manjula', email: 'a@b.com' }])
      expect(content.creator).toBe('Manjula')
      expect(content.creatorIDs).toEqual(['user-1'])
      expect(content.createdBy).toBe('user-1')
      req.flush({})
    })

    /** The dialog reads the email off one profile, the create falls back to the other. */
    it('should fall back to the profile email when the caller has none', () => {
      service.createAssessmentCollection('A new assessment', '', '', { ...userProfile, email: 'p@b.com' }, '')
        .subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/action/content/v3/create')

      expect(req.request.body.request.content.creatorContacts[0].email).toBe('p@b.com')
      req.flush({})
    })

    /** The given name is read under either spelling, depending on the read it came from. */
    it('should name the author from a lowercased firstname', () => {
      const named = { userId: 'user-1', firstname: 'Krisp', rootOrgId: 'org-1' }

      service.createAssessmentCollection('A new assessment', '', '', named, 'a@b.com').subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/action/content/v3/create')
      const content = req.request.body.request.content

      expect(content.creator).toBe('Krisp')
      expect(content.creatorContacts[0].name).toBe('Krisp')
      req.flush({})
    })

    /** The two spellings are the same field, so a profile with both is not named twice. */
    it('should pick one spelling rather than joining them', () => {
      const named = { userId: 'user-1', firstName: 'Krisp', firstname: 'Krisp', rootOrgId: 'org-1' }

      service.createAssessmentCollection('A new assessment', '', '', named, 'a@b.com').subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/action/content/v3/create')

      expect(req.request.body.request.content.creator).toBe('Krisp')
      req.flush({})
    })

    /** The login handle is not a name, so it is never what the assessment is authored by. */
    it('should not fall back to the userName handle', () => {
      const handleOnly = { userId: 'user-1', userName: 'manjula_k', rootOrgId: 'org-1' }

      service.createAssessmentCollection('A new assessment', '', '', handleOnly, 'a@b.com').subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/action/content/v3/create')

      expect(req.request.body.request.content.creator).toBe('')
      req.flush({})
    })

    /** What the learner reads as the assessment's source is the org that created it. */
    it('should name the org of the admin creating it as the source', () => {
      service.createAssessmentCollection('A new assessment', '', '', userProfile, 'a@b.com').subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/action/content/v3/create')
      expect(req.request.body.request.content.source).toBe('Karnataka Postal Circle')
      expect(req.request.body.request.content.organisation).toEqual(['Karnataka Postal Circle'])
      req.flush({})
    })

    it('should leave the source empty rather than guess for a profile carrying no org', () => {
      service.createAssessmentCollection('A new assessment', '', '', { userId: 'user-1' }, 'a@b.com').subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/action/content/v3/create')
      expect(req.request.body.request.content.source).toBe('')
      req.flush({})
    })

    it('should fall back to the profile email when the caller passes none', () => {
      service.createAssessmentCollection('A new assessment', 'icon-url', '',
                                         { ...userProfile, email: 'profile@b.com' }, '').subscribe()

      const req = httpMock.expectOne('apis/proxies/v8/action/content/v3/create')
      expect(req.request.body.request.content.creatorContacts[0].email).toBe('profile@b.com')
      req.flush({})
    })

    it('should upload the picked image and resolve with its public url', () => {
      let appIcon = ''
      const file = new File(['x'], 'thumb.png', { type: 'image/png' })
      service.uploadImageAsset(file, userProfile).subscribe((res: string) => appIcon = res)

      httpMock.expectOne('apis/proxies/v8/action/content/v3/create').flush({ result: { identifier: 'asset-1' } })
      httpMock.expectOne('apis/proxies/v8/upload/action/content/v3/upload/asset-1')
        .flush({ result: { artifactUrl: 'https://cdn.example.com/thumb.png' } })

      expect(appIcon).toBe('https://cdn.example.com/thumb.png')
    })

    it('should fail the upload when the asset content could not be created', () => {
      let message = ''
      const file = new File(['x'], 'thumb.png', { type: 'image/png' })
      service.uploadImageAsset(file, userProfile).subscribe({
        error: (error: Error) => message = error.message,
      })

      httpMock.expectOne('apis/proxies/v8/action/content/v3/create').flush({ result: {} })

      expect(message).toBe('Something went wrong while creating the image asset')
    })
  })

  describe('searchAssessments', () => {
    const searchUrl = 'apis/proxies/v8/sunbirdigot/v4/search'

    it('should offset by the browsed page while nothing is searched', () => {
      service.searchAssessments({
        status: 'Draft', rootOrgId: 'org-1', query: '', pageSize: 20, pageIndex: 2,
      }).subscribe()

      const req = httpMock.expectOne(searchUrl)
      expect(req.request.body.request.offset).toBe(40)
      expect(req.request.body.request.filters.status).toEqual(['Draft'])
      req.flush({})
    })

    it('should restart at the first page when a search is on', () => {
      service.searchAssessments({
        status: 'Live', rootOrgId: 'org-1', query: 'apar', pageSize: 20, pageIndex: 2,
      }).subscribe()

      const req = httpMock.expectOne(searchUrl)
      expect(req.request.body.request.offset).toBe(0)
      expect(req.request.body.request.query).toBe('apar')
      req.flush({})
    })

    it('should shape a hit into the display ready row the listing renders', () => {
      let result: any
      service.searchAssessments({
        status: 'Live', rootOrgId: 'org-1', query: '', pageSize: 20, pageIndex: 0,
      }).subscribe((res: any) => result = res)

      httpMock.expectOne(searchUrl).flush({
        result: {
          count: 1,
          content: [{
            identifier: 'do-1',
            createdOn: '2026-04-01T00:00:00.000Z',
            lastUpdatedOn: '2026-04-02T00:00:00.000Z',
            lastPublishedOn: '',
            creator: '',
            duration: '3900',
          }],
        },
      })

      expect(result.count).toBe(1)
      expect(result.content[0].createdOn).toBe('01 Apr, 2026')
      expect(result.content[0].lastPublishedOn).toBe('')
      // an unnamed creator reads as a dash rather than an empty cell
      expect(result.content[0].creator).toBe('-')
      expect(result.content[0].durationDisplay).toBe('1 hr 5 min')
    })

    /**
     * A published assessment's thumbnail is copied under `/collection`, and those objects
     * answer 403 when fetched straight off the bucket - the row has to point at the copy
     * the portal serves.
     */
    it('should point a thumbnail at the portal rather than at the bucket', () => {
      let result: any
      service.searchAssessments({
        status: 'Live', rootOrgId: 'org-1', query: '', pageSize: 20, pageIndex: 0,
      }).subscribe((res: any) => result = res)

      httpMock.expectOne(searchUrl).flush({
        result: {
          count: 1,
          content: [{
            identifier: 'do-1',
            appIcon: 'https://storage.googleapis.com/igot/collection/do-1/artifact/icon.thumb.png',
          }],
        },
      })

      expect(result.content[0].appIcon)
        .toBe(`${(environment.domainName || '').replace(/\/$/, '')}` +
              '/assets/public/collection/do-1/artifact/icon.thumb.png')
    })

    /** The Live rows are drawn from the poster, so it needs the same rewrite the icon gets. */
    it('should point the poster at the portal as well as the icon', () => {
      let result: any
      service.searchAssessments({
        status: 'Live', rootOrgId: 'org-1', query: '', pageSize: 20, pageIndex: 0,
      }).subscribe((res: any) => result = res)

      httpMock.expectOne(searchUrl).flush({
        result: {
          count: 1,
          content: [{
            identifier: 'do-1',
            posterImage: 'https://storage.googleapis.com/igot/collection/do-1/artifact/poster.png',
          }],
        },
      })

      expect(result.content[0].posterImage)
        .toBe(`${(environment.domainName || '').replace(/\/$/, '')}` +
              '/assets/public/collection/do-1/artifact/poster.png')
    })

    it('should leave a thumbnail the portal already serves alone', () => {
      let result: any
      service.searchAssessments({
        status: 'Live', rootOrgId: 'org-1', query: '', pageSize: 20, pageIndex: 0,
      }).subscribe((res: any) => result = res)

      httpMock.expectOne(searchUrl).flush({
        result: { count: 1, content: [{ appIcon: '/assets/public/content/do-1/artifact/icon.png' }] },
      })

      expect(result.content[0].appIcon).toBe('/assets/public/content/do-1/artifact/icon.png')
    })

    it('should render a duration in the units it actually has', () => {
      let result: any
      service.searchAssessments({
        status: 'Live', rootOrgId: 'org-1', query: '', pageSize: 20, pageIndex: 0,
      }).subscribe((res: any) => result = res)

      httpMock.expectOne(searchUrl).flush({
        result: {
          count: 3,
          content: [{ duration: '600' }, { duration: '45' }, { duration: '0' }],
        },
      })

      expect(result.content.map((r: any) => r.durationDisplay)).toEqual(['10 min', '45 sec', '-'])
    })
  })

  describe('helpers', () => {
    it('should find the question set linked to the collection', () => {
      const collection = {
        children: [
          { identifier: 'do-2', mimeType: 'application/pdf' },
          { identifier: 'qs-1', mimeType: 'application/vnd.sunbird.questionset' },
        ],
      }

      expect(service.getLinkedAssessmentId(collection)).toBe('qs-1')
      expect(service.getLinkedAssessmentId({ children: [] })).toBe('')
    })

    /** What the publish dialog lists, so the admin sees by name what is about to go Live. */
    it('should list the question sets the assessment holds, named and with their status', () => {
      const collection = {
        children: [
          { identifier: 'do-2', name: 'A handout', mimeType: 'application/pdf', status: 'Live' },
          {
            identifier: 'qs-1',
            name: 'APAR assessment question set',
            mimeType: 'application/vnd.sunbird.questionset',
            status: 'Draft',
          },
        ],
      }

      expect(service.getLinkedResources(collection)).toEqual([
        { identifier: 'qs-1', name: 'APAR assessment question set', status: 'Draft' },
      ])
    })

    it('should list nothing for a collection carrying no question set', () => {
      expect(service.getLinkedResources({ children: [] })).toEqual([])
      expect(service.getLinkedResources(null)).toEqual([])
    })

    it('should generate the 16 digit numeric code sunbird expects', () => {
      expect(service.generateCode()).toMatch(/^[0-9]{16}$/)
    })

    it('should leave a url that is not a raw storage url alone', () => {
      expect(service.toPublicUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
      expect(service.toPublicUrl('')).toBe('')
    })

    it('should rewrite a raw storage url onto the portal public path', () => {
      // only the leading empty segment is dropped, the path behind the igot root is kept whole
      expect(service.toPublicUrl('https://storage.googleapis.com/igot/bucket/content/a.png'))
        .toContain('/assets/public/bucket/content/a.png')
    })
  })

  describe('isWindowOpen', () => {
    const hours = (count: number) => new Date(Date.now() + (count * 60 * 60 * 1000)).toISOString()

    it('should let a window that has not ended yet through', () => {
      expect(service.isWindowOpen(hours(24))).toBe(true)
    })

    it('should close a window whose end date has passed', () => {
      expect(service.isWindowOpen(hours(-24))).toBe(false)
    })

    /** No plan linked, or a plan with no timeline — there is no window to publish into. */
    it('should treat a missing end date as no window at all', () => {
      expect(service.isWindowOpen('')).toBe(false)
      expect(service.isWindowOpen(null)).toBe(false)
      expect(service.isWindowOpen(undefined)).toBe(false)
    })

    it('should treat an unreadable end date as no window at all', () => {
      expect(service.isWindowOpen('not a date')).toBe(false)
    })
  })
})
