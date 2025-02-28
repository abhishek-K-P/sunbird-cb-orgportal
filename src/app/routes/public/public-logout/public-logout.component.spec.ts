import { PublicLogoutComponent } from './public-logout.component'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

// Mock the dependencies
jest.mock('@sunbird-cb/utils', () => ({
    ConfigurationsService: jest.fn().mockImplementation(() => ({
        pageNavBar: { background: 'blue' },
        instanceConfig: { mailIds: { contactUs: 'contact@domain.com' } }
    })),
    NsPage: {
        INavBackground: jest.fn(),
    }
}))

jest.mock('@angular/router', () => ({
    ActivatedRoute: jest.fn().mockImplementation(() => ({
        data: of({ pageData: { data: 'some data' } })
    }))
}))

describe('PublicLogoutComponent', () => {
    let component: PublicLogoutComponent
    let mockConfigSvc: ConfigurationsService
    let mockActivatedRoute: ActivatedRoute

    beforeEach(() => {
        // Create a new instance of the component
        mockConfigSvc = new ConfigurationsService()
        mockActivatedRoute = new ActivatedRoute()

        component = new PublicLogoutComponent(mockConfigSvc, mockActivatedRoute)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should set contactUsMail on ngOnInit', () => {
        component.ngOnInit()
        expect(component.contactUsMail).toBe('contact@domain.com')
    })

    it('should set contactPage from activated route data', () => {
        component.ngOnInit()
        expect(component.contactPage).toBe('some data')
    })

    it('should set pageNavbar to the value from configSvc', () => {
        component.ngOnInit()
        expect(component.pageNavbar).toEqual({ background: 'blue' })
    })

    it('should unsubscribe on ngOnDestroy', () => {
        const unsubscribeSpy = jest.spyOn(component['subscriptionContact']!, 'unsubscribe')
        component.ngOnInit() // Initialize the subscription
        component.ngOnDestroy() // Destroy the subscription
        expect(unsubscribeSpy).toHaveBeenCalled()
    })

    it('should redirect to login page on login()', () => {
        const originalLocation = global.window.location
        // delete global.window.location
        global.window.location = { href: '' } as Location

        component.login()
        expect(global.window.location.href).toBe(`${window.location.origin}/protected/v8/resource`)

        global.window.location = originalLocation // Restore original location
    })
})
