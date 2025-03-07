import { AppEventComponent } from './app-event.component'
import { ActivatedRoute } from '@angular/router'
import { EventService } from '../../services/event.service'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { of } from 'rxjs'

// Mock the necessary services
class MockActivatedRoute {
    data = of({ eventdata: { data: { RegistrationStatus: { RegisteredUser: 'true' } } } });
}

class MockEventService {
    bannerisEnabled = of(true); // Mock the bannerisEnabled observable
}

class MockConfigurationsService {
    pageNavBar = { title: 'Test Navbar' };
}

describe('AppEventComponent', () => {
    let component: AppEventComponent
    let activatedRoute: ActivatedRoute
    let eventService: EventService
    let configService: ConfigurationsService

    beforeEach(() => {
        // Create instances of the mocks
        activatedRoute = new MockActivatedRoute() as any
        eventService = new MockEventService() as any
        configService = new MockConfigurationsService() as any

        // Create an instance of the component
        component = new AppEventComponent(activatedRoute, eventService, configService)
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize correctly', () => {
        // Call ngOnInit manually
        component.ngOnInit()

        // Assert that the component data is correctly set
        expect(component.data).toEqual({ RegistrationStatus: { RegisteredUser: 'true' } })
        expect(component.isRegisteredUser).toBe(true)
        expect(component.error).toBe(false)
        expect(component.isEnabled).toBe(true)
        expect(component.pageNavbar).toEqual({ title: 'Test Navbar' })
    })

    it('should set error to true if no eventdata or error in eventdata', () => {
        // Modify the mock data to simulate an error case
        activatedRoute.data = of({ eventdata: { error: true } })

        // Call ngOnInit manually
        component.ngOnInit()

        // Assert that the error flag is set to true
        expect(component.error).toBe(true)
    })

    it('should set isEnabled correctly based on the EventService', () => {
        // Change the observable value for bannerisEnabled to false
        // eventService.bannerisEnabled = of(false)

        // Call ngOnInit manually
        component.ngOnInit()

        // Assert that isEnabled is false after the update
        expect(component.isEnabled).toBe(false)
    })
})
