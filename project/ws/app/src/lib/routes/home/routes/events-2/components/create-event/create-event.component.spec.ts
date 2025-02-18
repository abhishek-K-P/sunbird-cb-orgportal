import { CreateEventComponent } from './create-event.component'
import { FormBuilder } from '@angular/forms'
import { EventsService } from '../../services/events.service'
import { ActivatedRoute, Router, ActivatedRouteSnapshot, ParamMap, Params, Data } from '@angular/router'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { DatePipe } from '@angular/common'
import { of, throwError } from 'rxjs'

jest.mock('@angular/router', () => ({
  ...jest.requireActual('@angular/router'),
  ActivatedRoute: jest.fn(),
  Router: jest.fn()
}))

describe('CreateEventComponent', () => {
  let component: CreateEventComponent
  let mockEventsService: jest.Mocked<EventsService>
  let mockRouter: jest.Mocked<Router>
  let mockActivatedRoute: Partial<ActivatedRoute>
  let mockSnackBar: jest.Mocked<MatSnackBar>
  let mockDatePipe: jest.Mocked<DatePipe>

  beforeEach(() => {
    const mockParamMap: ParamMap = {
      has: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      keys: []
    }

    const mockSnapshot = {
      paramMap: mockParamMap,
      queryParamMap: mockParamMap,
      data: {
        configService: {
          userProfile: { name: 'Test User' }
        },
        eventDetails: {
          data: {
            identifier: '123',
            name: 'Test Event',
            description: 'Test Description',
            status: 'Draft'
          }
        }
      } as Data,
      params: {} as Params,
      queryParams: {} as Params,
      url: [],
      pathFromRoot: []
    } as unknown as ActivatedRouteSnapshot

    mockEventsService = {
      updateEvent: jest.fn()
    } as any

    mockRouter = {
      navigate: jest.fn()
    } as any

    mockActivatedRoute = {
      snapshot: mockSnapshot,
      queryParams: of({ mode: 'edit', pathUrl: 'test-path' })
    } as any

    mockSnackBar = {
      open: jest.fn()
    } as any

    mockDatePipe = {
      transform: jest.fn((date: any) => {
        if (date instanceof Date) {
          return '2025-02-17'
        }
        return date
      })
    } as any

    component = new CreateEventComponent(
      mockEventsService,
      mockActivatedRoute as ActivatedRoute,
      new FormBuilder(),
      mockRouter,
      mockSnackBar,
      mockDatePipe
    )
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize form and get event details', () => {
      component.ngOnInit()
      expect(component.eventDetailsForm).toBeDefined()
      expect(component.eventId).toBe('123')
    })

    it('should disable form in view mode', () => {
      mockActivatedRoute.queryParams = of({ mode: 'view', pathUrl: 'test-path' })
      component.ngOnInit()
      expect(component.eventDetailsForm.disabled).toBeTruthy()
    })
  })

  describe('navigateBack', () => {
    it('should navigate to correct path', () => {
      component.pathUrl = 'test-path'
      component.navigateBack()
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/events/test-path'])
    })
  })

  describe('moveToNextForm', () => {
    beforeEach(() => {
      component.ngOnInit()
    })

    it('should not move to next step if form is invalid', () => {
      component.currentStepperIndex = 0
      component.moveToNextForm()
      expect(component.currentStepperIndex).toBe(0)
      expect(mockSnackBar.open).toHaveBeenCalledWith('Please fill mandatory fields')
    })

    it('should move to next step if in view mode', () => {
      component.openMode = 'view'
      component.currentStepperIndex = 0
      component.moveToNextForm()
      expect(component.currentStepperIndex).toBe(1)
    })
  })

  describe('saveAndExit', () => {
    beforeEach(() => {
      component.ngOnInit()
      component.eventId = '123'
      mockDatePipe.transform.mockReturnValue('2025-02-17')
    })

    it('should save event successfully', () => {
      mockEventsService.updateEvent.mockReturnValue(of({ success: true }))
      component.saveAndExit()
      expect(mockSnackBar.open).toHaveBeenCalledWith('Event details saved successfully')
      expect(mockRouter.navigate).toHaveBeenCalled()
    })

    it('should handle error when saving event', () => {
      const error = {
        error: {
          message: 'Something went wrong while updating event, please try again'
        }
      }
      mockEventsService.updateEvent.mockReturnValue(throwError(() => error))
      component.saveAndExit()
      expect(mockSnackBar.open).toHaveBeenCalledWith('Something went wrong while updating event, please try again')
    })
  })

  describe('getFormatedTime', () => {
    it('should format AM time correctly', () => {
      const result = component.getFormatedTime('10:30 AM')
      expect(result).toBe('10:30:00+05:30')
    })

    it('should format PM time correctly', () => {
      const result = component.getFormatedTime('02:30 PM')
      expect(result).toBe('14:30:00+05:30')
    })

    it('should handle 12 AM correctly', () => {
      const result = component.getFormatedTime('12:00 AM')
      expect(result).toBe('00:00:00+05:30')
    })

    it('should handle 12 PM correctly', () => {
      const result = component.getFormatedTime('12:00 PM')
      expect(result).toBe('12:00:00+05:30')
    })
  })

  describe('preview', () => {
    it('should set showPreview to true and update currentStepperIndex', (done) => {
      component.preview()
      expect(component.showPreview).toBeTruthy()

      setTimeout(() => {
        expect(component.currentStepperIndex).toBe(4)
        done()
      }, 100)
    })
  })

  describe('addCompetencies', () => {
    it('should update competencies array', () => {
      const testCompetencies = ['comp1', 'comp2']
      component.addCompetencies(testCompetencies)
      expect(component.competencies).toEqual(testCompetencies)
    })
  })
})