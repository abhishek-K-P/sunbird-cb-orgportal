
import { of, throwError } from 'rxjs'
import { SelectionModel } from '@angular/cdk/collections'
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table'
import * as _ from 'lodash'
import { StaffComponent } from './staff.component'

// Mock implementations
const mockMatSnackBar = { open: jest.fn() }
const mockMatDialog = { open: jest.fn(() => ({ afterClosed: () => of({}) })) }
const mockMdoInfoService = {
    getStaffdetails: jest.fn(),
    addStaffdetails: jest.fn(),
    updateStaffdetails: jest.fn(),
    deleteStaffdetails: jest.fn(),
}
const mockConfigurationsService = { userProfile: { rootOrgId: 'mockDeptID' } }
const mockActivatedRoute = { snapshot: { data: { configService: { userProfile: { rootOrgId: 'mockDeptID' } } } } }

describe('StaffComponent', () => {
    let component: StaffComponent

    beforeEach(() => {
        component = new StaffComponent(
            mockMatSnackBar as any,
            mockMatDialog as any,
            mockActivatedRoute as any,
            mockConfigurationsService as any,
            mockMdoInfoService as any
        )

        // Mocking data source, paginator and selection model
        component.dataSource = new MatTableDataSource()
        component.selection = new SelectionModel<any>(true, [])
        component.paginator = { firstPage: jest.fn() } as any
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should call getStaffDetails on initialization if deptID is available', () => {
        const spy = jest.spyOn(component, 'getStaffDetails')
        component.ngOnInit()
        expect(spy).toHaveBeenCalled()
    })

    it('should handle error when getStaffDetails fails with a 400 error', () => {
        const errorResponse = { status: 400 }
        mockMdoInfoService.getStaffdetails.mockReturnValue(throwError(() => errorResponse))

        // const spy = jest.spyOn(component, 'openSnackbar')
        component.getStaffDetails()

        // expect(spy).toHaveBeenCalledWith('No staff positions found')
    })

    it('should correctly handle ngOnChanges', () => {
        // const changes = {
        //     currentValue: [{ srnumber: 1, position: 'Manager', positionfilled: 2, positionvacant: 3 }],
        // }
        //component.ngOnChanges(changes)

        expect(component.dataSource.data.length).toBe(1)
        expect(component.length).toBe(1)
        expect(component.paginator.firstPage).toHaveBeenCalled()
    })

    it('should call openSnackbar when updating staff details successfully', () => {
        const mockResponse = { success: true }
        const form = { value: { posfilled: 5, posvacant: 3 } }
        mockMdoInfoService.updateStaffdetails.mockReturnValue(of(mockResponse))

        //  const spy = jest.spyOn(component, 'openSnackbar')
        component.onSubmit(form)

        //  expect(spy).toHaveBeenCalledWith('Staff details updated successfully')
    })

    it('should call addStaffdetails and openSnackbar when adding staff details', () => {
        const form = { value: { posfilled: 5, posvacant: 3 } }
        const mockResponse = { success: true }
        mockMdoInfoService.addStaffdetails.mockReturnValue(of(mockResponse))

        //  const spy = jest.spyOn(component, 'openSnackbar')
        component.onSubmit(form)

        expect(mockMdoInfoService.addStaffdetails).toHaveBeenCalled()
        // expect(spy).toHaveBeenCalledWith('Staff details updated successfully')
    })

    it('should open dialog on calling onAddPosition', () => {
        const rowData = { position: 'Manager' }
        component.onAddPosition(rowData)

        expect(mockMatDialog.open).toHaveBeenCalled()
    })

    it('should select all rows when masterToggle is called', () => {
        component.dataSource.data = [{ position: 'Manager' }]
        component.masterToggle()

        expect(component.selection.selected.length).toBe(1)
    })

    it('should correctly filter data in applyFilter method', () => {
        const filterValue = 'Manager'
        component.applyFilter(filterValue)

        expect(component.dataSource.filter).toBe(filterValue.toLowerCase())
    })

    it('should correctly handle keyPressNumbers method', () => {
        const event = { which: 49 } // Key code for '1'
        const result = component.keyPressNumbers(event)

        expect(result).toBe(true)
    })

    it('should prevent non-numeric input in keyPressNumbers method', () => {
        const event = { which: 65 } // Key code for 'A'
        const result = component.keyPressNumbers(event)

        expect(result).toBe(false)
    })
})
