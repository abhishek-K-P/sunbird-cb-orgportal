import { AppButtonComponent } from './app-button.component'
import { EventEmitter } from '@angular/core'

describe('AppButtonComponent', () => {
    let component: AppButtonComponent

    beforeEach(() => {
        // Create a new instance of the component
        component = new AppButtonComponent()
        component.eonClick = new EventEmitter<any>() // Mock the EventEmitter
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should emit event when button is clicked and not disabled', () => {
        // Arrange
        const event = { name: 'click' }
        const emitSpy = jest.spyOn(component.eonClick, 'emit')

        // Act
        component.onClickbutton(event)

        // Assert
        expect(emitSpy).toHaveBeenCalledWith(event)
    })

    it('should NOT emit event when button is clicked and is disabled', () => {
        // Arrange
        component.disabled = true
        const event = { name: 'click' }
        const emitSpy = jest.spyOn(component.eonClick, 'emit')

        // Act
        component.onClickbutton(event)

        // Assert
        expect(emitSpy).not.toHaveBeenCalled()
    })

    it('should handle the label input correctly', () => {
        // Arrange
        component.label = 'Submit'

        // Act
        const label = component.label

        // Assert
        expect(label).toBe('Submit')
    })

    it('should handle the id input correctly', () => {
        // Arrange
        component.id = 'button-1'

        // Act
        const id = component.id

        // Assert
        expect(id).toBe('button-1')
    })

    it('should initialize with default values for optional inputs', () => {
        // Act
        expect(component.styles).toEqual({})
        expect(component.classes).toBe('')
    })
})
