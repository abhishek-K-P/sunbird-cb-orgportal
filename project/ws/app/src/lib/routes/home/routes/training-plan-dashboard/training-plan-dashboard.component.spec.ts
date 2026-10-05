
import { ActivatedRoute, Router } from '@angular/router'
import { TrainingPlanDashboardService } from '../../services/training-plan-dashboard.service'
import { LoaderService } from '../../../../../../../../../src/app/services/loader.service'
import { TrainingPlanService } from '../../../training-plan/services/traininig-plan.service'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Subject, of, throwError } from 'rxjs'
import { TrainingPlanDashboardComponent } from './training-plan-dashboard.component'
import { AparYearService } from '../../../../common/apar-year-select/apar-year.service'

describe('TrainingPlanDashboardComponent', () => {
    let component: TrainingPlanDashboardComponent

    let router: any
    let activeRoute: any
    let trainingDashboardSvc: any
    let loaderService: any
    let trainingPlanService: any
    let snackBar: any
    let aparYearSvc: any
    let dialog: any

    beforeEach(() => {
        router = { navigate: jest.fn() }
        const configService = {
            userProfileV2: { userId: 'user-1' },
            userProfile: { rootOrgId: 'org-1' },
            userRoles: new Set(),
        }
        activeRoute = {
            snapshot: { data: { configService, pageData: {} } },
            queryParams: of({}),
        }
        // 'failed' keeps the subscribe on the short path, the table rendering is covered elsewhere
        trainingDashboardSvc = {
            getTrainingPlansV4: jest.fn().mockReturnValue(of({ params: { status: 'failed' } })),
        }
        loaderService = { changeLoaderState: jest.fn() }
        trainingPlanService = {
            archivePlanV4: jest.fn().mockReturnValue(of({ params: { status: 'success' } })),
        }
        snackBar = { open: jest.fn() }
        aparYearSvc = {
            getCurrentAparYear: jest.fn().mockReturnValue('2026-27'),
            isAparYearEditable: jest.fn().mockReturnValue(true),
        }
        dialog = {}

        component = new TrainingPlanDashboardComponent(
            router as Router,
            activeRoute as ActivatedRoute,
            trainingDashboardSvc as TrainingPlanDashboardService,
            loaderService as LoaderService,
            trainingPlanService as TrainingPlanService,
            snackBar as MatSnackBar,
            aparYearSvc as AparYearService,
            dialog as MatDialog
        )
        component.configSvc = activeRoute.snapshot.data.configService
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    it('should seed the selected year from the apar year service on init', () => {
        component.ngOnInit()

        expect(component.selectedAparYear).toBe('2026-27')
    })

    /**
     * The rows are emptied before the call goes out, so an emptied table with the loading flag
     * still up reads as a finished fetch and shows the no-data message until the response
     * lands. Every path that reloads the list has to put the flag back down.
     */
    describe('the loading state while a reload is in flight', () => {
        /** A call that has not answered yet, so the in-flight state can be read. */
        const pendingResponse = () => {
            const response = new Subject<any>()
            trainingDashboardSvc.getTrainingPlansV4.mockReturnValue(response.asObservable())
            return response
        }

        const expectLoadingUntilAnswered = (reload: () => void) => {
            component.fetchContentDone = true
            const response = pendingResponse()

            reload()

            expect(component.fetchContentDone).toBe(false)
            expect(component.trainingPlanData).toEqual([])

            response.next({ params: { status: 'failed' } })

            expect(component.fetchContentDone).toBe(true)
        }

        it('should show the loader while a search is in flight', () => {
            expectLoadingUntilAnswered(() => component.searchTrainingPlan('induction'))
        })

        it('should show the loader while a page change is in flight', () => {
            expectLoadingUntilAnswered(() => component.onPaginateChange({ pageIndex: 1, pageSize: 20 }))
        })

        it('should show the loader while a year change is in flight', () => {
            component.selectedAparYear = '2026-27'
            expectLoadingUntilAnswered(() => component.changeAparYear('2025-26'))
        })

        it('should show the loader while a tab change is in flight', () => {
            expectLoadingUntilAnswered(() => component.filter('draft'))
        })
    })

    describe('getTrainingPlanCBP payload', () => {
        const payloadOf = () => trainingDashboardSvc.getTrainingPlansV4.mock.calls[0][0]

        it('should send the selected year as planYear inside the filter', async () => {
            component.selectedAparYear = '2025-26'

            await component.getTrainingPlanCBP('draft', '')

            expect(payloadOf()).toEqual({
                filter: {
                    status: ['draft'],
                    orgIdList: ['org-1'],
                    planYear: '2025-26',
                },
                pageNumber: 0,
                pageSize: 20,
                searchString: '',
                applyOrgIdFilter: true,
                orderBy: 'createdAt',
                orderDirection: 'desc',
            })
        })

        it('should keep planYear alongside a search string', async () => {
            component.selectedAparYear = '2026-27'

            await component.getTrainingPlanCBP('Live', 'induction')

            expect(payloadOf().filter.planYear).toBe('2026-27')
            expect(payloadOf().searchString).toBe('induction')
            expect(payloadOf().orderBy).toBeUndefined()
        })

        it('should omit planYear when no year is selected', async () => {
            component.selectedAparYear = ''

            await component.getTrainingPlanCBP('draft', '')

            expect(payloadOf().filter.planYear).toBeUndefined()
            expect('planYear' in payloadOf().filter).toBe(false)
        })
    })

    describe('changeAparYear', () => {
        it('should hold the new year and reload the list from the first page', () => {
            component.selectedAparYear = '2026-27'
            component.pageIndex = 3
            const fetchSpy = jest.spyOn(component, 'getTrainingPlanCBP').mockResolvedValue(undefined)

            component.changeAparYear('2025-26')

            expect(component.selectedAparYear).toBe('2025-26')
            expect(component.pageIndex).toBe(0)
            expect(fetchSpy).toHaveBeenCalledTimes(1)
        })

        it('should keep the current search string while reloading', () => {
            component.selectedAparYear = '2026-27'
            component.searchQuery = 'induction'
            const fetchSpy = jest.spyOn(component, 'getTrainingPlanCBP').mockResolvedValue(undefined)

            component.changeAparYear('2025-26')

            expect(fetchSpy).toHaveBeenCalledWith(component.currentFilter, 'induction')
        })

        it('should not reload when the same year is picked again', () => {
            component.selectedAparYear = '2026-27'
            const fetchSpy = jest.spyOn(component, 'getTrainingPlanCBP').mockResolvedValue(undefined)

            component.changeAparYear('2026-27')

            expect(fetchSpy).not.toHaveBeenCalled()
        })
    })

    describe('deleteContentData', () => {
        const selectedRow = { id: 'plan-1', userType: 'Designation' }

        it('should archive the plan by its id', () => {
            component.deleteContentData(selectedRow)

            expect(trainingPlanService.archivePlanV4).toHaveBeenCalledWith({
                request: { id: 'plan-1', comment: 'Content deleted' },
            })
        })

        /** A deleted plan is retired, so the user lands on the tab that lists it. */
        it('should move to the Retire tab once the plan is deleted', () => {
            component.currentFilter = 'Live'

            component.deleteContentData(selectedRow)

            expect(snackBar.open).toHaveBeenCalledWith('CBP plan deleted successfully.')
            expect(router.navigate).toHaveBeenCalledWith(
                ['app', 'home', 'training-plan-dashboard'],
                { queryParams: { type: 'RETIRE', tabSelected: 'Designation' } }
            )
            expect(loaderService.changeLoaderState).toHaveBeenLastCalledWith(false)
        })

        it('should not reload the current tab in place of moving to Retire', () => {
            const filterSpy = jest.spyOn(component, 'filter')

            component.deleteContentData(selectedRow)

            expect(filterSpy).not.toHaveBeenCalled()
        })

        it('should stay on the current tab when the delete fails', () => {
            trainingPlanService.archivePlanV4.mockReturnValue(throwError(() => ({})))

            component.deleteContentData(selectedRow)

            expect(router.navigate).not.toHaveBeenCalled()
            expect(snackBar.open).not.toHaveBeenCalled()
            expect(loaderService.changeLoaderState).toHaveBeenLastCalledWith(false)
        })
    })

    describe('createCbp', () => {
        it('should carry the selected year to the create plan route', () => {
            component.selectedAparYear = '2025-26'

            component.createCbp()

            expect(router.navigate).toHaveBeenCalledWith(
                ['app', 'training-plan', 'create-plan'],
                { queryParams: { aparYear: '2025-26' } }
            )
        })

        it('should leave the year out of the route when the config closes it', () => {
            aparYearSvc.isAparYearEditable.mockReturnValue(false)
            component.selectedAparYear = '2024-25'

            component.createCbp()

            expect(router.navigate).toHaveBeenCalledWith(['app', 'training-plan', 'create-plan'])
        })

        it('should refuse to start a plan with no year selected', () => {
            component.selectedAparYear = ''

            component.createCbp()

            expect(snackBar.open).toHaveBeenCalledWith('Please select an APAR year to continue.')
            expect(router.navigate).not.toHaveBeenCalled()
        })
    })
})
