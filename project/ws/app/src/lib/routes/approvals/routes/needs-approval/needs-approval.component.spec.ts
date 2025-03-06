import { NeedsApprovalComponent } from './needs-approval.component'
import { NeedApprovalsService } from '../../services/need-approvals.service'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { EventService } from '@sunbird-cb/utils'
import { ActivatedRoute } from '@angular/router'
import { TelemetryEvents } from '../../../../head/_services/telemetry.event.model'
import { of } from 'rxjs'
import * as _ from 'lodash'

jest.mock('../../services/need-approvals.service')
jest.mock('@angular/material/legacy-dialog')
jest.mock('@angular/material/legacy-snack-bar')
jest.mock('@sunbird-cb/utils')
jest.mock('lodash')

describe('NeedsApprovalComponent', () => {
    let component: NeedsApprovalComponent
    let needApprService: any
    let dialog: any
    let matSnackBar: any
    let events: any
    let activatedRoute: jest.Mocked<ActivatedRoute>

    beforeEach(() => {
        needApprService = new NeedApprovalsService(null as any)
        dialog = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any)
        matSnackBar = new MatSnackBar(null as any, null as any, null as any, null as any, null as any, null as any)
        events = new EventService(null as any, null as any)
        activatedRoute = { data: { subscribe: jest.fn() } } as any

        component = new NeedsApprovalComponent(
            needApprService,
            activatedRoute,
            null as any, // Router can be null for the purpose of these tests
            events,
            dialog,
            matSnackBar
        )

        // Mocking the methods
        // jest.spyOn(activatedRoute.data, 'subscribe').mockImplementation((cb) =>
        //     cb({
        //         pageData: {
        //             data: {
        //                 profileData: [],
        //             },
        //         },
        //     })
        // )

        // Mock lodash methods
        jest.spyOn(_, 'first').mockReturnValue({})
        jest.spyOn(_, 'get').mockReturnValue({ wfInfo: [] })
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should open approve dialog when onClickHandleWorkflow is called with APPROVE action', () => {
        const openDialogSpy = jest.spyOn(dialog, 'open')
        const mockDialogRef = {
            afterClosed: jest.fn().mockReturnValue(of(true)),
        }
        openDialogSpy.mockReturnValue(mockDialogRef as any)

        const field = { wf: { userId: 'user1', applicationId: 'app1', wfId: 'wf1', updateFieldValues: '[]' } }
        const action = 'APPROVE'

        component.onClickHandleWorkflow(field, action)

        expect(openDialogSpy).toHaveBeenCalled()
        expect(mockDialogRef.afterClosed).toHaveBeenCalled()
    })

    it('should call onApproveOrRejectClick after dialog is closed with result', () => {
        const openDialogSpy = jest.spyOn(dialog, 'open')
        const mockDialogRef = {
            afterClosed: jest.fn().mockReturnValue(of(true)),
        }
        openDialogSpy.mockReturnValue(mockDialogRef as any)

        const field = { wf: { userId: 'user1', applicationId: 'app1', wfId: 'wf1', updateFieldValues: '[]' } }
        const action = 'APPROVE'

        const onApproveOrRejectClickSpy = jest.spyOn(component, 'onApproveOrRejectClick')

        component.onClickHandleWorkflow(field, action)

        expect(onApproveOrRejectClickSpy).toHaveBeenCalled()
    })

    it('should call handleWorkflow service onApproveOrRejectClick', () => {
        const req = {
            action: 'APPROVE',
            state: 'SEND_FOR_APPROVAL',
            userId: 'user1',
            applicationId: 'app1',
            actorUserId: 'actor1',
            wfId: 'wf1',
            serviceName: 'profile',
            updateFieldValues: [],
        }

        const handleWorkflowSpy = jest.spyOn(needApprService, 'handleWorkflow').mockReturnValue(of({ result: { data: { status: 'APPROVED' } } }))
        const openSnackBarSpy = jest.spyOn(matSnackBar, 'open')

        component.onApproveOrRejectClick(req)

        expect(handleWorkflowSpy).toHaveBeenCalledWith(req)
        expect(openSnackBarSpy).toHaveBeenCalledWith('Request Approved')
    })

    it('should show a snack bar message after workflow is rejected', () => {
        const req = {
            action: 'REJECT',
            state: 'SEND_FOR_APPROVAL',
            userId: 'user1',
            applicationId: 'app1',
            actorUserId: 'actor1',
            wfId: 'wf1',
            serviceName: 'profile',
            updateFieldValues: [],
        }

        // const handleWorkflowSpy = jest.spyOn(needApprService, 'handleWorkflow').mockReturnValue(of({ result: { data: { status: 'REJECTED' } } }))
        const openSnackBarSpy = jest.spyOn(matSnackBar, 'open')

        component.onApproveOrRejectClick(req)

        expect(openSnackBarSpy).toHaveBeenCalledWith('Request Rejected Successfully')
    })

    it('should raise telemetry event when onClickHandleWorkflow is called', () => {
        const raiseInteractTelemetrySpy = jest.spyOn(events, 'raiseInteractTelemetry')
        const field = { wf: { userId: 'user1', applicationId: 'app1', wfId: 'wf1', updateFieldValues: '[]' } }
        const action = 'APPROVE'

        component.onClickHandleWorkflow(field, action)

        expect(raiseInteractTelemetrySpy).toHaveBeenCalledWith(
            {
                type: TelemetryEvents.EnumInteractTypes.CLICK,
                subType: TelemetryEvents.EnumInteractSubTypes.BTN_CONTENT,
            },
            {
                id: 'app1',
                type: TelemetryEvents.EnumIdtype.APPLICATION,
            }
        )
    })
})
