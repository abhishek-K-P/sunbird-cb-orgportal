import { CreateRequestFormComponent } from './create-request-form.component'
import { UntypedFormBuilder } from '@angular/forms'
import { ProfileV2Service } from '../../../services/home.servive'
import { ActivatedRoute, Router } from '@angular/router'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { of, Subject } from 'rxjs'
import { InitService } from '../../../../../../../../../../src/app/services/init.service'
import { CompetencyViewComponent } from '../competency-view/competency-view.component'
import { ConfirmationBoxComponent } from '../../../../training-plan/components/confirmation-box/confirmation.box.component'

// Mock the dependencies
jest.mock('../../../services/home.servive')
jest.mock('@angular/router')
jest.mock('@angular/material/legacy-dialog')
jest.mock('@angular/material/legacy-snack-bar')
jest.mock('../../../../../../../../../../src/app/services/init.service')

describe('CreateRequestFormComponent', () => {
    let component: CreateRequestFormComponent
    let formBuilder: UntypedFormBuilder
    let homeService: jest.Mocked<ProfileV2Service>
    let activatedRoute: jest.Mocked<ActivatedRoute>
    let snackBar: jest.Mocked<MatSnackBar>
    let router: jest.Mocked<Router>
    let dialog: jest.Mocked<MatDialog>
    let initService: jest.Mocked<InitService>
    let queryParamsSubject: Subject<any>

    beforeEach(() => {
        // Create mocks
        formBuilder = new UntypedFormBuilder()
        homeService = {
            getFilterEntity: jest.fn().mockReturnValue(of([])),
            getFilterEntityV2: jest.fn().mockReturnValue(of([
                { terms: [{ name: 'Area1', identifier: 'area1', associations: [] }] },
                { terms: [{ name: 'Theme1', identifier: 'theme1', associations: [], hasOwnProperty: jest.fn().mockReturnValue(true) }] }
            ])),
            getRequestTypeList: jest.fn().mockReturnValue(of([])),
            getRequestDataById: jest.fn().mockReturnValue(of({})),
            createDemand: jest.fn().mockReturnValue(of('success'))
        } as unknown as jest.Mocked<ProfileV2Service>

        queryParamsSubject = new Subject()
        activatedRoute = {
            snapshot: {
                data: {
                    configService: {
                        userProfile: {
                            userId: 'user123'
                        }
                    }
                }
            },
            queryParams: queryParamsSubject.asObservable()
        } as unknown as jest.Mocked<ActivatedRoute>

        snackBar = {
            open: jest.fn()
        } as unknown as jest.Mocked<MatSnackBar>

        router = {
            navigateByUrl: jest.fn()
        } as unknown as jest.Mocked<Router>

        const dialogRefMock = {
            afterClosed: jest.fn().mockReturnValue(of('confirmed'))
        }

        dialog = {
            open: jest.fn().mockReturnValue(dialogRefMock)
        } as unknown as jest.Mocked<MatDialog>

        initService = {
            configSvc: {
                competency: {
                    v5: { vKey: 'competencies_v5' }
                }
            }
        } as unknown as jest.Mocked<InitService>

        // Create component with mocked dependencies
        component = new CreateRequestFormComponent(
            formBuilder,
            homeService,
            activatedRoute,
            snackBar,
            router,
            dialog,
            initService
        )

        // Initialize component
        component.compentencyKey = { vKey: 'competencies_v5', vCompetencyArea: '', vCompetencyAreaDescription: '', vCompetencyTheme: '', vCompetencySubTheme: '' }
        component.ngOnInit()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize the form', () => {
        expect(component.requestForm).toBeDefined()
        expect(component.requestForm.controls['TitleName']).toBeDefined()
        expect(component.requestForm.controls['Objective']).toBeDefined()
        expect(component.requestForm.controls['requestType']).toBeDefined()
    })

    it('should fetch competency data on init for v5', () => {
        expect(homeService.getFilterEntity).toHaveBeenCalled()
    })

    it('should fetch competency data on init for v2', () => {
        component.compentencyKey = { vKey: 'competencies_v5', vCompetencyArea: '', vCompetencyAreaDescription: '', vCompetencyTheme: '', vCompetencySubTheme: '' }
        component.ngOnInit()
        expect(homeService.getFilterEntityV2).toHaveBeenCalled()
    })

    it('should load request type list on init', () => {
        expect(homeService.getRequestTypeList).toHaveBeenCalled()
    })

    it('should get request data by ID if demandId is provided', () => {
        queryParamsSubject.next({ id: '123', name: 'view' })
        expect(component.demandId).toBe('123')
        expect(component.actionBtnName).toBe('view')
        expect(homeService.getRequestDataById).toHaveBeenCalledWith('123')
    })

    it('should set form as disabled in view mode', () => {
        const disableSpy = jest.spyOn(component.requestForm, 'disable')
        queryParamsSubject.next({ id: '123', name: 'view' })
        expect(disableSpy).toHaveBeenCalled()
        expect(component.isHideData).toBe(true)
        expect(component.isCompetencyHide).toBe(true)
    })

    it('should handle reassign mode correctly', () => {
        const disableSpy = jest.spyOn(component.requestForm, 'disable')
        const enableSpy = jest.spyOn(component.requestForm.controls['assignee'], 'enable')
        queryParamsSubject.next({ id: '123', name: 'reassign' })
        expect(disableSpy).toHaveBeenCalled()
        expect(enableSpy).toHaveBeenCalled()
        expect(component.isCompetencyHide).toBe(true)
    })

    it('should navigate back to request list', () => {
        component.navigateBack()
        expect(router.navigateByUrl).toHaveBeenCalledWith('/app/home/request-list')
    })

    it('should select Single request type correctly', () => {
        component.selectRequestType('Single')
        expect(component.isAssignee).toBe(true)
        expect(component.isBroadCast).toBe(false)
        expect(component.statusValue).toBe('Assigned')
    })

    it('should select Broadcast request type correctly', () => {
        component.selectRequestType('Broadcast')
        expect(component.isAssignee).toBe(false)
        expect(component.isBroadCast).toBe(true)
        expect(component.statusValue).toBe('Unassigned')
    })

    it('should add competency when addCompetency is called with valid selections', () => {
        // Setup mock data
        component.seletedCompetencyArea = { name: 'Area1', id: 'area1', description: 'Area 1 Desc' }
        component.seletedCompetencyTheme = {
            name: 'Theme1',
            id: 'theme1',
            description: 'Theme 1 Desc',
            additionalProperties: { themeType: 'type1' }
        }
        component.seletedCompetencySubTheme = {
            name: 'SubTheme1',
            id: 'subtheme1',
            description: 'SubTheme 1 Desc'
        }

        const setValue = jest.fn()
        component.requestForm.controls['competencies_v5'] = {
            value: [],
            setValue
        } as any

        // Call the method
        component.addCompetency()

        // Check if setValue was called with the right object
        expect(setValue).toHaveBeenCalledWith([{
            competencyArea: 'Area1',
            competencyAreaId: 'area1',
            competencyAreaDescription: 'Area 1 Desc',
            competencyTheme: 'Theme1',
            competencyThemeId: 'theme1',
            competecnyThemeDescription: 'Theme 1 Desc',
            competencyThemeType: 'type1',
            competencySubTheme: 'SubTheme1',
            competencySubThemeId: 'subtheme1',
            competecnySubThemeDescription: 'SubTheme 1 Desc',
        }])
    })

    it('should remove competency when removeCompetency is called', () => {
        // Setup mock data
        const competencyItem = {
            competencyAreaId: 'area1',
            competencyThemeId: 'theme1',
            competencySubThemeId: 'subtheme1'
        }

        component.requestForm.controls['competencies_v5'] = {
            value: [competencyItem],
            setValue: jest.fn()
        } as any

        // Call the method
        component.removeCompetency(competencyItem)

        // Check if setValue was called with an empty array
        expect(component.requestForm.controls['competencies_v5'].setValue).toHaveBeenCalledWith([])
    })

    it('should open competency view dialog', () => {
        const competencyItem = { id: 'comp1' }
        component.view(competencyItem)
        expect(dialog.open).toHaveBeenCalledWith(
            CompetencyViewComponent,
            expect.objectContaining({
                data: competencyItem
            })
        )
    })

    it('should open confirmation dialog when showConformationPopUp is called', () => {
        component.actionBtnName = 'create'
        component.showConformationPopUp()
        expect(dialog.open).toHaveBeenCalledWith(
            ConfirmationBoxComponent,
            expect.objectContaining({
                data: expect.objectContaining({
                    title: 'Are you sure you want to Create a demand?'
                })
            })
        )
    })

    it('should submit form data when submit is called', () => {
        // Setup form values
        component.requestForm.setValue({
            TitleName: 'Test Title',
            Objective: 'Test Objective',
            userType: 'Test User',
            learningMode: 'Self-paced',
            compArea: '',
            referenceLink: 'http://test.com',
            requestType: 'Single',
            assignee: { orgName: 'Test Org', id: 'org1' },
            providers: [],
            providerText: '',
            queryThemeControl: '',
            querySubThemeControl: '',
            competencies_v5: [],
            assigneeText: ''
        })

        component.isAssignee = true

        // Mock dialog
        // const dialogRefMock = {
        //     close: jest.fn(),
        //     afterClosed: jest.fn().mockReturnValue(of({}))
        // }
        // dialog.open.mockReturnValue(dialogRefMock)

        // Call submit
        component.submit()

        // Verify homeService.createDemand was called with correct data
        expect(homeService.createDemand).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Test Title',
            objective: 'Test Objective',
            typeOfUser: 'Test User',
            learningMode: 'self-paced',
            assignedProvider: {
                providerName: 'Test Org',
                providerId: 'org1'
            }
        }))
    })

    it('should handle reassign scenario in submit', () => {
        component.demandId = '123'
        component.actionBtnName = 'reassign'
        const enableSpy = jest.spyOn(component.requestForm, 'enable')

        component.submit()

        expect(enableSpy).toHaveBeenCalled()
        expect(homeService.createDemand).toHaveBeenCalled()
    })

    it('should navigate to request list after successful submission', () => {
        component.resData = 'success'

        // Mock dialog
        // const dialogRefMock = {
        //     close: jest.fn(),
        //     afterClosed: jest.fn().mockReturnValue(of({}))
        // }
        // dialog.open.mockReturnValue(dialogRefMock)

        // Call submit
        component.submit()

        // Fast-forward timers
        jest.advanceTimersByTime(1000)

        // Verify navigation
        expect(router.navigateByUrl).toHaveBeenCalledWith('/app/home/request-list')
        expect(snackBar.open).toHaveBeenCalledWith('Request submitted successfully ')
    })

    it('should handle broadcast request type in submit', () => {
        // Setup form values
        component.requestForm.setValue({
            TitleName: 'Test Title',
            Objective: 'Test Objective',
            userType: 'Test User',
            learningMode: 'Self-paced',
            compArea: '',
            referenceLink: 'http://test.com',
            requestType: 'Broadcast',
            assignee: {},
            providers: [
                { orgName: 'Provider 1', id: 'prov1' },
                { orgName: 'Provider 2', id: 'prov2' }
            ],
            providerText: '',
            queryThemeControl: '',
            querySubThemeControl: '',
            competencies_v5: [],
            assigneeText: ''
        })

        component.isBroadCast = true

        // Mock dialog
        // const dialogRefMock = {
        //     close: jest.fn(),
        //     afterClosed: jest.fn().mockReturnValue(of({}))
        // }
        // dialog.open.mockReturnValue(dialogRefMock)

        // Call submit
        component.submit()

        // Verify homeService.createDemand was called with correct providers
        expect(homeService.createDemand).toHaveBeenCalledWith(expect.objectContaining({
            preferredProvider: [
                { providerName: 'Provider 1', providerId: 'prov1' },
                { providerName: 'Provider 2', providerId: 'prov2' }
            ]
        }))
    })

    it('should handle error in submit', () => {
        homeService.createDemand.mockReturnValue(of(new Error('Failed')))

        // Mock dialog
        // const dialogRefMock = {
        //     close: jest.fn(),
        //     afterClosed: jest.fn().mockReturnValue(of({}))
        // }
        // dialog.open.mockReturnValue(dialogRefMock)

        // Call submit
        component.submit()

        // Verify error handling
        expect(snackBar.open).toHaveBeenCalledWith('Request Failed')
    })
})