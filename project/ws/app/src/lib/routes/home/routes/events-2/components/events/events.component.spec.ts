(window as any)['env'] = {
  name: 'test-environment',
  sitePath: '/test-site-path',
  karmYogiPath: '/test-karm-yogi-path',
  cbpPath: '/test-cbp-path'
}
import '@angular/compiler'

import { EventsComponent } from './events.component'
import { NavigationEnd } from '@angular/router'
import { BasicInfoComponent } from '../../dialogs/basic-info/basic-info.component'
import { Subject, of } from 'rxjs'

describe('EventsComponent', () => {
  let component: EventsComponent
  let routerEvents: Subject<any>
  let mockRouter: any
  let mockDialog: any
  let mockActivatedRoute: any
  let mockRoute: any

  beforeEach(() => {
    routerEvents = new Subject()

    mockRouter = {
      events: routerEvents.asObservable(),
      url: '/test/pending-approval',
    }

    mockDialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: () => of(null)
      })
    }

    mockActivatedRoute = {
      snapshot: {
        data: {
          configService: {
            userProfile: { name: 'Test User' },
            userProfileV2: { email: 'test@test.com' }
          }
        },
        url: [{ path: 'test-path' }]
      }
    }

    mockRoute = {
      navigate: jest.fn()
    }

    component = new EventsComponent(
      mockRouter,
      mockDialog,
      mockActivatedRoute,
      mockRoute
    )
  })

  test('should create component', () => {
    expect(component).toBeTruthy()
  })

  test('should initialize component', () => {
    const initSpy = jest.spyOn(component as any, 'initialization')
    component.ngOnInit()
    expect(initSpy).toHaveBeenCalled()
  })

  test('should update current route on navigation end', () => {
    component.ngOnInit()
    routerEvents.next(new NavigationEnd(1, '/test/new-route', '/test/new-route'))
    expect(component.currentRoute).toBe('pending-approval')
  })

  test('should set user profile and email from route data', () => {
    component.ngOnInit()
    expect(component.userProfile).toEqual({ name: 'Test User' })
    expect(component.userEmail).toBe('test@test.com')
  })

  test('should open basic info dialog', () => {
    component.openBasicInfoDialog()
    expect(mockDialog.open).toHaveBeenCalledWith(
      BasicInfoComponent,
      {
        panelClass: 'create-event-dialog',
        data: {
          userProfile: component.userProfile,
          userEmail: component.userEmail
        }
      }
    )
  })

  test('should navigate after dialog closes with identifier', () => {
    mockDialog.open.mockReturnValue({
      afterClosed: () => of('test-identifier')
    })

    component.openBasicInfoDialog()

    expect(mockRoute.navigate).toHaveBeenCalledWith(
      ['/app/home/events/edit-event', 'test-identifier'],
      {
        queryParams: {
          mode: 'edit',
          pathUrl: component.pathUrl
        }
      }
    )
  })

  test('should unsubscribe on destroy', () => {
    const unsubscribeSpy = jest.spyOn(component.routeSubscription, 'unsubscribe')
    component.ngOnDestroy()
    expect(unsubscribeSpy).toHaveBeenCalled()
  })
})