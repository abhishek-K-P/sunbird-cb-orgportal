import { SignupComponent } from './signup.component'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { SignupService } from './signup.service'
// import { of, throwError } from 'rxjs'

describe('SignupComponent', () => {
    let component: SignupComponent
    let mockSnackBar: MatSnackBar
    let mockSignupService: SignupService

    beforeEach(() => {
        // Mock the SnackBar
        mockSnackBar = {
            open: jest.fn(),
        } as unknown as MatSnackBar

        // Create a mock for the SignupService
        mockSignupService = {
            signup: jest.fn(), // Create a mock function for 'signup'
        } as unknown as SignupService

        // Instantiate the component with mocked dependencies
        component = new SignupComponent(mockSnackBar, mockSignupService)

        // Provide a mock form value for testing
        component.signupForm = {
            value: {
                fname: 'John',
                email: 'john@example.com',
                code: '12345',
            },
        } as any
    })

    it('should create the SignupComponent', () => {
        expect(component).toBeTruthy()
    })

    it('should call onSubmit and handle success', () => {
        // Mock the signup method to return a successful response
        // mockSignupService.signup.mockReturnValue(of({}));

        // Call the onSubmit method with the mock form
        component.onSubmit(component.signupForm)

        // Ensure the signup service was called
        expect(mockSignupService.signup).toHaveBeenCalledWith(component.signupForm.value)

        // Ensure that snackbar was triggered for success
        expect(mockSnackBar.open).toHaveBeenCalledWith(
            component.toastSuccess.nativeElement.value,
            'X',
            { duration: 5000 }
        )

        // Ensure the form was reset
        expect(component.signupForm.reset).toHaveBeenCalled()
    })

    it('should call onSubmit and handle error', () => {
        // Mock the signup method to return an error
        // mockSignupService.signup.mockReturnValue(throwError({ error: 'Error: Invalid data' }));

        // Call the onSubmit method with the mock form
        component.onSubmit(component.signupForm)

        // Ensure the signup service was called
        expect(mockSignupService.signup).toHaveBeenCalledWith(component.signupForm.value)

        // Ensure that snackbar was triggered with error message
        expect(mockSnackBar.open).toHaveBeenCalledWith(
            'Invalid data',
            'X',
            { duration: 5000 }
        )

        // Ensure uploadSaveData is set to false after error
        expect(component.uploadSaveData).toBe(false)
    })

    it('should unsubscribe in ngOnDestroy', () => {
        component.unseenCtrlSub = {
            closed: false,
            unsubscribe: jest.fn(),
        } as any

        // Call ngOnDestroy
        component.ngOnDestroy()

        // Ensure that the subscription is unsubscribed
        expect(component.unseenCtrlSub.unsubscribe).toHaveBeenCalled()
    })

    it('should not unsubscribe if unseenCtrlSub is already closed', () => {
        component.unseenCtrlSub = {
            closed: true,
            unsubscribe: jest.fn(),
        } as any

        // Call ngOnDestroy
        component.ngOnDestroy()

        // Ensure unsubscribe was not called
        expect(component.unseenCtrlSub.unsubscribe).not.toHaveBeenCalled()
    })
})
