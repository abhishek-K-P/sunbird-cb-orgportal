(window as any)['env'] = {
  name: 'test-environment',
  sitePath: '/test-site-path',
  karmYogiPath: '/test-karm-yogi-path',
  cbpPath: '/test-cbp-path'
}
import '@angular/compiler'
import { EventsPreviewComponent } from './events-preview.component'
import { SimpleChange } from '@angular/core'
import { environment } from '../../../../../../../../../../../src/environments/environment'

describe('EventsPreviewComponent', () => {
  let component: EventsPreviewComponent
  let mockEventsService: jest.Mocked<any>
  let mockDialog: jest.Mocked<any>

  beforeEach(() => {
    // Mock services
    mockEventsService = {
      convertToTreeView: jest.fn()
    }

    mockDialog = {
      open: jest.fn()
    }

    // Create component instance
    component = new EventsPreviewComponent(
      mockEventsService,
      mockDialog
    )

    // Initialize required properties
    component.rcElement = {
      nativeElement: {
        style: {
          position: ''
        }
      }
    } as any

    component.rcElem = {
      offSetTop: 100,
      BottomPos: 200
    }

    component.scrollLimit = 1000
    component.elementPosition = 500
  })

  describe('Initialization and Changes', () => {
    it('should create component', () => {
      expect(component).toBeTruthy()
    })

    it('should handle ngOnChanges with event data', () => {
      const mockEvent = {
        identifier: 'test-id',
        competencyV6: [{
          competencyAreaName: 'Area 1',
          competencyThemeName: 'Theme 1'
        }]
      }

      const changes = {
        event: new SimpleChange(null, mockEvent, true)
      }

      component.event = mockEvent
      component.ngOnChanges(changes)

      expect(component.eventId).toBe('test-id')
    })

    it('should load competencies when event has competency data', () => {
      const mockCompetencyData = [{
        competencyAreaName: 'Area 1',
        competencyThemeName: 'Theme 1'
      }]

      component.event = {
        [environment.compentencyVersionKey]: mockCompetencyData
      }
      component.compentencyKey = {
        vKey: environment.compentencyVersionKey,
        vCompetencyArea: 'competencyAreaName',
        vCompetencyTheme: 'competencyThemeName',
        vCompetencySubTheme: 'competencySubThemeName'
      }

      mockEventsService.convertToTreeView.mockReturnValue([{
        area: 'Area 1',
        themes: ['Theme 1']
      }])

      component.loadCompetencies()

      expect(mockEventsService.convertToTreeView).toHaveBeenCalledWith(mockCompetencyData)
      // Wait for setTimeout
      jest.advanceTimersByTime(100)
      expect(component.selectedCompetecy).toBeDefined()
    })
  })

  describe('Scroll Handling', () => {
    it('should handle window scroll for sticky header', () => {
      // Test scroll below element position
      window.pageYOffset = 600
      component.handleScroll()
      expect(component.sticky).toBe(true)

      // Test scroll above element position
      window.pageYOffset = 300
      component.handleScroll()
      expect(component.sticky).toBe(false)
    })

    it('should handle scroll for right container position', () => {
      // Test scroll beyond scroll limit
      window.scrollY = 1500
      component.handleScroll()
      expect(component.rcElement.nativeElement.style.position).toBe('sticky')

      // Test scroll within scroll limit
      window.scrollY = 500
      component.handleScroll()
      expect(component.rcElement.nativeElement.style.position).toBe('fixed')
    })
  })

  describe('Utility Functions', () => {
    it('should check valid JSON', () => {
      expect(component.checkValidJSON('{"key": "value"}')).toBe(true)
      expect(component.checkValidJSON('invalid json')).toBe(false)
    })

    it('should handle string capitalization', () => {
      expect(component.handleCapitalize('test string')).toBe('Test string')
      expect(component.handleCapitalize('test string', 'name')).toBe('Test String')
    })

    it('should format hours and minutes', () => {
      expect(component.getHoursAndMinites('14:30')).toBe('14:30')
      expect(component.getHoursAndMinites('')).toBe('')
    })
  })

  describe('Video Player', () => {
    it('should open YouTube player dialog', () => {
      const mockEvent = {
        identifier: 'test-id',
        videoUrl: 'https://youtube.com/test'
      }
      component.event = mockEvent
      component.viewPlayer()
      expect(mockDialog.open).toHaveBeenCalled()
      expect(mockDialog.open.mock.calls[0][1]).toEqual({
        width: '900px',
        disableClose: false,
        data: { event: mockEvent }
      })
    })
  })

  describe('Competency Selection', () => {
    it('should update selected competency', () => {
      const mockCompetencyArea = {
        area: 'Test Area',
        themes: ['Theme 1']
      }

      component.getSelectedCompetecyThemes(mockCompetencyArea)
      expect(component.selectedCompetecy).toEqual(mockCompetencyArea)
    })
  })
})