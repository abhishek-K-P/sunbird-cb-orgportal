import { CreateContentComponent } from './create-content.component'
import { TrainingPlanDataSharingService } from './../../services/training-plan-data-share.service'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { Router } from '@angular/router'
import { ConfirmationBoxComponent } from '../../components/confirmation-box/confirmation.box.component'

// Mock dependencies
jest.mock('../../services/training-plan-data-share.service')
jest.mock('@angular/router')
jest.mock('@angular/material/legacy-dialog')

describe('CreateContentComponent', () => {
    let component: CreateContentComponent
    let tpdsSvcMock: jest.Mocked<TrainingPlanDataSharingService>
    let dialogMock: jest.Mocked<MatDialog>
    let routerMock: jest.Mocked<Router>

    beforeEach(() => {
        tpdsSvcMock = new TrainingPlanDataSharingService() as jest.Mocked<TrainingPlanDataSharingService>
        dialogMock = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any) as jest.Mocked<MatDialog>
        routerMock = new Router() as jest.Mocked<Router>
        component = new CreateContentComponent(tpdsSvcMock, dialogMock, routerMock)
    })

    // Test case 1: Component initialization
    it('should initialize category data correctly on ngOnInit', () => {
        component.ngOnInit()
        expect(component.categoryData.length).toBe(5)
        expect(component.categoryData[0].name).toBe('Courses')
    })

    // Test case 2: handleApiData when trainingPlanContentData and content exist
    it('should update contentData and count in handleApiData when trainingPlanContentData and content exist', () => {
        tpdsSvcMock.trainingPlanContentData = {
            data: {
                content: [{ identifier: '1', selected: false }, { identifier: '2', selected: true }],
                count: 2
            }
        }
        tpdsSvcMock.trainingPlanStepperData = {
            contentList: ['2']
        }
        component.handleApiData(true)
        expect(component.contentData.length).toBe(2)
        expect(component.count).toBe(2)
    })

    // Test case 3: handleSelectedChips when there are selected items
    it('should update selectedContentChips and selectContentCount in handleSelectedChips', () => {
        tpdsSvcMock.trainingPlanContentData = {
            data: {
                content: [{ identifier: '1', selected: false }, { identifier: '2', selected: true }]
            }
        }
        component.handleSelectedChips(true)
        expect(component.selectedContentChips.length).toBe(2)
        expect(component.selectContentCount).toBe(1)
    })

    // Test case 4: handleSelectedChips when there are no selected items
    it('should emit true in addContentInvalid when no items are selected in handleSelectedChips', () => {
        tpdsSvcMock.trainingPlanContentData = {
            data: {
                content: [{ identifier: '1', selected: false }, { identifier: '2', selected: false }]
            }
        }
        const spy = jest.spyOn(component.addContentInvalid, 'emit')
        component.handleSelectedChips(true)
        expect(spy).toHaveBeenCalledWith(true)
    })

    // Test case 5: itemsRemovedFromChip should call handleSelectedChips
    it('should call handleSelectedChips when items are removed from chip', () => {
        const spy = jest.spyOn(component, 'handleSelectedChips')
        component.itemsRemovedFromChip()
        expect(spy).toHaveBeenCalledWith(true)
    })

    // Test case 6: showAddContentDialog should open dialog and navigate
    it('should open dialog and navigate on confirmation', () => {
        // const dialogRefMock = {
        //     afterClosed: jest.fn().mockReturnValue({
        //         subscribe: (callback: Function) => callback('confirmed')
        //     })
        // }
        // dialogMock.open.mockReturnValue(dialogRefMock)
        const navigateSpy = jest.spyOn(routerMock, 'navigate')

        component.showAddContentDialog()

        expect(dialogMock.open).toHaveBeenCalledWith(ConfirmationBoxComponent, expect.any(Object))
        expect(navigateSpy).toHaveBeenCalledWith(['/app/home/create-request-form'])
    })

    // Test case 7: showAddContentDialog should not navigate if not confirmed
    it('should not navigate if dialog is not confirmed', () => {
        // const dialogRefMock = {
        //     afterClosed: jest.fn().mockReturnValue({
        //         subscribe: (callback: Function) => callback('cancelled')
        //     })
        // }
        // dialogMock.open.mockReturnValue(dialogRefMock)
        const navigateSpy = jest.spyOn(routerMock, 'navigate')

        component.showAddContentDialog()

        expect(dialogMock.open).toHaveBeenCalledWith(ConfirmationBoxComponent, expect.any(Object))
        expect(navigateSpy).not.toHaveBeenCalled()
    })
})
