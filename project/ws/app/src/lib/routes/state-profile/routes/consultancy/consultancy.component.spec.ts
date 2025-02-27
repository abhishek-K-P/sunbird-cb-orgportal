import { ConsultancyComponent } from './consultancy.component'
import { OrgProfileService } from '../../services/org-profile.service'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { Router } from '@angular/router'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import _ from 'lodash'

// Mock dependencies
jest.mock('../../services/org-profile.service')
jest.mock('@sunbird-cb/utils')
jest.mock('@angular/router')
jest.mock('@angular/material/legacy-dialog')
jest.mock('@angular/material/legacy-snack-bar')
jest.mock('lodash')

describe('ConsultancyComponent', () => {
    let component: ConsultancyComponent
    let orgSvc: OrgProfileService
    let configSvc: ConfigurationsService
    let router: Router
    let dialog: MatDialog
    let snackBar: MatSnackBar

    beforeEach(() => {
        orgSvc = new OrgProfileService(null as any)  // Mocked instance, replace with actual mock
        configSvc = new ConfigurationsService()  // Mocked instance, replace with actual mock
        router = new Router()  // Mocked instance
        dialog = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any)  // Mocked instance
        snackBar = new MatSnackBar(null as any, null as any, null as any, null as any, null as any, null as any)  // Mocked instance

        component = new ConsultancyComponent(
            orgSvc,
            configSvc,
            router,
            dialog,
            snackBar
        )

        // Mock methods
        orgSvc.updateFormStatus = jest.fn()
        configSvc.unMappedUser = { orgProfile: { profileDetails: { consultancy: { projects: [] } } } }
        // dialog.open = jest.fn(() => ({ afterClosed: jest.fn(() => ({ subscribe: jest.fn() })) }))
        snackBar.open = jest.fn()
    })

    it('should create the component', () => {
        expect(component).toBeDefined()
    })

    it('should initialize consultancy form with default values', () => {
        expect(component.consultancyForm.get('projectName')).toBeDefined()
        expect(component.consultancyForm.get('programeStatus')?.value).toBe('Ongoing')
        expect(component.consultancyForm.get('industrySponsored')?.value).toBe(true)
        expect(component.consultancyForm.get('govtSponsored')?.value).toBe(false)
    })

    it('should call orgSvc.updateFormStatus in ngOnInit', () => {
        component.ngOnInit()
        expect(orgSvc.updateFormStatus).toHaveBeenCalledWith('consultancy', true)
    })

    it('should handle addProject when form is valid', () => {
        // Mock valid form values
        component.consultancyForm.setValue({
            projectName: 'Test Project',
            programeStatus: 'Ongoing',
            industrySponsored: true,
            govtSponsored: false,
            otherSponsored: false,
            projectDetail: 'Test Details',
        })
        component.addProject()

        expect(component.addedconsultancies.length).toBe(1)
        expect(component.consultancyForm.reset).toHaveBeenCalled()
        expect(orgSvc.updateLocalFormValue).toHaveBeenCalledWith('consultancy', { projects: component.addedconsultancies })
    })

    it('should not add project if form is invalid', () => {
        // Mock invalid form values
        component.consultancyForm.setValue({
            projectName: '',
            programeStatus: 'Ongoing',
            industrySponsored: true,
            govtSponsored: false,
            otherSponsored: false,
            projectDetail: 'Test Details',
        })

        component.addProject()

        expect(component.addedconsultancies.length).toBe(0)
        expect(snackBar.open).toHaveBeenCalledWith('Project name, program status, sponsers type are required')
    })

    it('should call editProject and patch form values', () => {
        const mockProject = {
            projectName: 'Test Project',
            programeStatus: 'Completed',
            industrySponsored: true,
            govtSponsored: false,
            otherSponsored: true,
            projectDetail: 'Test Details',
        }

        component.editProject(mockProject)

        expect(component.editValue).toBe(mockProject)
        expect(component.consultancyForm.get('projectName')?.value).toBe(mockProject.projectName)
        expect(component.consultancyForm.get('programeStatus')?.value).toBe(mockProject.programeStatus)
        expect(component.consultancyForm.get('industrySponsored')?.value).toBe(mockProject.industrySponsored)
    })

    it('should delete project and update values when confirmed', () => {
        const mockProject = { projectName: 'Test Project' }
        component.addedconsultancies = [{ projectName: 'Test Project' }]
        // const dialogRef = { afterClosed: jest.fn(() => ({ subscribe: jest.fn((cb) => cb(true)) })) }

        // dialog.open.mockReturnValue(dialogRef)
        component.deleteProject(mockProject)

        expect(dialog.open).toHaveBeenCalled()
        expect(component.addedconsultancies.length).toBe(0)
        expect(orgSvc.updateLocalFormValue).toHaveBeenCalledWith('consultancy', { projects: [] })
    })

    it('should open activity dialog', () => {
        component.openActivityDialog()
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), {
            data: { view: 'consultancy' },
            hasBackdrop: false,
            width: '550px',
        })
    })

    it('should call resetConsultancyForm correctly', () => {
        component.consultancyForm.setValue({
            projectName: 'Test',
            programeStatus: 'Completed',
            industrySponsored: true,
            govtSponsored: false,
            otherSponsored: true,
            projectDetail: 'Details',
        })

        component.resetConsultancyForm()

        expect(component.consultancyForm.get('projectName')?.value).toBe('')
        expect(component.consultancyForm.get('programeStatus')?.value).toBe('Ongoing')
        expect(component.consultancyForm.get('industrySponsored')?.value).toBe(true)
    })
})
