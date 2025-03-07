import { AddTimelineFormComponent } from './add-timeline-form.component'
import { DatePipe } from '@angular/common'
import { TrainingPlanDataSharingService } from '../../services/training-plan-data-share.service'

describe('AddTimelineFormComponent', () => {
    let component: AddTimelineFormComponent
    let tpdsSvcMock: jest.Mocked<TrainingPlanDataSharingService>
    let datePipeMock: jest.Mocked<DatePipe>

    beforeEach(() => {
        tpdsSvcMock = {
            trainingPlanStepperData: { endDate: '2025-03-01' },
        } as any

        datePipeMock = {
            transform: jest.fn(),
        } as any

        component = new AddTimelineFormComponent(tpdsSvcMock, datePipeMock)
    })

    describe('ngOnInit', () => {
        it('should set todayDate if endDate is present in trainingPlanStepperData', () => {
            component.ngOnInit()
            expect(component.todayDate).toBeInstanceOf(Date)
            expect(component.todayDate.toISOString()).toBe('2025-03-01T00:00:00.000Z')
        })

        it('should not set todayDate if endDate is not present in trainingPlanStepperData', () => {
            tpdsSvcMock.trainingPlanStepperData.endDate = undefined
            component.ngOnInit()
            expect(component.todayDate).toBeUndefined()
        })
    })

    describe('changeTimeline', () => {
        it('should update trainingPlanStepperData with the correct transformed date', () => {
            const timeline = new Date('2025-03-10')
            datePipeMock.transform.mockReturnValue('2025-03-10')

            component.changeTimeline(timeline)

            expect(tpdsSvcMock.trainingPlanStepperData['endDate']).toBe('2025-03-10')
            expect(datePipeMock.transform).toHaveBeenCalledWith(timeline, 'yyyy-MM-dd')
        })

        it('should call transform method with the correct parameters', () => {
            const timeline = new Date('2025-03-15')
            component.changeTimeline(timeline)
            expect(datePipeMock.transform).toHaveBeenCalledWith(timeline, 'yyyy-MM-dd')
        })
    })
})
