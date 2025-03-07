
import { AddPlanInformationComponent } from './add-plan-information.component'
import { UntypedFormBuilder } from '@angular/forms'
import { TrainingPlanDataSharingService } from '../../services/training-plan-data-share.service'
describe('AddPlanInformationComponent', () => {
    let component: AddPlanInformationComponent
    let mockTpdsSvc: jest.Mocked<TrainingPlanDataSharingService>
    let formBuilder: UntypedFormBuilder

    beforeEach(() => {
        // Mock the TrainingPlanDataSharingService
        mockTpdsSvc = {
            trainingPlanTitle: '',
            trainingPlanStepperData: {
                name: ''
            }
        } as unknown as jest.Mocked<TrainingPlanDataSharingService>

        // Create a real FormBuilder instance
        formBuilder = new UntypedFormBuilder()

        // Create component instance
        component = new AddPlanInformationComponent(formBuilder, mockTpdsSvc)

        // Spy on the emit method of the planTitleInvalid EventEmitter
        jest.spyOn(component.planTitleInvalid, 'emit')
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should emit planTitleInvalid as true when trainingPlanTitle is not set', () => {
            mockTpdsSvc.trainingPlanTitle = ''
            component.ngOnInit()
            expect(component.planTitleInvalid.emit).toHaveBeenCalledWith(true)
        })

        it('should not emit planTitleInvalid when trainingPlanTitle is set', () => {
            mockTpdsSvc.trainingPlanTitle = 'Existing Title'
            component.ngOnInit()
            expect(component.planTitleInvalid.emit).not.toHaveBeenCalledWith(true)
        })

        it('should initialize contentForm with required validators', () => {
            component.ngOnInit()
            expect(component.contentForm.get('name')).toBeTruthy()
            expect(component.contentForm.get('name')?.validator).toBeTruthy()
        })

        it('should set form value when trainingPlanTitle exists', () => {
            mockTpdsSvc.trainingPlanTitle = 'Existing Plan Title'
            component.ngOnInit()
            expect(component.contentForm.get('name')?.value).toBe('Existing Plan Title')
        })
    })

    describe('form validation', () => {
        beforeEach(() => {
            component.ngOnInit()
        })

        it('should mark form as invalid when name is empty', () => {
            component.contentForm.get('name')?.setValue('')
            expect(component.contentForm.valid).toBeFalsy()
        })

        it('should mark form as invalid when name is too short', () => {
            component.contentForm.get('name')?.setValue('Short')
            expect(component.contentForm.valid).toBeFalsy()
        })

        it('should mark form as valid when name meets requirements', () => {
            component.contentForm.get('name')?.setValue('Valid Name That Is Long Enough')
            expect(component.contentForm.valid).toBeTruthy()
        })

        it('should mark form as invalid with special characters', () => {
            component.contentForm.get('name')?.setValue('Invalid@Name#')
            expect(component.contentForm.valid).toBeFalsy()
        })
    })

    describe('form value changes', () => {
        beforeEach(() => {
            component.ngOnInit()
            jest.useFakeTimers()
        })

        afterEach(() => {
            jest.useRealTimers()
        })

        it('should update trainingPlanTitle when form is valid', () => {
            component.contentForm.get('name')?.setValue('Valid Name That Is Long Enough')
            jest.advanceTimersByTime(500) // Simulate debounceTime
            expect(mockTpdsSvc.trainingPlanTitle).toBe('Valid Name That Is Long Enough')
            expect(mockTpdsSvc.trainingPlanStepperData.name).toBe('Valid Name That Is Long Enough')
        })

        it('should not update trainingPlanTitle when form is invalid', () => {
            mockTpdsSvc.trainingPlanTitle = 'Previous Title'
            component.contentForm.get('name')?.setValue('Short') // Too short
            jest.advanceTimersByTime(500) // Simulate debounceTime
            expect(mockTpdsSvc.trainingPlanTitle).toBe('Previous Title')
        })

        it('should emit form invalid status on value changes', () => {
            component.contentForm.get('name')?.setValue('Short') // Too short
            jest.advanceTimersByTime(500) // Simulate debounceTime
            expect(component.planTitleInvalid.emit).toHaveBeenCalledWith(true)

            component.contentForm.get('name')?.setValue('Valid Name That Is Long Enough')
            jest.advanceTimersByTime(500) // Simulate debounceTime
            expect(component.planTitleInvalid.emit).toHaveBeenCalledWith(false)
        })
    })

    describe('ngOnDestroy', () => {
        it('should unsubscribe from subscriptions', () => {
            component.ngOnInit()
            const unsubscribeSpy = jest.spyOn(component['subscr'], 'unsubscribe')
            component.ngOnDestroy()
            expect(unsubscribeSpy).toHaveBeenCalled()
        })
    })
})