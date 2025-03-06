import { CreateTimelineComponent } from './create-timeline.component'
import { PreviewDialogBoxComponent } from '../../components/preview-dialog-box/preview-dialog-box.component'

describe('CreateTimelineComponent', () => {
    let component: CreateTimelineComponent
    let tpdsSvcMock: any
    let dialogMock: any

    beforeEach(() => {
        // Mock the TrainingPlanDataSharingService
        tpdsSvcMock = {
            trainingPlanStepperData: {
                status: 'live',
                assignmentType: 'Designation',
            },
            trainingPlanContentData: {
                data: {
                    content: [
                        { selected: true },
                        { selected: true },
                        { selected: false },
                        { selected: true },
                        { selected: true },
                    ],
                },
            },
            trainingPlanAssigneeData: {
                category: 'Designation',
                data: [
                    { selected: true },
                    { selected: false },
                    { selected: true },
                    { selected: true },
                ],
            },
        }

        // Mock MatDialog
        dialogMock = {
            open: jest.fn().mockReturnValue({
                afterClosed: jest.fn().mockReturnValue({
                    subscribe: jest.fn(),
                }),
            }),
        }

        // Create an instance of the component
        component = new CreateTimelineComponent(tpdsSvcMock, dialogMock)
    })

    it('should initialize with content data and assignee data', () => {
        component.ngOnInit()

        expect(component.isContentLive).toBe(true)
        expect(component.contentData.length).toBe(4) // Because we slice to get 4 items
        expect(component.totalContentCount).toBe(4) // 4 selected items

        expect(component.assigneeData.category).toBe('Designation')
        expect(component.assigneeData.data.length).toBe(3) // 3 selected assignees
        expect(component.totalAssigneeCount).toBe(3) // 3 selected assignees
    })

    it('should filter content data correctly', () => {
        component.getContentData()

        // Verify content data selection
        expect(component.contentData.length).toBe(4)
        expect(component.contentData[0].selected).toBe(true)
        expect(component.contentData[1].selected).toBe(true)
    })

    it('should filter assignee data correctly for Designation', () => {
        component.getDesignationData()

        expect(component.assigneeData.category).toBe('Designation')
        expect(component.assigneeData.data.length).toBe(3) // Should return 3 selected assignees
        expect(component.totalAssigneeCount).toBe(3) // 3 selected assignees
    })

    it('should open dialog when showAll is called', () => {
        component.showAll('content')

        expect(dialogMock.open).toHaveBeenCalledWith(PreviewDialogBoxComponent, {
            disableClose: true,
            data: { from: 'content' },
            autoFocus: false,
            width: '90%',
        })
    })

    it('should call getContentData when contentRemoved is called', () => {
        const getContentDataSpy = jest.spyOn(component, 'getContentData')

        component.contentRemoved()

        expect(getContentDataSpy).toHaveBeenCalled()
    })

    it('should call getDesignationData when selectedUserRemoved is called with Designation', () => {
        const getDesignationDataSpy = jest.spyOn(component, 'getDesignationData')

        component.selectedUserRemoved()

        expect(getDesignationDataSpy).toHaveBeenCalled()
    })

    it('should call getCustomUserData when selectedUserRemoved is called with CustomUser', () => {
        tpdsSvcMock.trainingPlanStepperData.assignmentType = 'CustomUser'
        const getCustomUserDataSpy = jest.spyOn(component, 'getCustomUserData')

        component.selectedUserRemoved()

        expect(getCustomUserDataSpy).toHaveBeenCalled()
    })
})
