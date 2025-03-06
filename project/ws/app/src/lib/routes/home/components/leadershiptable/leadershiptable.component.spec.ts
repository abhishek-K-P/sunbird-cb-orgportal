import { LeadershiptableComponent } from './leadershiptable.component'
import { MdoInfoService } from '../../services/mdoinfo.service'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { ProfileV2UtillService } from '../../services/home-utill.service'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { Router } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

jest.mock('@angular/material/legacy-dialog')
jest.mock('@angular/material/legacy-snack-bar')
jest.mock('@angular/router', () => ({
    Router: jest.fn().mockImplementation(() => ({
        navigate: jest.fn(),
    })),
    ActivatedRoute: jest.fn().mockImplementation(() => ({
        snapshot: { data: {} },
    })),
}))

describe('LeadershiptableComponent', () => {
    let component: LeadershiptableComponent
    let mockMdoInfoService: MdoInfoService
    let mockConfigService: ConfigurationsService
    let mockProfileUtilService: ProfileV2UtillService
    let mockSnackBar: MatSnackBar
    let mockDialog: MatDialog
    let mockRouter: Router

    beforeEach(() => {
        mockMdoInfoService = {
            getAllUsers: jest.fn(),
            getTeamUsers: jest.fn(),
            assignTeamRole: jest.fn(),
        } as unknown as MdoInfoService
        mockConfigService = { userProfile: { rootOrgId: '123' } } as unknown as ConfigurationsService
        mockProfileUtilService = {} as unknown as ProfileV2UtillService
        mockSnackBar = { open: jest.fn() } as unknown as MatSnackBar
        mockDialog = { open: jest.fn() } as unknown as MatDialog
        mockRouter = new Router()

        component = new LeadershiptableComponent(
            mockDialog,
            new ActivatedRoute(),
            mockSnackBar,
            mockMdoInfoService,
            mockConfigService,
            mockRouter,
            mockProfileUtilService
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should call getAllUsers when ngOnInit is called', () => {
        const getAllUsersSpy = jest.spyOn(component, 'getAllUsers')
        component.ngOnInit()
        expect(getAllUsersSpy).toHaveBeenCalledWith('123')
    })

    it('should handle data on ngOnChanges', () => {
        const mockData = [{ id: '1', fullname: 'John Doe' }]
        component.ngOnChanges({
            data: {
                currentValue: mockData,
                previousValue: undefined,
                firstChange: false,
                isFirstChange: function (): boolean {
                    throw new Error('Function not implemented.')
                }
            }
        })
        expect(component.dataSource.data).toEqual(mockData)
        expect(component.length).toBe(1)
    })

    it('should open dialog and add user', () => {
        //  const openDialogSpy = jest.spyOn(mockDialog, 'open').mockReturnValue({ afterClosed: () => of({ data: [{ id: '1' }] }) })
        const assignRoleSpy = jest.spyOn(component, 'assignRole')
        component.adduser()
        //expect(openDialogSpy).toHaveBeenCalled()
        expect(assignRoleSpy).toHaveBeenCalled()
    })

    it('should assign role when assignRole is called', () => {
        const mockUser = { id: '1', organisations: [{ roles: [] }] }
        const assignTeamRoleSpy = jest.spyOn(mockMdoInfoService, 'assignTeamRole').mockReturnValue(of({}))
        component.assignRole(mockUser)
        expect(assignTeamRoleSpy).toHaveBeenCalledWith({
            request: {
                organisationId: '123',
                userId: '1',
                roles: ['MDO_LEADER'],
            },
        })
        expect(mockSnackBar.open).toHaveBeenCalledWith('User is added successfully!', 'X', { duration: 5000 })
    })

    it('should apply filter to the data source', () => {
        const filterValue = 'John'
        component.applyFilter(filterValue)
        expect(component.dataSource.filter).toBe(filterValue.toLowerCase())
    })

    it('should update data when updateData is called', () => {
        const mockRowData = { id: '1' }
        const navigateSpy = jest.spyOn(mockRouter, 'navigate')
        component.updateData(mockRowData)
        expect(navigateSpy).toHaveBeenCalledWith([`/app/users/${mockRowData.id}/details`], {
            queryParams: { param: 'MDOinfo', path: 'Leadership' },
        })
    })

    it('should handle getUsers correctly', () => {
        const mockResponse = { result: { response: { content: [{ firstName: 'John', email: 'john@example.com' }] } } }
        jest.spyOn(mockMdoInfoService, 'getTeamUsers').mockReturnValue(of(mockResponse))
        component.getUsers('MDO_LEADER')
        expect(component.usersData1).toEqual(mockResponse.result.response.content)
        expect(component.data.length).toBe(1)
        expect(component.data[0].fullname).toBe('John')
    })
})
