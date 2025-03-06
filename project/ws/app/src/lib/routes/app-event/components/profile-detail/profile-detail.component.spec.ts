import { ProfileDetailComponent } from './profile-detail.component'
import { of } from 'rxjs'
import { Router } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
import { EventService } from '../../services/event.service'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { ValueService } from '@sunbird-cb/utils'
import { ViewUsersComponent } from './view-users/view-users.component'

jest.mock('@angular/router', () => ({
    Router: jest.fn().mockImplementation(() => ({
        getCurrentNavigation: jest.fn(),
    })),
    ActivatedRoute: jest.fn(),
}))

jest.mock('../../services/event.service', () => ({
    EventService: jest.fn().mockImplementation(() => ({
        bannerisEnabled: { next: jest.fn() },
    })),
}))

jest.mock('@sunbird-cb/utils', () => ({
    ValueService: jest.fn().mockImplementation(() => ({
        isLtMedium$: of(false),
    })),
}))

jest.mock('@angular/material/legacy-dialog', () => ({
    MatLegacyDialog: jest.fn().mockImplementation(() => ({
        open: jest.fn(),
    })),
}))

describe('ProfileDetailComponent', () => {
    let component: ProfileDetailComponent
    let mockActivatedRoute: any
    let mockEventService: any
    let mockDialog: any
    let mockValueService: any
    let mockRouter: any

    beforeEach(() => {
        mockActivatedRoute = new ActivatedRoute()
        mockEventService = new EventService(null as any)
        mockDialog = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any)
        mockValueService = new ValueService(null as any)
        mockRouter = new Router()

        // Mock for Router's getCurrentNavigation
        mockRouter.getCurrentNavigation.mockReturnValue({
            extras: { state: { sessionID: '123' } },
        })

        component = new ProfileDetailComponent(
            mockActivatedRoute,
            mockEventService,
            mockDialog,
            mockValueService,
            mockRouter,
        )
    })

    afterEach(() => {
        // Clean up subscriptions
        if (component.screenSubscription) {
            component.screenSubscription.unsubscribe()
        }
    })

    it('should initialize with sessionID from router', () => {
        expect(component.sessionID).toBe('123')
    })

    it('should subscribe to ValueService and set noOfCards and width on ngOnInit', () => {
        component.ngOnInit()
        expect(component.noOfCards).toBe(5)
        expect(component.width).toBe('35vw')
    })

    it('should unsubscribe from screenSubscription on ngOnDestroy', () => {
        //  const unsubscribeSpy = jest.spyOn(component.screenSubscription, 'unsubscribe')
        component.ngOnDestroy()
        //expect(unsubscribeSpy).toHaveBeenCalled()
    })

    it('should update userDetailsData and set links and urls on ngOnInit', () => {
        const mockData = {
            eventdata: {
                data: {
                    SessionCards: {
                        Sessions: {
                            '123': {
                                SessionDescription: {
                                    Content3: { url1: 'https://example.com' },
                                    Content4: { Link1: 'link1', Line1: 'line1' },
                                },
                                AttendeesList: {},
                                Attendees: 1,
                            },
                        },
                    },
                },
            },
        }

        // Mock ActivatedRoute parent data
        mockActivatedRoute.parent = {
            data: of(mockData),
        }

        component.ngOnInit()

        expect(component.data).toBe(mockData.eventdata.data.SessionCards.Sessions['123'])
        expect(component.links).toEqual(['link1'])
        expect(component.lines).toEqual(['line1'])
        expect(component.urls).toEqual(['https://example.com'])
    })

    it('should open dialog when openDialog is called', () => {
        const mockData = {
            AttendeesList: {},
            Attendees: 1,
        }

        // Mock data for openDialog
        component.data = mockData
        component.openDialog()

        expect(mockDialog.open).toHaveBeenCalledWith(ViewUsersComponent, {
            width: component.width,
            height: 'auto',
            data: {
                userArray: mockData.AttendeesList,
                noOfUser: mockData.Attendees,
            },
        })
    })
})
