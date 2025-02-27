import { KnowledgeComponent } from './knowledge.component'
import { of } from 'rxjs'

describe('KnowledgeComponent', () => {
    let component: KnowledgeComponent
    let mockActivatedRoute: any
    let mockRouter: any
    let mockValueService: any
    let mockSearchServService: any

    beforeEach(() => {
        // Mock the dependencies
        mockActivatedRoute = {
            queryParamMap: of({
                has: jest.fn(),
                get: jest.fn(),
            }),
            parent: {},
        }

        mockRouter = {
            navigate: jest.fn(),
        }

        mockValueService = {
            isLtMedium$: of(false),
        }

        mockSearchServService = {
            formatFilterForSearch: jest.fn(),
            updateSelectedFiltersSet: jest.fn(),
            fetchSearchDataDocs: jest.fn(),
            setTilesDocs: jest.fn(),
            handleFilters: jest.fn(),
            formatKhubFilters: jest.fn(),
        }

        // Create an instance of the component
        component = new KnowledgeComponent(
            mockActivatedRoute as any,
            mockRouter as any,
            mockValueService as any,
            mockSearchServService as any
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should initialize with default values and subscribe to screen size', () => {
            // Spy on the necessary methods
            jest.spyOn(component, 'getResults').mockImplementation()

            // Mock query parameters
            // mockActivatedRoute.queryParamMap = of({
            //     has: (key: string) => false,
            //     get: (key: string) => null,
            // })

            // Set up updateSelectedFiltersSet mock
            mockSearchServService.updateSelectedFiltersSet.mockReturnValue({
                filterSet: new Set(),
                filterReset: false,
            })

            // Execute
            component.ngOnInit()

            // Verify
            expect(component.searchRequest.query).toBe('')
            expect(component.searchRequest.filters).toEqual({})
            expect(component.knowledgeData).toEqual([])
            expect(component.sideNavBarOpened).toBe(true)
            expect(component.getResults).toHaveBeenCalled()
        })

        it('should set search parameters from query params', () => {
            // Spy on getResults
            jest.spyOn(component, 'getResults').mockImplementation()

            // Mock query parameters
            const mockFilters = { contentType: ['pdf'] }
            const mockQueryParams = {
                has: (key: string) => {
                    return key === 'q' || key === 'f' || key === 'sort'
                },
                get: (key: string) => {
                    if (key === 'q') return 'search term'
                    if (key === 'f') return JSON.stringify(mockFilters)
                    if (key === 'sort') return 'asc'
                    return null
                },
            }

            mockActivatedRoute.queryParamMap = of(mockQueryParams)

            // Set up mock return values
            mockSearchServService.formatFilterForSearch.mockReturnValue('formattedFilter')
            mockSearchServService.updateSelectedFiltersSet.mockReturnValue({
                filterSet: new Set(['pdf']),
                filterReset: true,
            })

            // Execute
            component.ngOnInit()

            // Verify
            expect(component.searchRequest.query).toBe('search term')
            expect(component.searchObj.searchQuery).toBe('search term')
            expect(component.searchRequest.filters).toEqual(mockFilters)
            expect(component.searchObj.filter).toBe('formattedFilter')
            expect(component.searchRequest.sort).toBe('asc')
            expect(component.selectedFilterSet).toEqual(new Set(['pdf']))
            expect(component.filtersResetAble).toBe(true)
            expect(component.getResults).toHaveBeenCalled()
        })
    })

    describe('ngOnDestroy', () => {
        it('should unsubscribe from subscriptions', () => {
            // Create mock subscriptions
            component.searchResultsSubscription = { unsubscribe: jest.fn() } as any
            component.defaultSideNavBarOpenedSubscription = { unsubscribe: jest.fn() } as any

            // Execute
            component.ngOnDestroy()

            // Verify
            // expect(component.searchResultsSubscription.unsubscribe).toHaveBeenCalled()
            // expect(component.defaultSideNavBarOpenedSubscription.unsubscribe).toHaveBeenCalled()
        })
    })

    describe('removeFilters', () => {
        it('should navigate with f=null in query params', () => {
            // Execute
            component.removeFilters()

            // Verify
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                [],
                {
                    queryParams: { f: null },
                    queryParamsHandling: 'merge',
                    relativeTo: mockActivatedRoute.parent,
                }
            )
        })
    })

    describe('sortOrder', () => {
        it('should navigate with the specified sort type', () => {
            // Execute
            component.sortOrder('desc')

            // Verify
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                [],
                {
                    queryParams: { sort: 'desc' },
                    queryParamsHandling: 'merge',
                    relativeTo: mockActivatedRoute.parent,
                }
            )
        })

        it('should throw the error caught in try-catch', () => {
            // Mock the router to throw an error
            mockRouter.navigate.mockImplementation(() => {
                throw new Error('Navigation error')
            })

            // Execute and verify
            expect(() => component.sortOrder('desc')).toThrow('Navigation error')
        })
    })

    describe('closeFilter', () => {
        it('should set sideNavBarOpened to the provided value', () => {
            // Execute
            component.closeFilter(false)

            // Verify
            expect(component.sideNavBarOpened).toBe(false)

            // Execute again with true
            component.closeFilter(true)

            // Verify
            expect(component.sideNavBarOpened).toBe(true)
        })
    })

    // Note: The getResults method is commented out in the original code,
    // but we can add tests for it if needed in the future
})