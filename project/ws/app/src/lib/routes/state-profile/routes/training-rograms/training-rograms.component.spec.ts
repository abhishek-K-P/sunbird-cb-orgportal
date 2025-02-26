import { TrainingRogramsComponent } from './training-rograms.component'
import { OrgProfileService } from '../../services/org-profile.service'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { UntypedFormGroup } from '@angular/forms'

// Mock the dependencies
jest.mock('../../services/org-profile.service')
jest.mock('@sunbird-cb/utils')
jest.mock('@angular/material/legacy-dialog')

describe('TrainingRogramsComponent', () => {
    let component: TrainingRogramsComponent
    let mockOrgProfileService: jest.Mocked<OrgProfileService>
    let mockConfigSvc: jest.Mocked<ConfigurationsService>
    let mockDialog: jest.Mocked<MatDialog>

    beforeEach(() => {
        mockOrgProfileService = new OrgProfileService(null as any) as jest.Mocked<OrgProfileService>
        mockConfigSvc = new ConfigurationsService() as jest.Mocked<ConfigurationsService>
        mockDialog = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any) as jest.Mocked<MatDialog>

        // Set up mock values
        mockConfigSvc.unMappedUser = {
            orgProfile: {
                profileDetails: {
                    trainingPrograms: {
                        subjectName: 'Math',
                        conductDigitalPrograms: 'Yes',
                        prepareDigitalContent: 'Yes',
                        videoCount: 3,
                        pptCount: 2,
                        otherMaterialCount: 4,
                        otherInfo: 'Test info',
                        selectedSubjects: ['Math', 'Science'],
                    }
                }
            }
        }

        component = new TrainingRogramsComponent(mockOrgProfileService, mockConfigSvc, mockDialog)

        // Manually trigger ngOnInit()
        component.ngOnInit()
    })

    it('should create the component and initialize the form correctly', () => {
        expect(component).toBeTruthy()

        // Ensure the form is initialized
        expect(component.trainingProgramForm).toBeDefined()
        expect(component.trainingProgramForm instanceof UntypedFormGroup).toBe(true)

        // Ensure controls are properly initialized
        expect(component.trainingProgramForm.controls['subjectName']).toBeDefined()
        expect(component.trainingProgramForm.controls['subjectName'].value).toBe('Math')

        expect(component.selectedSubjects).toEqual(['Math', 'Science'])
    })

    it('should update form value on value changes', () => {
        const spy = jest.spyOn(mockOrgProfileService, 'updateLocalFormValue')

        component.trainingProgramForm.setValue({
            subjectName: 'History',
            conductDigitalPrograms: 'Yes',
            prepareDigitalContent: 'Yes',
            videoCount: 3,
            pptCount: 2,
            otherMaterialCount: 4,
            otherInfo: 'Test',
        })

        // Trigger the form value change
        component.trainingProgramForm.updateValueAndValidity()

        expect(spy).toHaveBeenCalledWith('trainingPrograms', expect.objectContaining({ subjectName: 'History' }))
    })

    it('should remove validators from form when called removeValidators()', () => {
        component.removeValidators()
        Object.keys(component.trainingProgramForm.controls).forEach(key => {
            expect(component.trainingProgramForm.get(key)?.validator).toBeNull()
        })
    })

    it('should add a subject on addSubject()', () => {
        const event: any = {
            input: { value: 'Physics' },
            value: 'Physics',
        }
        component.addSubject(event)
        expect(component.selectedSubjects).toContain('Physics')
        expect(component.trainingProgramForm.controls['subjectName'].value).toBeNull()
    })

    it('should remove a subject on removeSubject()', () => {
        component.selectedSubjects = ['Math', 'Science']
        component.removeSubject('Math')
        expect(component.selectedSubjects).not.toContain('Math')
    })

    it('should open activity dialog on openActivityDialog()', () => {
        const dialogSpy = jest.spyOn(mockDialog, 'open')
        component.openActivityDialog()
        expect(dialogSpy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ width: '550px' }))
    })

    it('should return true for hasRequiredField() if the field is required', () => {
        const result = component.hasRequiredField('conductDigitalPrograms')
        expect(result).toBe(true)
    })

    it('should return false for hasRequiredField() if the field is not required', () => {
        const result = component.hasRequiredField('otherInfo')
        expect(result).toBe(false)
    })

    // Additional test for ngOnInit method logic if necessary
    it('should update form status when roles and functions have training checked', () => {
        mockOrgProfileService.formValues = { rolesAndFunctions: { training: true } }
        component.ngOnInit()
        expect(mockOrgProfileService.updateFormStatus).toHaveBeenCalledWith('trainingPrograms', true)
    })
});

