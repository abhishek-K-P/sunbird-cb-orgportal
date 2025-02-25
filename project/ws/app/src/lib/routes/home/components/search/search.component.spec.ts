import { SearchComponent } from './search.component'
import { LoaderService } from '../../../../../../../../../src/app/services/loader.service'
import { UsersService } from '../../../users/services/users.service'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { EventEmitter } from '@angular/core'

describe('SearchComponent', () => {
    let component: SearchComponent
    let mockDialog: MatDialog
    let mockUsersService: UsersService
    let mockLoaderService: LoaderService
    let mockHandleApiData: EventEmitter<any>
    let mockHandleApproveAll: EventEmitter<any>

    beforeEach(() => {
        mockDialog = { open: jest.fn(() => ({ afterClosed: jest.fn(() => ({ subscribe: jest.fn() })) })) } as unknown as MatDialog
        mockUsersService = { getAllUsers: jest.fn() } as unknown as UsersService
        mockLoaderService = { changeLoaderState: jest.fn() } as unknown as LoaderService
        mockHandleApiData = new EventEmitter()
        mockHandleApproveAll = new EventEmitter()

        component = new SearchComponent(mockDialog, mockUsersService, mockLoaderService)
        component.handleApiData = mockHandleApiData
        component.handleapproveAll = mockHandleApproveAll
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should open the filter when openFilter is called', () => {
        const filterFacetsData = { someData: 'example' }
        component.filterFacetsData = filterFacetsData

        component.openFilter()

        expect(component.filterVisibilityFlag).toBe(true)
        expect(mockUsersService.filterToggle.next).toHaveBeenCalledWith({
            from: '',
            status: true,
            data: filterFacetsData,
        })
    })

    it('should hide the filter when hideFilter is called with "applyFilter"', () => {
        const event = { filter: 'applyFilter' }

        component.hideFilter(event)

        expect(component.filterVisibilityFlag).toBe(false)
        expect(mockUsersService.filterToggle.next).toHaveBeenCalledWith({
            from: '',
            status: false,
            data: component.filterFacetsData,
        })
    })

    it('should call getContent and emit handleApiData', () => {
        const mockResponse = { data: 'some data' }
        mockUsersService.getAllUsers = jest.fn().mockReturnValue({ subscribe: (cb: any) => cb(mockResponse) })

        component.getContent()

        expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(true)
        expect(mockUsersService.getAllUsers).toHaveBeenCalled()
        expect(mockHandleApiData.emit).toHaveBeenCalledWith(true)
        expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
    })

    it('should call searchData and emit search request', () => {
        const event = { target: { value: 'test' } }
        const emitSpy = jest.spyOn(component.handleApiData, 'emit')

        component.searchData(event)

        expect(component.searchText).toBe('test')
        expect(emitSpy).toHaveBeenCalledWith({
            searchText: 'test',
            filters: component.filtersList,
            sortOrder: component.sortOrder,
        })
    })

    it('should call applyFilter and reset search if no value entered', () => {
        const event = { target: { value: '' } }
        const searchDataSpy = jest.spyOn(component, 'searchData')

        component.applyFilter(event)

        expect(searchDataSpy).toHaveBeenCalledWith(event)
    })

    it('should reset page index when resetPageIndex is called', () => {
        component.pageIndex = 5
        component.pageSize = 50

        component.resetPageIndex()

        expect(component.pageIndex).toBe(0)
        expect(component.pageSize).toBe(20)
    })

    it('should emit approveAll when approveAll is called', () => {
        const emitSpy = jest.spyOn(component.handleapproveAll, 'emit')

        component.approveAll()

        expect(emitSpy).toHaveBeenCalled()
    })

    it('should call confirmApproval and emit approveAll if confirmed', () => {
        //const dialogMock = { afterClosed: jest.fn(() => ({ subscribe: jest.fn((cb: any) => cb(true)) })) }
        //mockDialog.open = jest.fn(() => dialogMock)

        const template = {}
        const emitSpy = jest.spyOn(component.handleapproveAll, 'emit')

        component.confirmApproval(template)

        expect(mockDialog.open).toHaveBeenCalledWith(template, { width: '500px' })
        expect(emitSpy).toHaveBeenCalled()
    })

    it('should not emit approveAll if approval is not confirmed in confirmApproval', () => {
        // const dialogMock = { afterClosed: jest.fn(() => ({ subscribe: jest.fn((cb: any) => cb(false)) })) }
        // mockDialog.open = jest.fn(() => dialogMock)

        const template = {}
        const emitSpy = jest.spyOn(component.handleapproveAll, 'emit')

        component.confirmApproval(template)

        expect(mockDialog.open).toHaveBeenCalledWith(template, { width: '500px' })
        expect(emitSpy).not.toHaveBeenCalled()
    })
})
