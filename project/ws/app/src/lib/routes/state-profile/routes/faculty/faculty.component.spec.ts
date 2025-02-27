import { FacultyComponent } from './faculty.component'
import { UntypedFormGroup } from '@angular/forms'
import { Subject, of } from 'rxjs'
import { OrgProfileService } from '../../services/org-profile.service'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { DialogBoxComponent } from '../../components/dialog-box/dialog-box.component'

// Mock services
jest.mock('../../services/org-profile.service')
jest.mock('@sunbird-cb/utils')

describe('FacultyComponent', () => {
    let component: FacultyComponent
    let orgSvcMock: jest.Mocked<OrgProfileService>
    let configSvcMock: jest.Mocked<ConfigurationsService>
    let dialogMock: jest.Mocked<MatDialog>

    beforeEach(() => {
        // Create mocks for dependencies
        orgSvcMock = {
            updateLocalFormValue: jest.fn(),
            updateFormStatus: jest.fn(),
        } as unknown as jest.Mocked<OrgProfileService>

        configSvcMock = {
            unMappedUser: {
                orgProfile: {
                    profileDetails: {
                        faculty: {
                            regularFacultyCount: 10,
                            adhocFacultyCount: 5,
                            guestFacultyCount: 3,
                            otherCount: 2,
                        },
                    },
                },
            },
        } as unknown as jest.Mocked<ConfigurationsService>

        dialogMock = {
            open: jest.fn().mockReturnValue({
                afterClosed: jest.fn().mockReturnValue(of({})),
            }),
        } as unknown as jest.Mocked<MatDialog>

        // Create the component with mocked dependencies
        component = new FacultyComponent(orgSvcMock, configSvcMock, dialogMock)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize the form with the correct controls', () => {
        expect(component.facultyForm).toBeInstanceOf(UntypedFormGroup)
        expect(component.facultyForm.get('regularFacultyCount')).toBeTruthy()
        expect(component.facultyForm.get('adhocFacultyCount')).toBeTruthy()
        expect(component.facultyForm.get('guestFacultyCount')).toBeTruthy()
        expect(component.facultyForm.get('otherCount')).toBeTruthy()
    })

    it('should populate form with values from configSvc if available', () => {
        expect(component.facultyForm.value).toEqual({
            regularFacultyCount: 10,
            adhocFacultyCount: 5,
            guestFacultyCount: 3,
            otherCount: 2,
        })

        expect(orgSvcMock.updateLocalFormValue).toHaveBeenCalledWith('faculty', {
            regularFacultyCount: 10,
            adhocFacultyCount: 5,
            guestFacultyCount: 3,
            otherCount: 2,
        })

        expect(orgSvcMock.updateFormStatus).toHaveBeenCalledWith('faculty', expect.any(Boolean))
    })

    it('should update local form value and status when form values change', async () => {
        // Reset the mock call counts
        jest.clearAllMocks()

        // Manually trigger form value changes
        component.facultyForm.setValue({
            regularFacultyCount: 15,
            adhocFacultyCount: 7,
            guestFacultyCount: 4,
            otherCount: 1,
        })

        // Use a small timeout to allow debounceTime in the component to process
        await new Promise(resolve => setTimeout(resolve, 600))

        expect(orgSvcMock.updateLocalFormValue).toHaveBeenCalledWith('faculty', {
            regularFacultyCount: 15,
            adhocFacultyCount: 7,
            guestFacultyCount: 4,
            otherCount: 1,
        })

        expect(orgSvcMock.updateFormStatus).toHaveBeenCalledWith('faculty', expect.any(Boolean))
    })

    it('should open dialog when openActivityDialog is called', () => {
        component.openActivityDialog()

        expect(dialogMock.open).toHaveBeenCalledWith(DialogBoxComponent, {
            data: {
                view: 'faculty',
            },
            hasBackdrop: false,
            width: '550px',
        })
    })

    it('should properly handle form validation', () => {
        // Test invalid form state
        component.facultyForm.patchValue({
            regularFacultyCount: '',
            adhocFacultyCount: '',
            guestFacultyCount: '',
            otherCount: '',
        })
        expect(component.facultyForm.valid).toBeFalsy()

        // Test valid form state
        component.facultyForm.patchValue({
            regularFacultyCount: 10,
            adhocFacultyCount: 5,
            guestFacultyCount: 3,
            otherCount: 2,
        })
        expect(component.facultyForm.valid).toBeTruthy()
    })

    it('should clean up subscriptions when component is destroyed', () => {
        // Create a spy on the Subject's next method
        const unsubscribeSpy = jest.spyOn(
            component['unsubscribe'] as Subject<void>,
            'next'
        )
        const completeSpy = jest.spyOn(
            component['unsubscribe'] as Subject<void>,
            'complete'
        )

        // Call the ngOnDestroy method
        if ('ngOnDestroy' in component) {
            (component as any).ngOnDestroy()
        }

        // Check that unsubscribe was called
        expect(unsubscribeSpy).toHaveBeenCalled()
        expect(completeSpy).toHaveBeenCalled()
    })
})