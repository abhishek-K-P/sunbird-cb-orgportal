import { CategoryDropDownComponent } from './category-drop-down.component'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { TrainingPlanDataSharingService } from '../../services/training-plan-data-share.service'
import { of } from 'rxjs'

// Create a mock for MatDialog
const mockMatDialog = {
    open: jest.fn(() => ({
        afterClosed: jest.fn(() => of('cancel')),
    })),
}

describe('CategoryDropDownComponent', () => {
    let component: CategoryDropDownComponent
    let mockTrainingPlanDataSharingService: TrainingPlanDataSharingService

    beforeEach(() => {
        // Mock instance of the service
        // mockTrainingPlanDataSharingService = {
        //     trainingPlanCategoryChangeEvent: of({ event: 'Course' }), // Mock an event emission
        //     trainingPlanStepperData: {},
        //     trainingPlanContentData: { data: [] },
        //     trainingPlanAssigneeData: { data: [] },
        //     moderatedCourseSelectStatus: new Subject(), // Use Subject here to simulate the real behavior
        // }

        // Create the component instance
        component = new CategoryDropDownComponent(mockMatDialog as unknown as MatDialog, mockTrainingPlanDataSharingService)
    })

    describe('ngOnInit', () => {
        it('should initialize and subscribe to the trainingPlanCategoryChangeEvent', () => {
            const emitSpy = jest.spyOn(component.handleCategorySelection, 'emit')
            component.ngOnInit()

            // Manually trigger the subscription logic
            mockTrainingPlanDataSharingService.trainingPlanCategoryChangeEvent.subscribe((data: any) => {
                expect(data.event).toBe('Course')
                expect(emitSpy).toHaveBeenCalledWith('Course')
            })
        })
    })

    describe('ngOnChanges', () => {
        it('should call checkForContent when changes are detected', () => {
            const checkForContentSpy = jest.spyOn(component, 'checkForContent')
            component.ngOnChanges()
            expect(checkForContentSpy).toHaveBeenCalled()
        })
    })

    describe('checkForContent', () => {
        it('should set selectedValue and emit event if "from" is "content"', () => {
            component.from = 'content'
            mockTrainingPlanDataSharingService.trainingPlanStepperData = { contentType: 'Course' }

            const emitSpy = jest.spyOn(component.handleCategorySelection, 'emit')
            component.checkForContent()

            expect(component.selectedValue).toBe('Course')
            expect(emitSpy).toHaveBeenCalledWith('Course')
        })

        it('should set default content type if none exists', () => {
            component.from = 'content'
            mockTrainingPlanDataSharingService.trainingPlanStepperData = {}

            const emitSpy = jest.spyOn(component.handleCategorySelection, 'emit')
            component.checkForContent()

            expect(component.selectedValue).toBe('Course')
            expect(emitSpy).toHaveBeenCalledWith('Course')
        })

        it('should handle "assignee" case', () => {
            component.from = 'assignee'
            mockTrainingPlanDataSharingService.trainingPlanStepperData = { assignmentType: 'Designation' }

            const emitSpy = jest.spyOn(component.handleCategorySelection, 'emit')
            component.checkForContent()

            expect(component.selectedValue).toBe('Designation')
            expect(emitSpy).toHaveBeenCalledWith('Designation')
        })
    })

    describe('showDialogBox', () => {
        it('should open the dialog box for the given event', () => {
            const openSpy = jest.spyOn(mockMatDialog, 'open')
            const emitSpy = jest.spyOn(component.handleCategorySelection, 'emit')

            component.showDialogBox('Course')

            // Verify dialog was opened with correct parameters
            expect(openSpy).toHaveBeenCalledWith(expect.anything(), {
                data: expect.objectContaining({
                    event: 'Course',
                    title: expect.any(String),
                    subTitle: expect.any(String),
                }),
                autoFocus: false,
            })

            // Check if the event was emitted if contentList is empty
            expect(emitSpy).toHaveBeenCalledWith('Course')
        })

        it('should call openDialoagBox when contentList is not empty', () => {
            mockTrainingPlanDataSharingService.trainingPlanStepperData.contentList = ['item']

            const openDialoagBoxSpy = jest.spyOn(component, 'openDialoagBox')
            component.showDialogBox('Course')

            expect(openDialoagBoxSpy).toHaveBeenCalled()
        })
    })

    describe('openDialoagBox', () => {
        it('should open the dialog with correct data', () => {
            const dialogData = {
                type: 'normal',
                icon: 'radio_on',
                title: 'Title',
                subTitle: 'Subtitle',
                primaryAction: 'Confirm',
                secondaryAction: 'Cancel',
                event: 'Course',
            }
            const openSpy = jest.spyOn(mockMatDialog, 'open')

            component.openDialoagBox(dialogData)

            expect(openSpy).toHaveBeenCalledWith(expect.anything(), {
                data: dialogData,
                autoFocus: false,
            })
        })
    })

    describe('hideConfirmationBox', () => {
        it('should close the dialog', () => {
            component.dialogRef = { close: jest.fn() }
            component.hideConfirmationBox()
            expect(component.dialogRef.close).toHaveBeenCalled()
        })
    })
})
