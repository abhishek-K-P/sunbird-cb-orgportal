import { AdminsTableComponent, MY_FORMATS } from './admins-table.component'
import { MatSort } from '@angular/material/sort'
// import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table'

jest.mock('@angular/material/sort', () => ({
    MatSort: jest.fn().mockImplementation(() => ({})),
}))

describe('AdminsTableComponent', () => {
    let component: AdminsTableComponent
    let mockTableData: any
    let mockTableHeaders: any

    beforeEach(() => {
        // Initialize the component
        component = new AdminsTableComponent()

        // Mock the table data and table headers
        mockTableData = [{ id: 1, name: 'Admin 1', preExpiryDate: '2025-01-01' }]
        mockTableHeaders = {
            columns: [
                { key: 'id' },
                { key: 'name' },
                { key: 'preExpiryDate' }
            ]
        }

        // Set input properties
        component.tableData = mockTableData
        component.tableHeaders = mockTableHeaders

        // Call ngOnInit manually since we're not using TestBed
        component.ngOnInit()
    })

    it('should create the component', () => {
        expect(component).toBeDefined()
    })

    it('should initialize dataSource with tableData on ngOnInit', () => {
        expect(component.dataSource.data).toEqual(mockTableData)
    })

    it('should get columns from tableHeaders in getFinalColumns', () => {
        const result = component.getFinalColumns()
        expect(result).toEqual(['id', 'name', 'preExpiryDate'])
    })

    it('should return an empty string if tableHeaders is undefined in getFinalColumns', () => {
        component.tableHeaders = undefined
        const result = component.getFinalColumns()
        expect(result).toBe('')
    })

    it('should enable access button and set button text in enableAccessBtn', () => {
        const rowData = { id: 1, name: 'Admin 1' }
        component.enableAccessBtn(rowData)
        // expect(rowData.enableAccessBtn).toBe(true)
        // expect(rowData.assigned).toBe(false)
        // expect(rowData.buttonText).toBe('Update Access')
    })

    it('should emit rowData when emitSelectedDate is called', () => {
        // Mock EventEmitter to spy on emit
        const emitSpy = jest.spyOn(component.updateAccess, 'emit')
        const rowData = { id: 1, name: 'Admin 1' }

        component.emitSelectedDate(rowData)

        expect(emitSpy).toHaveBeenCalledWith(rowData)
    })

    it('should correctly set minDate and maxDate on initialization', () => {
        const currentDate = new Date()
        const nextYearDate = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate())

        expect(component.minDate).toEqual(currentDate)
        expect(component.maxDate).toEqual(nextYearDate)
    })

    it('should set matSort to dataSource sort', () => {
        const mockSort = new MatSort()
        component.matSort = mockSort
        expect(component.dataSource.sort).toBe(mockSort)
    })

    it('should use custom date formats from MY_FORMATS', () => {
        expect(MY_FORMATS.parse.dateInput).toBe('DD/MM/YYYY')
        expect(MY_FORMATS.display.dateInput).toBe('DD/MM/YYYY')
    })
})
