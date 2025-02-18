// Mock the environment before importing the component
jest.mock('../../../../../../../../../../../src/environments/environment', () => ({
  environment: {
    production: false,
    name: 'test',
    sitePath: 'test-path',
    karmYogiPath: 'test-path',
    cbpPath: 'test-path',
    domainName: 'http://test-domain.com'
  }
}))

import { FormGroup, FormControl } from '@angular/forms'
import { EventBasicDetailsComponent } from './event-basic-details.component'
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar'
import { EventsService } from '../../services/events.service'
import { of, throwError } from 'rxjs'
import { HttpErrorResponse } from '@angular/common/http'
import * as _ from 'lodash'

// Mock lodash
jest.mock('lodash', () => ({
  get: jest.fn()
}))

// Mock moment
jest.mock('moment', () => {
  const mockMoment: any = jest.fn(() => ({
    add: jest.fn(() => ({
      format: jest.fn(() => '09:30')
    }))
  }))
  mockMoment.utc = jest.fn(() => mockMoment())
  return mockMoment
})

describe('EventBasicDetailsComponent', () => {
  let component: EventBasicDetailsComponent
  let mockMatSnackBar: jest.Mocked<MatLegacySnackBar>
  let mockEventsService: jest.Mocked<EventsService>

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    mockMatSnackBar = {
      open: jest.fn(),
    } as any

    mockEventsService = {
      createContent: jest.fn(),
      uploadContent: jest.fn(),
    } as any

    // Mock FormGroup
    const formGroup = new FormGroup({
      startTime: new FormControl(''),
      endTime: new FormControl(''),
      resourceUrl: new FormControl(''),
      uploadUrl: new FormControl(''),
      resourceUploadType: new FormControl(''),
      appIcon: new FormControl(''),
    })

    component = new EventBasicDetailsComponent(
      mockMatSnackBar,
      mockEventsService
    )

    component.eventDetails = formGroup
    component.userProfile = {
      rootOrgId: 'test-org',
      departmentName: 'test-dept',
      userName: 'test-user',
      userId: 'test-id'
    }
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnChanges', () => {
    it('should handle time format conversion on changes', () => {
      const changes = {
        eventDetails: {
          currentValue: component.eventDetails,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      }

      // Set up the initial form values
      component.eventDetails.patchValue({
        startTime: '13:30+05:30',
        endTime: '14:30+05:30'
      });

      (_.get as jest.Mock).mockImplementation((obj, path) => {
        if (obj) { }
        if (path === 'value.startTime') return '13:30+05:30'
        if (path === 'value.endTime') return '14:30+05:30'
        return undefined
      })

      component.ngOnChanges(changes)

      expect(component.eventDetails.get('startTime')?.value).toBe('1:30 PM')
      expect(component.eventDetails.get('endTime')?.value).toBe('2:30 PM')
    })
  })

  describe('appIconName', () => {
    it('should return the correct icon name from URL', () => {
      (_.get as jest.Mock).mockImplementation((obj, path) => {
        if (obj) { }
        if (path === 'value.appIcon') return 'path/to/icon_testicon.jpg'
        return undefined
      })

      component.eventDetails.patchValue({
        appIcon: 'path/to/icon_testicon.jpg'
      })

      expect(component.appIconName).toBe('testicon.jpg')
    })

    it('should return empty string for no icon', () => {
      (_.get as jest.Mock).mockReturnValue('')
      expect(component.appIconName).toBe('')
    })
  })

  describe('uploadedVideoName', () => {
    it('should return the correct video name from URL', () => {
      (_.get as jest.Mock).mockImplementation((obj, path) => {
        if (obj) { }
        if (path === 'value.uploadUrl') return 'path/to/video_testvideo.mp4'
        return undefined
      })

      component.eventDetails.patchValue({
        uploadUrl: 'path/to/video_testvideo.mp4'
      })

      expect(component.uploadedVideoName).toBe('testvideo.mp4')
    })
  })

  describe('saveImage', () => {
    const mockFile = new File([''], 'test.mp4', { type: 'video/mp4' })

    it('should handle successful upload', () => {
      const mockResponse = {
        result: {
          identifier: 'test-id',
          artifactUrl: 'https://storage.googleapis.com/igot/test/video.mp4'
        }
      };

      (_.get as jest.Mock).mockImplementation((obj, path) => {
        if (obj) { }
        switch (path) {
          case 'result.identifier':
            return 'test-id'
          case 'result.artifactUrl':
            return 'https://storage.googleapis.com/igot/test/video.mp4'
          case 'userProfile.rootOrgId':
            return 'test-org'
          case 'userProfile.departmentName':
            return 'test-dept'
          case 'userProfile.userName':
            return 'test-user'
          case 'userProfile.userId':
            return 'test-id'
          default:
            return undefined
        }
      })

      mockEventsService.createContent.mockReturnValue(of(mockResponse))
      mockEventsService.uploadContent.mockReturnValue(of(mockResponse))

      component.saveImage(mockFile, 'video')

      expect(mockEventsService.createContent).toHaveBeenCalled()
      // Force the observable to complete
      mockEventsService.createContent.mock.calls[0][0].subscribe(() => {
        expect(mockEventsService.uploadContent).toHaveBeenCalled()
      })
    })

    it('should handle upload error', () => {
      const errorResponse = new HttpErrorResponse({
        error: { message: 'Upload failed' },
        status: 400
      });

      (_.get as jest.Mock).mockImplementation((path) => {
        if (path === 'error.message') return 'Upload failed'
        return undefined
      })

      mockEventsService.createContent.mockReturnValue(throwError(() => errorResponse))

      component.saveImage(mockFile)

      // Force the observable to error
      mockEventsService.createContent.mock.calls[0][0].subscribe({
        error: () => {
          expect(mockMatSnackBar.open).toHaveBeenCalledWith('Upload failed')
        }
      })
    })
  })
})