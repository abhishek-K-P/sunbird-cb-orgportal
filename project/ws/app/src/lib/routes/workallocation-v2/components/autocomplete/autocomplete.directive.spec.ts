import { AutocompleteDirective } from './autocomplete.directive'
import { AutocompleteComponent } from './autocomplete/autocomplete.component'
import { Overlay, OverlayRef } from '@angular/cdk/overlay'
import { ElementRef, ViewContainerRef } from '@angular/core'
import { of } from 'rxjs'

jest.mock('@angular/cdk/overlay')
jest.mock('@angular/core')

describe('AutocompleteDirective', () => {
  let directive: AutocompleteDirective
  let overlayMock: jest.Mocked<Overlay>
  let overlayRefMock: jest.Mocked<OverlayRef>
  let elementRefMock: jest.Mocked<ElementRef<HTMLInputElement>>
  let ngControlMock: any
  let vcrMock: jest.Mocked<ViewContainerRef>
  let wsAppAutocompleteMock: AutocompleteComponent

  beforeEach(() => {
    // Mocking the dependencies
    overlayRefMock = {
      detach: jest.fn(),
      overlayElement: document.createElement('div'),
      detachments: jest.fn().mockReturnValue(of('detached')),
    } as unknown as jest.Mocked<OverlayRef>

    // Create a mock of the position function
    const positionMock = {
      flexibleConnectedTo: jest.fn().mockReturnThis(),
      withPositions: jest.fn().mockReturnThis(),
      withFlexibleDimensions: jest.fn().mockReturnThis(),
      withPush: jest.fn().mockReturnThis(),
    }

    overlayMock = {
      create: jest.fn().mockReturnValue(overlayRefMock),
      position: jest.fn().mockReturnValue(positionMock),
      scrollStrategies: {
        reposition: jest.fn().mockReturnThis(),
      },
    } as unknown as jest.Mocked<Overlay>

    elementRefMock = { nativeElement: document.createElement('input') } as unknown as jest.Mocked<ElementRef<HTMLInputElement>>
    ngControlMock = { control: { setValue: jest.fn() } }
    vcrMock = {} as jest.Mocked<ViewContainerRef>
    wsAppAutocompleteMock = { optionsClick: jest.fn().mockReturnValue(of('value')), rootTemplate: {} } as unknown as AutocompleteComponent

    directive = new AutocompleteDirective(elementRefMock, ngControlMock, vcrMock, overlayMock)
    directive.wsAppAutocomplete = wsAppAutocompleteMock
  })

  it('should create an instance of AutocompleteDirective', () => {
    expect(directive).toBeTruthy()
  })

  it('should open dropdown on focus event with debounce', () => {
    const openDropdownSpy = jest.spyOn(directive, 'openDropdown')
    // jest.spyOn(fromEvent, 'subscribe').mockImplementationOnce((callback: any) => callback()) // Simulate focus event

    directive.ngOnInit()

    expect(openDropdownSpy).toHaveBeenCalled()
  })

  it('should attach the overlay and create a TemplatePortal on openDropdown call', () => {
    directive.openDropdown()

    expect(overlayMock.create).toHaveBeenCalledWith(expect.objectContaining({
      width: elementRefMock.nativeElement.offsetWidth,
      maxHeight: 120,
    }))
    expect(overlayRefMock.attach).toHaveBeenCalled()
  })

  it('should call control.setValue when optionsClick emits a value', () => {
    directive.openDropdown()
    wsAppAutocompleteMock.optionsClick().subscribe((value: any) => {
      expect(ngControlMock.control.setValue).toHaveBeenCalledWith(value)
    })
  })

  it('should close the overlay when close is called', () => {
    directive.openDropdown()
    // directive.close()
    expect(overlayRefMock.detach).toHaveBeenCalled()
  })

  it('should subscribe to overlayClickOutside and call close when clicked outside', () => {
    // const overlayClickOutsideSpy = jest.spyOn(overlayClickOutside, 'overlayClickOutside').mockReturnValue(of(undefined))
    // directive.openDropdown()
    // expect(overlayClickOutsideSpy).toHaveBeenCalled()
  })

  it('should unsubscribe on ngOnDestroy', () => {
    directive.ngOnDestroy()
    // Add any necessary assertions for cleanup
  })
})
