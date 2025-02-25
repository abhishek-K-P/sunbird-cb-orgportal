import { AppNavBarComponent } from './app-nav-bar.component'
import { NavigationEnd } from '@angular/router'

describe('AppNavBarComponent', () => {
    let component: AppNavBarComponent
    let mockRouter: any
    let mockDomSanitizer: any
    let mockConfigService: any
    let mockTourService: any

    beforeEach(() => {
        mockRouter = {
            events: {
                subscribe: jest.fn(),
            },
            navigateByUrl: jest.fn(),
        }
        mockDomSanitizer = {
            bypassSecurityTrustResourceUrl: jest.fn().mockReturnValue('mockSafeUrl'),
        }
        mockConfigService = {
            instanceConfig: { logos: { app: 'app-logo', appBottomNav: 'bottom-nav-logo' }, primaryNavBar: {}, pageNavBar: {}, primaryNavBarConfig: {} },
            rootOrg: 'root-org',
            restrictedFeatures: new Set(),
            appsConfig: { features: {} },
            tourGuideNotifier: { subscribe: jest.fn() },
        }
        mockTourService = {
            startTour: jest.fn(),
            startPopupTour: jest.fn(),
            cancelPopupTour: jest.fn(),
            createPopupTour: jest.fn(),
            isTourComplete: { subscribe: jest.fn() },
        }

        component = new AppNavBarComponent(
            mockDomSanitizer,
            mockConfigService,
            mockTourService,
            mockRouter,
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should set app icon on ngOnInit', () => {
        component.ngOnInit()
        expect(component.appIcon).toBe('mockSafeUrl')
        expect(component.instanceVal).toBe('root-org')
        expect(component.appBottomIcon).toBe('mockSafeUrl')
    })

    it('should handle navigation events in ngOnInit', () => {
        mockRouter.events.subscribe.mock.calls[0][0](new NavigationEnd(0, '/app/my-dashboard-temp/temp', '/app/my-dashboard-temp/temp'))
        expect(component.showAppNavBar).toBe(true)
    })

    it('should hide navbar when navigating to logout page', () => {
        mockRouter.events.subscribe.mock.calls[0][0](new NavigationEnd(0, '/public/logout', '/public/logout'))
        expect(component.showAppNavBar).toBe(false)
    })

    it('should handle tour guide availability', () => {
        const canShow = true
        mockConfigService.tourGuideNotifier.subscribe.mock.calls[0][0](canShow)
        expect(component.isTourGuideAvailable).toBe(true)
        expect(component.popupTour).toBeDefined()
    })

    it('should start a tour', () => {
        component.startTour()
        expect(mockTourService.startTour).toHaveBeenCalled()
        expect(mockTourService.isTourComplete.subscribe).toHaveBeenCalled()
    })

    it('should cancel popup tour', () => {
        component.cancelTour()
        expect(mockTourService.cancelPopupTour).toHaveBeenCalled()
        expect(component.isTourGuideClosed).toBe(false)
    })

    it('should update btnAppsConfig when mode changes to bottom', () => {
        component.mode = 'bottom'
        component.ngOnChanges({
            mode: {
                currentValue: 'bottom',
                previousValue: 'top',
                firstChange: false,
                isFirstChange: jest.fn().mockReturnValue(false),
            },
        })
        expect(component.btnAppsConfig.widgetData.showTitle).toBe(true)
    })

    it('should update btnAppsConfig when mode changes to top', () => {
        component.mode = 'top'
        component.ngOnChanges({
            mode: {
                currentValue: 'top',
                previousValue: 'bottom',
                firstChange: false,
                isFirstChange: jest.fn().mockReturnValue(false),
            },
        })
        expect(component.btnAppsConfig.widgetData.showTitle).toBeUndefined()
    })

    it('should navigate to the dashboard', () => {
        component.showDashboard()
        expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('app/my-dashboard-temp/temp')
    })
})
