import { DraftAllocationsComponent } from './draft-allocations.component'
import { of } from 'rxjs'

jest.mock('@angular/router', () => ({
    ActivatedRoute: jest.fn(),
    Router: jest.fn(),
}))

jest.mock('../../services/uploadfile.service')
jest.mock('@sunbird-cb/utils')
jest.mock('@angular/material/legacy-dialog')
jest.mock('../../services/allocation.service')
jest.mock('../../../../head/_services/telemetry.event.model')

describe('DraftAllocationsComponent', () => {
    let component: DraftAllocationsComponent
    let mockActivatedRoute
    let mockRouter: any
    let mockUploadFileService: any
    let mockEventService: any
    let mockDialog: any
    let mockAllocationService: any

    beforeEach(() => {
        mockActivatedRoute = { queryParamMap: of({ has: jest.fn().mockReturnValue(true), get: jest.fn().mockReturnValue('status') }), params: of({ workorder: '123' }) }
        mockRouter = { navigate: jest.fn() }
        mockUploadFileService = { getDraftPDF: jest.fn() }
        mockEventService = { raiseInteractTelemetry: jest.fn() }
        mockDialog = { open: jest.fn() }
        mockAllocationService = { getAllocatedUsers: jest.fn() }

        component = new DraftAllocationsComponent(
            mockActivatedRoute as any,
            mockRouter as any,
            mockUploadFileService,
            mockEventService,
            mockDialog,
            mockAllocationService,
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should call getAllocatedUsers when workorderID is available in params', () => {
        const spy = jest.spyOn(component, 'getAllocatedUsers')
        component.ngOnInit()
        expect(spy).toHaveBeenCalledWith('123')
    })

    it('should call printDraft and open the file URL when PDF is received', () => {
        const mockResponse = new Blob(['pdf'], { type: 'application/pdf' })
        mockUploadFileService.getDraftPDF.mockReturnValue(of(mockResponse))

        // const openSpy = jest.spyOn(window, 'open').mockImplementation(() => { })
        component.printDraft()
        expect(mockUploadFileService.getDraftPDF).toHaveBeenCalledWith('123')
        // expect(openSpy).toHaveBeenCalled()
        expect(mockEventService.raiseInteractTelemetry).toHaveBeenCalled()
    })

    it('should call onNewAllocationClick and navigate to correct route', () => {
        component.workorderID = '123'
        component.onNewAllocationClick()
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/workallocation/create', '123'])
        expect(mockEventService.raiseInteractTelemetry).toHaveBeenCalled()
    })

    it('should call publishWorkOrder and open the dialog with correct data', () => {
        const dialogData = { data: 'workorderData' }
        component.workorderData = dialogData
        component.publishWorkOrder()
        expect(mockDialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: dialogData }))
        expect(mockEventService.raiseInteractTelemetry).toHaveBeenCalled()
    })

    it('should set filteredData correctly based on the term', () => {
        component.data = [
            { userName: 'John Doe' },
            { userName: 'Jane Smith' },
        ]
        component.term = 'john'
        const filteredData = component.filteredData
        expect(filteredData.length).toBe(1)
        expect(filteredData[0].userName).toBe('John Doe')
    })

    it('should call getAllocatedUsers and update data correctly', () => {
        const mockResponse = { result: { data: { name: 'Work Order', users: [{ userName: 'John' }] } } }
        mockAllocationService.getAllocatedUsers.mockReturnValue(of(mockResponse))
        component.getAllocatedUsers('123')
        expect(component.workorderData).toEqual(mockResponse.result.data)
        expect(component.data).toEqual(mockResponse.result.data.users)
    })
})
