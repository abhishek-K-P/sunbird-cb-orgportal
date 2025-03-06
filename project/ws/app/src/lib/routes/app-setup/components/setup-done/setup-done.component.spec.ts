import { SetupDoneComponent } from './setup-done.component'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { Router, ActivatedRoute } from '@angular/router'
import { DomSanitizer } from '@angular/platform-browser'
import { Globals } from '../../globals'
import { AppTourDialogComponent } from '@sunbird-cb/collection'

jest.mock('@sunbird-cb/utils')
jest.mock('@angular/router')
jest.mock('@angular/platform-browser')
jest.mock('@angular/material/legacy-dialog')
jest.mock('../../globals')

describe('SetupDoneComponent', () => {
    let component: SetupDoneComponent
    let mockConfigSvc: ConfigurationsService
    let mockRoute: ActivatedRoute
    let mockDomSanitizer: DomSanitizer
    let mockMatDialog: MatDialog
    let mockRouter: Router
    let mockGlobals: Globals

    beforeEach(() => {
        // Mock the services
        mockConfigSvc = new ConfigurationsService() // You can pass mock data if necessary
        mockRoute = { data: { subscribe: jest.fn() } } as unknown as ActivatedRoute
        mockDomSanitizer = { bypassSecurityTrustResourceUrl: jest.fn() } as unknown as DomSanitizer
        mockMatDialog = { open: jest.fn() } as unknown as MatDialog
        mockRouter = { navigate: jest.fn() } as unknown as Router
        mockGlobals = { firstTimeSetupDone: false } as unknown as Globals

        // Create component instance with mocked services
        component = new SetupDoneComponent(
            mockConfigSvc,
            mockRoute,
            mockDomSanitizer,
            mockMatDialog,
            mockRouter,
            mockGlobals,
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should set badges from route data and sanitize appIcon if instanceConfig is available', () => {
            //const badgesData = { data: 'testBadge' }
            // mockRoute.data.subscribe.mockImplementationOnce(callback => callback({ badges: badgesData }))
            // mockConfigSvc.instanceConfig = { logos: { thumpsUp: 'testLogoUrl' } }

            component.ngOnInit()

            expect(component.badges).toEqual('testBadge')
            expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('testLogoUrl')
            expect(component.appIcon).toBeTruthy()
        })

        it('should not set appIcon if instanceConfig is not available', () => {
            mockConfigSvc.instanceConfig = null
            component.ngOnInit()

            expect(component.appIcon).toBeNull()
        })
    })

    describe('finishSetup', () => {
        it('should update globals and open a dialog, then navigate to home', () => {
            component.finishSetup()

            expect(mockGlobals.firstTimeSetupDone).toBe(true)
            expect(mockMatDialog.open).toHaveBeenCalledWith(AppTourDialogComponent, {
                width: '500px',
                minHeight: '350px',
                data: 'dialog',
                backdropClass: 'backdropBackground',
            })
            expect(mockRouter.navigate).toHaveBeenCalledWith(['page', 'home'])
        })
    })
})
