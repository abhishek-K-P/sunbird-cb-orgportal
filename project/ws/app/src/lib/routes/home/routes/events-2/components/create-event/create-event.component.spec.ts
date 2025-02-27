import { CreateEventComponent } from './create-event.component'
import { EventsService } from '../../services/events.service'
import { Router } from '@angular/router'
import { FormBuilder } from '@angular/forms'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { DatePipe } from '@angular/common'
import { LoaderService } from '../../../../../../../../../../../src/app/services/loader.service'
import { MatLegacyDialog } from '@angular/material/legacy-dialog'
import { ChangeDetectorRef } from '@angular/core'
import { StepperSelectionEvent } from '@angular/cdk/stepper'
import { of, throwError } from 'rxjs'
import * as _ from 'lodash'

describe('CreateEventComponent', () => {
  let component: CreateEventComponent
  let mockEventsService: jest.Mocked<EventsService>
  let mockActivatedRoute: any
  let mockFormBuilder: FormBuilder
  let mockRouter: jest.Mocked<Router>
  let mockSnackBar: jest.Mocked<MatSnackBar>
  let mockDatePipe: jest.Mocked<DatePipe>
  let mockLoaderService: jest.Mocked<LoaderService>
  let mockCdr: jest.Mocked<ChangeDetectorRef>
  let mockDialog: jest.Mocked<MatLegacyDialog>

  beforeEach(() => {
    // Create mocks
    mockEventsService = {
      updateEvent: jest.fn()
    } as unknown as jest.Mocked<EventsService>

    mockRouter = {
      navigate: jest.fn()
    } as unknown as jest.Mocked<Router>

    mockSnackBar = {
      open: jest.fn()
    } as unknown as jest.Mocked<MatSnackBar>

    mockDatePipe = {
      transform: jest.fn().mockImplementation((date, format) => {
        if (format === 'yyyy-MM-dd') return '2025-02-27'
        if (format === 'dd MMM, yyyy') return '27 Feb, 2025'
        return date
      })
    } as unknown as jest.Mocked<DatePipe>

    mockLoaderService = {
      changeLoaderState: jest.fn()
    } as unknown as jest.Mocked<LoaderService>

    mockCdr = {
      detectChanges: jest.fn()
    } as unknown as jest.Mocked<ChangeDetectorRef>

    mockDialog = {
      open: jest.fn()
    } as unknown as jest.Mocked<MatLegacyDialog>

    mockFormBuilder = new FormBuilder()

    mockActivatedRoute = {
      snapshot: {
        data: {
          configService: {
            userProfile: { name: 'Test User' }
          },
          eventDetails: {
            data: {
              identifier: 'event123',
              name: 'Test Event',
              description: 'Test Event Description',
              resourceType: 'Webinar',
              startDate: '2025-02-27',
              startTime: '10:00:00+05:30',
              endTime: '11:00:00+05:30',
              registrationLink: 'https://example.com',
              appIcon: 'test-icon',
              typeofEvent: 'online',
              status: 'Draft',
              speakers: [{ name: 'Speaker 1', designation: 'Test Designation' }],
              eventHandouts: [{ title: 'Handout 1', content: 'Test content' }],
              competencies_v6: [{ id: 'comp1', name: 'Competency 1' }]
            }
          }
        }
      },
      queryParams: of({ mode: 'edit', pathUrl: 'test-path' })
    }

    // Create component
    component = new CreateEventComponent(
      mockEventsService,
      mockActivatedRoute,
      mockFormBuilder,
      mockRouter,
      mockSnackBar,
      mockDatePipe,
      mockLoaderService,
      mockCdr,
      mockDialog
    )
  })

  describe('ngOnInit', () => {
    it('should initialize form and get event details', () => {
      // Spy on methods
      jest.spyOn(component, 'initializeFormAndParams')
      jest.spyOn(component, 'getEventDetailsFromResolver')

      // Call ngOnInit
      component.ngOnInit()

      // Expect methods to be called
      expect(component.initializeFormAndParams).toHaveBeenCalled()
      expect(component.getEventDetailsFromResolver).toHaveBeenCalled()
    })
  })

  describe('initializeFormAndParams', () => {
    it('should initialize the event details form', () => {
      // Call method
      component.initializeFormAndParams()

      // Check if form is created
      expect(component.eventDetailsForm).toBeDefined()
      expect(component.eventDetailsForm.get('eventName')).toBeDefined()
      expect(component.eventDetailsForm.get('description')).toBeDefined()
      expect(component.eventDetailsForm.get('eventCategory')).toBeDefined()
      expect(component.eventDetailsForm.get('streamType')).toBeDefined()
      expect(component.eventDetailsForm.get('startDate')).toBeDefined()
      expect(component.eventDetailsForm.get('startTime')).toBeDefined()
      expect(component.eventDetailsForm.get('endTime')).toBeDefined()
      expect(component.eventDetailsForm.get('registrationLink')).toBeDefined()
      expect(component.eventDetailsForm.get('recoredEventUrl')).toBeDefined()
      expect(component.eventDetailsForm.get('appIcon')).toBeDefined()
      expect(component.eventDetailsForm.get('typeofEvent')).toBeDefined()
    })
  })

  describe('getEventDetailsFromResolver', () => {
    it('should get user profile and event details', () => {
      // Spy on method
      jest.spyOn(component, 'patchEventDetails')

      // Call method
      component.getEventDetailsFromResolver()

      // Check if user profile is set
      expect(component.userProfile).toEqual({ name: 'Test User' })

      // Check if event details are set and patchEventDetails is called
      expect(component.eventDetails).toBeDefined()
      expect(component.patchEventDetails).toHaveBeenCalled()

      // Check if mode and pathUrl are set
      expect(component.openMode).toBe('edit')
      expect(component.pathUrl).toBe('test-path')
    })

    it('should disable form when in view mode', () => {
      // Mock view mode
      mockActivatedRoute.queryParams = of({ mode: 'view', pathUrl: 'test-path' })

      // Spy on form disable
      jest.spyOn(component.eventDetailsForm, 'disable')

      // Call method
      component.getEventDetailsFromResolver()

      // Check if form is disabled
      expect(component.eventDetailsForm.disable).toHaveBeenCalled()
    })
  })

  describe('patchEventDetails', () => {
    it('should patch form with event details', () => {
      // Call method
      component.patchEventDetails()

      // Check if eventId is set
      expect(component.eventId).toBe('event123')

      // Check if form values are patched
      expect(component.eventDetailsForm.get('eventName')?.value).toBe('Test Event')
      expect(component.eventDetailsForm.get('description')?.value).toBe('Test Event Description')
      expect(component.eventDetailsForm.get('eventCategory')?.value).toBe('Webinar')
      expect(component.eventDetailsForm.get('registrationLink')?.value).toBe('https://example.com')

      // Check if arrays are populated
      expect(component.speakersList.length).toBe(1)
      expect(component.materialsList.length).toBe(1)
      expect(component.competencies.length).toBe(1)
    })

    it('should handle YouTube links correctly', () => {
      // Mock YouTube link
      component.eventDetails = {
        identifier: 'event123',
        registrationLink: 'https://youtube.com/watch?v=123',
        // other properties...
      }

      // Call method
      component.patchEventDetails()

      // Check if registration link is set correctly
      expect(component.eventDetailsForm.get('registrationLink')?.value).toBe('https://youtube.com/watch?v=123')
      expect(component.eventDetailsForm.get('recoredEventUrl')?.value).toBe('')
    })

    it('should handle non-YouTube links correctly', () => {
      // Mock non-YouTube link
      component.eventDetails = {
        identifier: 'event123',
        registrationLink: 'https://example.com/recording',
        // other properties...
      }

      // Call method
      component.patchEventDetails()

      // Check if recorded event URL is set correctly
      expect(component.eventDetailsForm.get('registrationLink')?.value).toBe('')
      expect(component.eventDetailsForm.get('recoredEventUrl')?.value).toBe('https://example.com/recording')
    })
  })

  describe('onSelectionChange', () => {
    it('should update current stepper index and selected label', () => {
      // Mock stepper
      component.stepper = {
        steps: {
          toArray: () => [{ label: 'Basic Details' }, { label: 'Preview' }]
        }
      } as any

      // Mock event
      const event = { selectedIndex: 1 } as StepperSelectionEvent

      // Call method
      component.onSelectionChange(event)

      // Check if values are updated
      expect(component.currentStepperIndex).toBe(1)
      expect(component.selectedStepperLable).toBe('Preview')
      expect(mockCdr.detectChanges).toHaveBeenCalled()
    })

    it('should update event details when Preview step is selected', () => {
      // Mock stepper
      component.stepper = {
        steps: {
          toArray: () => [{ label: 'Basic Details' }, { label: 'Preview' }]
        }
      } as any

      // Mock event
      const event = { selectedIndex: 1 } as StepperSelectionEvent

      // Set event details
      component.eventDetails = { status: 'Draft' }

      // Spy on method
      jest.spyOn(component, 'getFormBodyOfEvent').mockReturnValue({ name: 'Updated Event' })

      // Call method
      component.onSelectionChange(event)

      // Check if updated event details is set
      expect(component.updatedEventDetails).toEqual({ name: 'Updated Event' })
    })
  })

  describe('navigateBack', () => {
    it('should navigate to the events page', () => {
      // Set path URL
      component.pathUrl = 'test-path'

      // Call method
      component.navigateBack()

      // Check if router navigate is called
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/events/test-path'])
    })
  })

  describe('openConforamtionPopup', () => {
    it('should show confirmation dialog in edit mode', () => {
      // Set mode to edit
      component.openMode = 'edit'

      // Mock dialog open
      mockDialog.open.mockReturnValue({
        afterClosed: () => of(true)
      } as any)

      // Spy on navigateBack
      jest.spyOn(component, 'navigateBack')

      // Call method
      component.openConforamtionPopup()

      // Check if dialog is opened
      expect(mockDialog.open).toHaveBeenCalled()
      expect(component.navigateBack).toHaveBeenCalled()
    })

    it('should not navigate back if user cancels dialog', () => {
      // Set mode to edit
      component.openMode = 'edit'

      // Mock dialog open
      mockDialog.open.mockReturnValue({
        afterClosed: () => of(false)
      } as any)

      // Spy on navigateBack
      jest.spyOn(component, 'navigateBack')

      // Call method
      component.openConforamtionPopup()

      // Check if dialog is opened but navigateBack not called
      expect(mockDialog.open).toHaveBeenCalled()
      expect(component.navigateBack).not.toHaveBeenCalled()
    })

    it('should navigate back directly in view mode', () => {
      // Set mode to view
      component.openMode = 'view'

      // Spy on navigateBack
      jest.spyOn(component, 'navigateBack')

      // Call method
      component.openConforamtionPopup()

      // Check if navigateBack is called without dialog
      expect(mockDialog.open).not.toHaveBeenCalled()
      expect(component.navigateBack).toHaveBeenCalled()
    })
  })

  describe('moveToNextForm', () => {
    it('should increment current stepper index when form is valid', () => {
      // Set current index
      component.currentStepperIndex = 0

      // Mock canMoveToNext getter
      Object.defineProperty(component, 'canMoveToNext', {
        get: jest.fn(() => true)
      })

      // Call method
      component.moveToNextForm()

      // Check if index is incremented
      expect(component.currentStepperIndex).toBe(1)
    })

    it('should increment current stepper index in view mode regardless of validation', () => {
      // Set current index and mode
      component.currentStepperIndex = 0
      component.openMode = 'view'

      // Call method
      component.moveToNextForm()

      // Check if index is incremented
      expect(component.currentStepperIndex).toBe(1)
    })
  })

  describe('preview', () => {
    it('should show preview and update event details', () => {
      // Set event details
      component.eventDetails = { status: 'Draft' }

      // Mock stepper
      component.stepper = {
        steps: {
          toArray: () => [
            { label: 'Basic Details' },
            { label: 'Preview' }
          ]
        }
      } as any

      // Spy on getFormBodyOfEvent
      jest.spyOn(component, 'getFormBodyOfEvent').mockReturnValue({ name: 'Preview Event' })

      // Call method
      component.preview()

      // Check if preview is shown and event details updated
      expect(component.showPreview).toBe(true)
      expect(component.updatedEventDetails).toEqual({ name: 'Preview Event' })

      // Wait for setTimeout
      jest.runAllTimers()

      // Check if stepper index is updated
      expect(component.currentStepperIndex).toBe(1)
    })
  })

  describe('publish', () => {
    it('should call saveAndExit with SentToPublish status when canPublish is true', () => {
      // Mock canPublish getter
      Object.defineProperty(component, 'canPublish', {
        get: jest.fn(() => true)
      })

      // Spy on saveAndExit
      jest.spyOn(component, 'saveAndExit')

      // Call method
      component.publish()

      // Check if saveAndExit is called with correct status
      expect(component.saveAndExit).toHaveBeenCalledWith('SentToPublish')
    })

    it('should not call saveAndExit when canPublish is false', () => {
      // Mock canPublish getter
      Object.defineProperty(component, 'canPublish', {
        get: jest.fn(() => false)
      })

      // Spy on saveAndExit
      jest.spyOn(component, 'saveAndExit')

      // Call method
      component.publish()

      // Check if saveAndExit is not called
      expect(component.saveAndExit).not.toHaveBeenCalled()
    })
  })

  describe('canMoveToNext', () => {
    it('should return true when Basic Details form is valid', () => {
      // Set selected label
      component.selectedStepperLable = 'Basic Details'

      // Mock form valid state
      jest.spyOn(component.eventDetailsForm, 'valid', 'get').mockReturnValue(true)

      // Check result
      expect(component.canMoveToNext).toBe(true)
    })

    it('should return false when Basic Details form is invalid', () => {
      // Set selected label
      component.selectedStepperLable = 'Basic Details'

      // Mock form valid state
      jest.spyOn(component.eventDetailsForm, 'valid', 'get').mockReturnValue(false)

      // Spy on openSnackBar
      jest.spyOn(component as any, 'openSnackBar')

      // Check result
      expect(component.canMoveToNext).toBe(false)
      expect(component['openSnackBar']).toHaveBeenCalledWith('Please fill mandatory fields')
    })

    it('should return true when Add Speaker has at least one speaker', () => {
      // Set selected label
      component.selectedStepperLable = 'Add Speaker'

      // Set speakers list
      component.speakersList = []

      // Check result
      expect(component.canMoveToNext).toBe(true)
    })

    it('should return false when Add Speaker has no speakers', () => {
      // Set selected label
      component.selectedStepperLable = 'Add Speaker'

      // Set empty speakers list
      component.speakersList = []

      // Spy on openSnackBar
      jest.spyOn(component as any, 'openSnackBar')

      // Check result
      expect(component.canMoveToNext).toBe(false)
      expect(component['openSnackBar']).toHaveBeenCalledWith('Please add atleast one speaker')
    })
  })

  describe('isMaterialsValid', () => {
    it('should return true when all materials have title and content', () => {
      // Set materials list
      component.materialsList = [
        { title: 'Material 1', content: 'Content 1' },
        { title: 'Material 2', content: 'Content 2' }
      ]

      // Check result
      expect(component.isMaterialsValid).toBe(true)
    })

    it('should return false when any material is missing title', () => {
      // Set materials list with invalid item
      component.materialsList = [
        { title: 'Material 1', content: 'Content 1' },
        { title: '', content: 'Content 2' }
      ]

      // Check result
      expect(component.isMaterialsValid).toBe(false)
    })

    it('should return false when any material is missing content', () => {
      // Set materials list with invalid item
      component.materialsList = [
        { title: 'Material 1', content: 'Content 1' },
        { title: 'Material 2', content: '' }
      ]

      // Check result
      expect(component.isMaterialsValid).toBe(false)
    })
  })

  describe('canPublish', () => {
    it('should return true when all required fields are valid in Preview step', () => {
      // Set selected label
      component.selectedStepperLable = 'Preview'

      // Set valid states
      jest.spyOn(component.eventDetailsForm, 'invalid', 'get').mockReturnValue(false)
      jest.spyOn(component, 'isMaterialsValid', 'get').mockReturnValue(true)
      component.competencies = [{ id: 'comp1', name: 'Competency 1' }]

      // Check result
      expect(component.canPublish).toBe(true)
    })

    it('should return false when form is invalid in Preview step', () => {
      // Set selected label
      component.selectedStepperLable = 'Preview'

      // Set invalid form
      jest.spyOn(component.eventDetailsForm, 'invalid', 'get').mockReturnValue(true)

      // Spy on openSnackBar
      jest.spyOn(component as any, 'openSnackBar')

      // Check result
      expect(component.canPublish).toBe(false)
      expect(component['openSnackBar']).toHaveBeenCalledWith('Please fill mandatory fields in Basic Details')
    })
  })

  describe('addCompetencies', () => {
    it('should update competencies array', () => {
      // Call method
      component.addCompetencies([{ id: 'new-comp', name: 'New Competency' }])

      // Check if competencies are updated
      expect(component.competencies).toEqual([{ id: 'new-comp', name: 'New Competency' }])
    })
  })

  describe('saveAndExit', () => {
    it('should call updateEvent service and show success message for Draft status', () => {
      // Setup
      component.eventId = 'event123'
      jest.spyOn(component, 'getFormBodyOfEvent').mockReturnValue({ name: 'Updated Event' })
      mockEventsService.updateEvent.mockReturnValue(of({ success: true }))

      // Mock setTimeout
      jest.useFakeTimers()

      // Call method
      component.saveAndExit()

      // Check if service is called
      expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(true)
      expect(mockEventsService.updateEvent).toHaveBeenCalledWith(
        { request: { event: { name: 'Updated Event' } } },
        'event123'
      )
      expect(mockSnackBar.open).toHaveBeenCalledWith('Event details saved successfully')

      // Run timer
      jest.runAllTimers()

      // Check navigation and loader state
      expect(mockRouter.navigate).toHaveBeenCalled()
      expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
    })

    it('should show success message for SentToPublish status', () => {
      // Setup
      component.eventId = 'event123'
      jest.spyOn(component, 'getFormBodyOfEvent').mockReturnValue({ name: 'Updated Event' })
      mockEventsService.updateEvent.mockReturnValue(of({ success: true }))

      // Call method
      component.saveAndExit('SentToPublish')

      // Check success message
      expect(mockSnackBar.open).toHaveBeenCalledWith('Event details sent for approval successfully')
    })

    it('should handle error from service', () => {
      // Setup
      component.eventId = 'event123'
      jest.spyOn(component, 'getFormBodyOfEvent').mockReturnValue({ name: 'Updated Event' })
      mockEventsService.updateEvent.mockReturnValue(throwError(() => ({
        error: { message: 'Service error' }
      })))

      // Call method
      component.saveAndExit()

      // Check error handling
      expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
      expect(mockSnackBar.open).toHaveBeenCalledWith('Service error')
    })
  })

  describe('Time formatting methods', () => {
    it('getFormatedTime should format time string correctly', () => {
      // Test AM time
      expect(component.getFormatedTime('09:30 AM')).toBe('09:30:00+05:30')

      // Test PM time
      expect(component.getFormatedTime('02:45 PM')).toBe('14:45:00+05:30')

      // Test 12 AM (midnight)
      expect(component.getFormatedTime('12:00 AM')).toBe('00:00:00+05:30')

      // Test 12 PM (noon)
      expect(component.getFormatedTime('12:00 PM')).toBe('12:00:00+05:30')
    })

    it('formatTime should pad hours and minutes correctly', () => {
      expect(component['formatTime'](9, 5)).toBe('09:05:00')
      expect(component['formatTime'](14, 30)).toBe('14:30:00')
    })

    it('getTimeDifferenceInMinutes should calculate duration correctly', () => {
      // 1 hour difference
      expect(component.getTimeDifferenceInMinutes('09:00:00+05:30', '10:00:00+05:30')).toBe(60)

      // 1 hour 30 minutes difference
      expect(component.getTimeDifferenceInMinutes('09:00:00+05:30', '10:30:00+05:30')).toBe(90)
    })

    it('combineDateAndTime should join date and time correctly', () => {
      const result = component.combineDateAndTime('2025-02-27', '09:00:00+05:30')
      expect(result).toMatch(/2025-02-27T09:00:00\+0000/)
    })
  })
})