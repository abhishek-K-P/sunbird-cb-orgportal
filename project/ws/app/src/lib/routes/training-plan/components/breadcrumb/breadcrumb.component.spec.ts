import { BreadcrumbComponent } from './breadcrumb.component'
import { TrainingPlanContent } from '../../models/training-plan.model'
import { of } from 'rxjs'

describe('BreadcrumbComponent', () => {
    let component: BreadcrumbComponent
    let mockRouter: any
    let mockActivatedRoute: any
    let mockDialog: any
    let mockTpdsSvc: any
    let mockTpSvc: any
    let mockSnackBar: any
    let mockDialogRef: any

    beforeEach(() => {
        mockDialogRef = {
            afterClosed: jest.fn().mockReturnValue(of('confirmed')),
            close: jest.fn()
        }

        mockRouter = {
            navigate: jest.fn(),
            navigateByUrl: jest.fn()
        }

        mockActivatedRoute = {
            snapshot: {
                data: {
                    contentData: null
                }
            }
        }

        mockDialog = {
            open: jest.fn().mockReturnValue(mockDialogRef)
        }

        mockTpdsSvc = {
            trainingPlanTitle: 'Test Title',
            trainingPlanStepperData: {
                name: '',
                status: 'draft',
                assignmentType: 'AllUser',
                assignmentTypeInfo: [],
                contentList: [],
                endDate: null
            }
        }

        mockTpSvc = {
            createPlan: jest.fn().mockReturnValue(of({ success: true })),
            updatePlan: jest.fn().mockReturnValue(of({ success: true })),
            publishPlan: jest.fn().mockReturnValue(of({ params: { status: 'success' } }))
        }

        mockSnackBar = {
            open: jest.fn()
        }

        component = new BreadcrumbComponent(
            mockRouter,
            mockActivatedRoute,
            mockDialog,
            mockTpdsSvc,
            mockTpSvc,
            mockSnackBar
        )
    })

    it('should initialize with default values', () => {
        expect(component.showBreadcrumbAction).toBe(true)
        expect(component.selectedTab).toBe('')
        expect(component.editState).toBe(false)
        expect(component.isLiveContent).toBe(false)
    })

    describe('ngOnInit', () => {
        it('should set editState to false when contentData is not present', () => {
            component.ngOnInit()
            expect(component.editState).toBe(false)
        })

        it('should set editState to true when contentData is present', () => {
            mockActivatedRoute.snapshot.data.contentData = { status: 'draft' }
            component.ngOnInit()
            expect(component.editState).toBe(true)
            expect(component.contentData).toEqual({ status: 'draft' })
        })

        it('should set isLiveContent to true when content status is live', () => {
            mockActivatedRoute.snapshot.data.contentData = { status: 'live' }
            component.ngOnInit()
            expect(component.isLiveContent).toBe(true)
        })
    })

    describe('cancel', () => {
        it('should reset training plan title and navigate to dashboard', () => {
            component.cancel()
            expect(mockTpdsSvc.trainingPlanTitle).toBe('')
            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('app/home/training-plan-dashboard')
        })
    })

    describe('nextStep', () => {
        it('should emit CREATE_PLAN to ADD_CONTENT', () => {
            component.selectedTab = TrainingPlanContent.TTabLabelKey.CREATE_PLAN
            component.changeToNextTab = { emit: jest.fn() } as any

            component.nextStep()

            expect(component.changeToNextTab.emit).toHaveBeenCalledWith(TrainingPlanContent.TTabLabelKey.ADD_CONTENT)
        })

        it('should emit ADD_CONTENT to ADD_ASSIGNEE', () => {
            component.selectedTab = TrainingPlanContent.TTabLabelKey.ADD_CONTENT
            component.changeToNextTab = { emit: jest.fn() } as any

            component.nextStep()

            expect(component.changeToNextTab.emit).toHaveBeenCalledWith(TrainingPlanContent.TTabLabelKey.ADD_ASSIGNEE)
        })

        it('should emit ADD_ASSIGNEE to ADD_TIMELINE', () => {
            component.selectedTab = TrainingPlanContent.TTabLabelKey.ADD_ASSIGNEE
            component.changeToNextTab = { emit: jest.fn() } as any

            component.nextStep()

            expect(component.changeToNextTab.emit).toHaveBeenCalledWith(TrainingPlanContent.TTabLabelKey.ADD_TIMELINE)
        })

        it('should call createPlanDraftView when on ADD_TIMELINE tab', () => {
            component.selectedTab = TrainingPlanContent.TTabLabelKey.ADD_TIMELINE
            component.createPlanDraftView = jest.fn()

            component.nextStep()

            expect(component.createPlanDraftView).toHaveBeenCalled()
        })
    })

    describe('changeTabFromBreadCrumb', () => {
        it('should emit CREATE_PLAN when item is CREATE_PLAN', () => {
            component.changeToNextTab = { emit: jest.fn() } as any

            component.changeTabFromBreadCrumb(TrainingPlanContent.TTabLabelKey.CREATE_PLAN)

            expect(component.changeToNextTab.emit).toHaveBeenCalledWith(TrainingPlanContent.TTabLabelKey.CREATE_PLAN)
        })
    })

    describe('performRoute', () => {
        it('should navigate to training-plan-dashboard with query params when route is list and editState is true', () => {
            component.editState = true
            mockTpdsSvc.trainingPlanStepperData = {
                status: 'draft',
                assignmentType: 'AllUser'
            }

            component.performRoute('list')

            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['app', 'home', 'training-plan-dashboard'],
                {
                    queryParams: {
                        type: 'draft',
                        tabSelected: 'AllUser'
                    }
                }
            )
        })

        it('should navigate to training-plan-dashboard when route is list and editState is false', () => {
            component.editState = false

            component.performRoute('list')

            expect(mockRouter.navigate).toHaveBeenCalledWith(['app', 'home', 'training-plan-dashboard'])
        })

        it('should navigate to specified route when route is not list', () => {
            component.performRoute('create')

            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('app/training-plan/create')
        })
    })

    describe('showDialogBox', () => {
        it('should open dialog with progress data', () => {
            component.openDialoagBox = jest.fn()

            component.showDialogBox('progress')

            expect(component.openDialoagBox).toHaveBeenCalledWith({
                type: 'progress',
                icon: 'vega',
                title: 'Processing your request',
                subTitle: 'Wait a second , your request is processing………'
            })
        })

        it('should open dialog with progress-completed data', () => {
            component.openDialoagBox = jest.fn()

            component.showDialogBox('progress-completed')

            expect(component.openDialoagBox).toHaveBeenCalledWith({
                type: 'progress-completed',
                icon: 'accept_icon',
                title: 'Your processing has been done.',
                subTitle: 'Updated to Draft',
                primaryAction: 'Redirecting....'
            })
        })
    })

    describe('openDialoagBox', () => {
        it('should open dialog with provided data', () => {
            const dialogData = {
                type: 'test',
                icon: 'test-icon',
                title: 'Test Title',
                subTitle: 'Test Subtitle',
                primaryAction: 'Test Primary',
                secondaryAction: 'Test Secondary'
            }

            component.openDialoagBox(dialogData)

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
                disableClose: true,
                data: dialogData,
                autoFocus: false
            })
        })
    })

    describe('hideConfirmationBox', () => {
        it('should close dialog', () => {
            component.dialogRef = mockDialogRef

            component.hideConfirmationBox()

            expect(mockDialogRef.close).toHaveBeenCalled()
        })
    })

    describe('createPlanDraftView', () => {
        it('should create plan and navigate to dashboard on success', () => {
            jest.useFakeTimers()
            mockTpdsSvc.trainingPlanTitle = 'Test Plan'
            mockTpdsSvc.trainingPlanStepperData = {
                name: '',
                status: 'draft',
                assignmentType: 'AllUser'
            }
            component.showDialogBox = jest.fn()
            component.dialogRef = mockDialogRef

            component.createPlanDraftView()

            expect(component.showDialogBox).toHaveBeenCalledWith('progress')
            expect(mockTpSvc.createPlan).toHaveBeenCalledWith({
                request: {
                    name: 'Test Plan',
                    status: 'draft',
                    assignmentType: 'AllUser'
                }
            })
            expect(mockDialogRef.close).toHaveBeenCalled()
            expect(component.showDialogBox).toHaveBeenCalledWith('progress-completed')

            jest.advanceTimersByTime(1000)

            expect(mockDialogRef.close).toHaveBeenCalled()
            expect(mockTpdsSvc.trainingPlanTitle).toBe('')
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['app', 'home', 'training-plan-dashboard'],
                {
                    queryParams: {
                        type: 'draft',
                        tabSelected: 'AllUser'
                    }
                }
            )

            jest.useRealTimers()
        })
    })

    describe('checkIfDisabled', () => {
        it('should return validation status for CREATE_PLAN tab', () => {
            component.selectedTab = TrainingPlanContent.TTabLabelKey.CREATE_PLAN
            component.validationList = {
                titleIsInvalid: false
            }

            const result = component.checkIfDisabled()

            expect(result).toBe(false)
        })

        it('should return validation status for ADD_CONTENT tab', () => {
            component.selectedTab = TrainingPlanContent.TTabLabelKey.ADD_CONTENT
            component.validationList = {
                addContentIsInvalid: false
            }

            const result = component.checkIfDisabled()

            expect(result).toBe(false)
        })

        it('should return validation status for ADD_ASSIGNEE tab', () => {
            component.selectedTab = TrainingPlanContent.TTabLabelKey.ADD_ASSIGNEE
            component.validationList = {
                addAssigneeIsInvalid: false
            }

            const result = component.checkIfDisabled()

            expect(result).toBe(false)
        })

        it('should return true for any other tab', () => {
            component.selectedTab = 'unknown'

            const result = component.checkIfDisabled()

            expect(result).toBe(true)
        })
    })

    describe('updatePlan', () => {
        beforeEach(() => {
            component.showDialogBox = jest.fn()
            component.dialogRef = mockDialogRef
            component.publishPlan = jest.fn()
            mockActivatedRoute.snapshot.data.contentData = { id: '123' }
            mockTpdsSvc.trainingPlanStepperData = {
                name: '',
                status: 'draft',
                assignmentType: 'AllUser',
                assignmentTypeInfo: [],
                contentList: [],
                contentType: 'course',
                endDate: null
            }
        })

        it('should update plan for non-live content', () => {
            jest.useFakeTimers()
            component.isLiveContent = false

            component.updatePlan()

            expect(component.showDialogBox).toHaveBeenCalledWith('progress')
            expect(mockTpSvc.updatePlan).toHaveBeenCalledWith({
                request: {
                    name: mockTpdsSvc.trainingPlanTitle,
                    assignmentType: 'AllUser',
                    assignmentTypeInfo: ['AllUser'],
                    contentList: [],
                    contentType: 'course',
                    endDate: null,
                    id: '123'
                }
            })
            expect(mockDialogRef.close).toHaveBeenCalled()
            expect(component.showDialogBox).toHaveBeenCalledWith('progress-completed')

            jest.advanceTimersByTime(1000)

            expect(mockDialogRef.close).toHaveBeenCalled()
            expect(mockTpdsSvc.trainingPlanTitle).toBe('')
            expect(mockRouter.navigate).toHaveBeenCalled()

            jest.useRealTimers()
        })

        it('should update plan and publish for live content', () => {
            component.isLiveContent = true
            mockTpdsSvc.trainingPlanStepperData.status = 'live'

            component.updatePlan()

            expect(component.showDialogBox).toHaveBeenCalledWith('progress')
            expect(mockTpSvc.updatePlan).toHaveBeenCalledWith({
                request: {
                    name: mockTpdsSvc.trainingPlanTitle,
                    assignmentType: 'AllUser',
                    assignmentTypeInfo: ['AllUser'],
                    id: '123'
                }
            })
            expect(mockDialogRef.close).toHaveBeenCalled()
            expect(component.publishPlan).toHaveBeenCalled()
        })
    })

})