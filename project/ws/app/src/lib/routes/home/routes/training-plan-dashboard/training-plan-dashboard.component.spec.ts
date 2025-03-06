import { TrainingPlanDashboardComponent } from './training-plan-dashboard.component'
import { of, throwError } from 'rxjs'
import moment from 'moment'

describe('TrainingPlanDashboardComponent', () => {
    let component: TrainingPlanDashboardComponent
    let mockTrainingDashboardSvc: any
    let mockRouter: any
    let mockActiveRoute: any
    let mockLoaderService: any
    let mockTrainingPlanService: any
    let mockSnackBar: any
    let mockDialog: any

    const mockLiveData = {
        params: {
            status: 'success'
        },
        result: {
            content: [
                {
                    id: '1',
                    name: 'Plan 1',
                    status: 'Live',
                    userType: 'Designation',
                    contentList: [{ id: 'c1', competencies_v5: [{ competencyArea: 'Java' }] }],
                    userDetails: [{ firstName: 'John', designation: 'Developer' }],
                    endDate: '2025-03-20',
                    updatedAt: '2025-02-01',
                    createdBy: 'user1',
                    createdByName: 'User One'
                },
                {
                    id: '2',
                    name: 'Plan 2',
                    status: 'Live',
                    userType: 'AllUser',
                    contentList: [{ id: 'c2' }],
                    endDate: '2025-04-20',
                    updatedAt: '2025-02-15',
                    createdBy: 'user2',
                    createdByName: 'User Two'
                }
            ]
        }
    }

    const mockDraftData = {
        params: {
            status: 'success'
        },
        result: {
            content: [
                {
                    id: '3',
                    name: 'Draft Plan',
                    status: 'DRAFT',
                    userType: 'Designation',
                    contentList: [{ id: 'c3' }],
                    userDetails: [{ firstName: 'Jane', designation: 'Manager' }],
                    endDate: '2025-05-20',
                    updatedAt: '2025-02-20',
                    createdBy: 'user1',
                    createdByName: 'User One'
                }
            ]
        }
    }

    beforeEach(() => {
        mockTrainingDashboardSvc = {
            getUserList: jest.fn()
        }
        mockRouter = {
            navigate: jest.fn()
        }
        mockActiveRoute = {
            snapshot: {
                data: {
                    configService: {
                        userProfileV2: { userId: 'user1' },
                        userRoles: new Set(['mdo_admin'])
                    },
                    pageData: {
                        data: {
                            actionMenu: [
                                {
                                    enabledFor: ['mdo_admin', 'mdo_leader'],
                                    isMdoLeader: false,
                                    isMdoAdmin: false,
                                    userAccess: false
                                }
                            ]
                        }
                    }
                }
            },
            queryParams: of({})
        }
        mockLoaderService = {
            changeLoaderState: jest.fn()
        }
        mockTrainingPlanService = {
            archivePlan: jest.fn(),
            publishPlan: jest.fn()
        }
        mockSnackBar = {
            open: jest.fn()
        }
        mockDialog = {
            open: jest.fn()
        }

        component = new TrainingPlanDashboardComponent(
            mockRouter,
            mockActiveRoute,
            mockTrainingDashboardSvc,
            mockLoaderService,
            mockTrainingPlanService,
            mockSnackBar,
            mockDialog
        )
    })

    it('should initialize correctly', () => {
        component.ngOnInit()

        expect(component.currentFilter).toBe('live')
        expect(component.limit).toBe(20)
        expect(component.tabledata).toBeDefined()
        expect(component.tabledata.columns.length).toBe(7)
        expect(component.currentTab).toBe('Designation')
    })

    it('should filter data based on current filter', () => {
        const filterSpy = jest.spyOn(component, 'filterData')

        component.filter('live')

        expect(component.currentFilter).toBe('live')
        expect(filterSpy).toHaveBeenCalled()
    })

    it('should get live data from service', async () => {
        // Mock the Observable with toPromise method
        const mockObservable = {
            toPromise: jest.fn().mockResolvedValue(mockLiveData)
        }
        mockTrainingDashboardSvc.getUserList.mockReturnValue(mockObservable)

        await component.getLiveData()

        expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(true)
        expect(mockTrainingDashboardSvc.getUserList).toHaveBeenCalled()
        expect(component.completeDataRes).toEqual(mockLiveData.result.content)
        expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
    })

    it('should handle error when getting live data', async () => {
        // Mock the Observable with toPromise method that rejects
        const mockObservable = {
            toPromise: jest.fn().mockRejectedValue('Error')
        }
        mockTrainingDashboardSvc.getUserList.mockReturnValue(mockObservable)

        await component.getLiveData()

        expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(true)
        expect(mockTrainingDashboardSvc.getUserList).toHaveBeenCalled()
        expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
    })

    it('should get draft data from service', async () => {
        // Mock the Observable with toPromise method
        const mockObservable = {
            toPromise: jest.fn().mockResolvedValue(mockDraftData)
        }
        mockTrainingDashboardSvc.getUserList.mockReturnValue(mockObservable)

        await component.getDraftData()

        expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(true)
        expect(mockTrainingDashboardSvc.getUserList).toHaveBeenCalled()
        expect(component.completeDataRes).toEqual(mockDraftData.result.content)
        expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
    })

    it('should convert data correctly for table display', () => {
        component.completeDataRes = [
            {
                id: '1',
                name: 'Plan 1',
                userType: 'Designation',
                contentList: [{
                    id: 'c1',
                    competencies_v5: [
                        { competencyArea: 'Java' },
                        { competencyArea: 'Angular' }
                    ]
                }],
                userDetails: [
                    { firstName: 'John', designation: 'Developer' },
                    { firstName: 'Jane', designation: 'Manager' }
                ],
                endDate: '2025-03-20',
                updatedAt: '2025-02-01',
                createdBy: 'user1',
                createdByName: 'User One'
            }
        ]
        component.currentUser = 'user1'

        component.convertDataAsPerTable()

        expect(component.completeDataRes[0].contentCount).toBe(1)
        expect(component.completeDataRes[0].assigneeCount).toBe(2)
        expect(component.completeDataRes[0].endDate).toBe(moment('2025-03-20').format('MMM DD[,] YYYY'))
        expect(component.completeDataRes[0].updatedAt).toBe(moment('2025-02-01').format('MMM DD[,] YYYY'))
        expect(component.completeDataRes[0].createdByName).toBe('You')
        expect(component.completeDataRes[0].competencies).toEqual(['Java', 'Angular'])
        expect(component.completeDataRes[0].userNameList).toEqual(['John', 'Jane'])
        expect(component.completeDataRes[0].userDesignationList).toEqual(['Developer', 'Manager'])
    })

    it('should navigate to create plan page', () => {
        component.createCbp()

        expect(mockRouter.navigate).toHaveBeenCalledWith(['app', 'training-plan', 'create-plan'])
    })

    it('should handle menu selection for preview', () => {
        const previewSpy = jest.spyOn(component, 'previewData')
        const mockRow = { id: '1', name: 'Plan 1' }

        component.menuSelected({ action: 'preivewContent', row: mockRow })

        expect(previewSpy).toHaveBeenCalledWith(mockRow)
    })

    it('should handle menu selection for edit', () => {
        const editSpy = jest.spyOn(component, 'editContentData')
        const mockRow = { id: '1', name: 'Plan 1' }

        component.menuSelected({ action: 'editContent', row: mockRow })

        expect(editSpy).toHaveBeenCalledWith(mockRow)
    })

    it('should handle menu selection for delete', () => {
        const confirmSpy = jest.spyOn(component, 'showConformationModal')
        const mockRow = { id: '1', name: 'Plan 1' }

        component.menuSelected({ action: 'deleteContent', row: mockRow })

        expect(confirmSpy).toHaveBeenCalledWith(mockRow, 'deleteContent')
    })

    it('should handle menu selection for publish', () => {
        const confirmSpy = jest.spyOn(component, 'showConformationModal')
        const mockRow = { id: '1', name: 'Plan 1' }

        component.menuSelected({ action: 'publishContent', row: mockRow })

        expect(confirmSpy).toHaveBeenCalledWith(mockRow, 'publishContent')
    })

    it('should navigate to preview page', () => {
        const mockRow = { id: '1', name: 'Plan 1' }

        component.previewData(mockRow)

        expect(mockRouter.navigate).toHaveBeenCalledWith(['app', 'training-plan', 'preview-plan-for-dashboard', '1'])
    })

    it('should navigate to edit page', () => {
        const mockRow = { id: '1', name: 'Plan 1' }

        component.editContentData(mockRow)

        expect(mockRouter.navigate).toHaveBeenCalledWith(['app', 'training-plan', 'update-plan', '1'])
    })

    it('should show confirmation modal and delete content when confirmed', () => {
        const mockRow = { id: '1', status: 'DRAFT', userType: 'Designation' }
        const mockDialogRef = {
            afterClosed: jest.fn().mockReturnValue(of('confirmed'))
        }
        mockDialog.open.mockReturnValue(mockDialogRef)
        const deleteSpy = jest.spyOn(component, 'deleteContentData').mockImplementation(() => { })

        component.showConformationModal(mockRow, 'deleteContent')

        expect(mockDialog.open).toHaveBeenCalled()
        expect(deleteSpy).toHaveBeenCalledWith(mockRow)
    })

    it('should show confirmation modal and publish content when confirmed', () => {
        const mockRow = { id: '1', status: 'DRAFT', userType: 'Designation' }
        const mockDialogRef = {
            afterClosed: jest.fn().mockReturnValue(of('confirmed'))
        }
        mockDialog.open.mockReturnValue(mockDialogRef)
        const publishSpy = jest.spyOn(component, 'publishContentData').mockImplementation(() => { })

        component.showConformationModal(mockRow, 'publishContent')

        expect(mockDialog.open).toHaveBeenCalled()
        expect(publishSpy).toHaveBeenCalledWith(mockRow)
    })

    it('should delete content', () => {
        const mockRow = { id: '1', status: 'DRAFT', userType: 'Designation' }
        mockTrainingPlanService.archivePlan.mockReturnValue(of({ success: true }))
        const filterSpy = jest.spyOn(component, 'filter').mockImplementation(() => { })
        const tabNavigateSpy = jest.spyOn(component, 'tabNavigate').mockImplementation(() => { })

        component.deleteContentData(mockRow)

        expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(true)
        expect(mockTrainingPlanService.archivePlan).toHaveBeenCalledWith({
            request: {
                id: '1',
                comment: 'Content deleted'
            }
        })
        expect(mockSnackBar.open).toHaveBeenCalledWith('CBP plan deleted successfully.')
        expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
        expect(filterSpy).toHaveBeenCalled()
        expect(tabNavigateSpy).toHaveBeenCalledWith('draft', 'Designation')
    })

    it('should handle error when deleting content', () => {
        const mockRow = { id: '1', status: 'DRAFT', userType: 'Designation' }
        mockTrainingPlanService.archivePlan.mockReturnValue(throwError('Error'))

        component.deleteContentData(mockRow)

        expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(true)
        expect(mockTrainingPlanService.archivePlan).toHaveBeenCalled()
        expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
    })

})
