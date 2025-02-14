import { EventsListComponent } from './events-list.component'
import { HttpErrorResponse } from '@angular/common/http'
import { of, throwError } from 'rxjs'

// Mock interfaces and types
interface MockMatSnackBar {
  open: jest.Mock
}

interface MockEventsService {
  getEvents: jest.Mock
  updateEvent: jest.Mock
}

interface MockRouter {
  navigate: jest.Mock
}

interface MockDialog {
  open: jest.Mock
}

describe('EventsListComponent', () => {
  let component: any
  let mockMatSnackBar: MockMatSnackBar
  let mockEventsService: MockEventsService
  let mockRouter: MockRouter
  let mockDialog: MockDialog

  beforeEach(() => {
    // Initialize mocks
    mockMatSnackBar = {
      open: jest.fn()
    }

    mockEventsService = {
      getEvents: jest.fn(),
      updateEvent: jest.fn()
    }

    mockRouter = {
      navigate: jest.fn()
    }

    mockDialog = {
      open: jest.fn()
    }

    // Create component instance with mocked dependencies
    component = new EventsListComponent(
      mockEventsService as any,
      mockMatSnackBar as any,
      { snapshot: { url: [{ path: 'upcoming' }] } } as any,
      mockRouter as any,
      mockDialog as any
    )
  })

  describe('createEventRequest', () => {
    it('should create correct request object for upcoming events', () => {
      // Mock date for consistent testing
      const mockDate = new Date('2024-02-14')
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate)

      component.pathUrl = 'upcoming'
      const request = component['createEventRequest']()

      expect(request).toEqual({
        locale: ['en'],
        request: {
          query: '',
          limit: 20,
          offset: 0,
          filters: {
            status: ['Live'],
            contentType: 'Event',
            endDate: { '>=': '2024-02-14' }
          },
          sort_by: { lastUpdatedOn: 'desc' }
        }
      })
    })

    it('should throw error for invalid path URL', () => {
      component.pathUrl = 'invalid-path'
      expect(() => component['createEventRequest']()).toThrow('Invalid path URL: invalid-path')
    })
  })

  describe('contentEvents', () => {
    const mockEventRow = {
      identifier: 'test-id',
      versionKey: 'v1'
    }

    it('should handle view action correctly', () => {
      component.contentEvents({ action: 'view', rows: mockEventRow })
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/home/events/edit-event', 'test-id'],
        expect.any(Object)
      )
    })

    it('should handle cancel action correctly', () => {
      mockEventsService.updateEvent.mockReturnValue(of({ success: true }))
      component.contentEvents({ action: 'cancel', rows: mockEventRow })
      expect(mockEventsService.updateEvent).toHaveBeenCalledWith(
        {
          request: {
            event: {
              identifier: 'test-id',
              versionKey: 'v1',
              status: 'Cancelled'
            }
          }
        },
        'test-id'
      )
    })

    it('should handle remarks action for event with reject comment', () => {
      const eventWithRemarks = {
        ...mockEventRow,
        rejectComment: 'Test rejection reason'
      }

      component.contentEvents({ action: 'remarks', rows: eventWithRemarks })
      expect(mockDialog.open).toHaveBeenCalled()
    })

    it('should not call any handler for unknown action', () => {
      component.contentEvents({ action: 'unknown', rows: mockEventRow })
      expect(mockRouter.navigate).not.toHaveBeenCalled()
      expect(mockEventsService.updateEvent).not.toHaveBeenCalled()
      expect(mockDialog.open).not.toHaveBeenCalled()
    })
  })

  describe('handleError', () => {
    it('should show error message from response', () => {
      const error = new HttpErrorResponse({
        error: { message: 'Test error message' }
      })

      component['handleError'](error)
      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        'Test error message',
        'Close',
        expect.any(Object)
      )
    })

    it('should show default error message when no error message in response', () => {
      const error = new HttpErrorResponse({})

      component['handleError'](error)
      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        'Something went wrong',
        'Close',
        expect.any(Object)
      )
    })
  })

  describe('cancelEvent', () => {
    const mockEvent = {
      identifier: 'test-id',
      versionKey: 'v1'
    }

    it('should successfully cancel event and show success message', () => {
      mockEventsService.updateEvent.mockReturnValue(of({ success: true }))
      mockEventsService.getEvents.mockReturnValue(of([]))

      component.cancelEvent(mockEvent)

      expect(mockEventsService.updateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          request: {
            event: {
              identifier: 'test-id',
              versionKey: 'v1',
              status: 'Cancelled'
            }
          }
        }),
        'test-id'
      )
      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        'event is cancelled successfully',
        'Close',
        expect.any(Object)
      )
    })

    it('should handle error when cancelling event', () => {
      const error = new HttpErrorResponse({
        error: { message: 'Cancel failed' }
      })
      mockEventsService.updateEvent.mockReturnValue(throwError(() => error))

      component.cancelEvent(mockEvent)

      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        'Cancel failed',
        'Close',
        expect.any(Object)
      )
    })
  })

  describe('openRejectionPopup', () => {
    it('should open dialog when rejection comment exists', () => {
      const mockEvent = {
        identifier: 'test-id',
        versionKey: 'v1',
        rejectComment: 'Test rejection reason'
      }

      component.openRejectionPopup(mockEvent)
      expect(mockDialog.open).toHaveBeenCalled()
    })

    it('should not open dialog when no rejection comment', () => {
      const mockEvent = {
        identifier: 'test-id',
        versionKey: 'v1'
      }

      component.openRejectionPopup(mockEvent)
      expect(mockDialog.open).not.toHaveBeenCalled()
    })
  })
})