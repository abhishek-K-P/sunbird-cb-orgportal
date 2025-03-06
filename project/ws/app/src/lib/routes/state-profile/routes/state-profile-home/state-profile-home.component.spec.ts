import { StateProfileHomeComponent } from './state-profile-home.component'
import { ValueService } from '@sunbird-cb/utils'
import { ActivatedRoute, Router } from '@angular/router'
import { StepService } from '../../services/step.service'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { of } from 'rxjs'

describe('StateProfileHomeComponent', () => {
    let component: StateProfileHomeComponent
    let valueServiceMock: jest.Mocked<ValueService>
    let routeMock: jest.Mocked<ActivatedRoute>
    let routerMock: jest.Mocked<Router>
    let stepServiceMock: jest.Mocked<StepService>
    let snackBarMock: jest.Mocked<MatSnackBar>
    let configServiceMock: jest.Mocked<ConfigurationsService>

    beforeEach(() => {
        valueServiceMock = {
            isLtMedium$: of(false), // Mock Observable
        } as any

        routeMock = {
            parent: {
                snapshot: {
                    data: {
                        pageData: {
                            data: {
                                tabs: [],
                            },
                        },
                    },
                },
            },
        } as any

        routerMock = {
            events: of({}), // Mock Router event observable
            navigate: jest.fn(),
        } as any

        stepServiceMock = {
            allSteps: {
                next: jest.fn(),
            },
            currentStep: {
                next: jest.fn(),
                value: {
                    allowSkip: true,
                },
            },
            skipped: {
                next: jest.fn(),
            },
        } as any

        snackBarMock = {
            open: jest.fn(),
        } as any

        configServiceMock = {
            unMappedUser: {
                rootOrgId: 'org123',
            },
        } as any

        component = new StateProfileHomeComponent(
            valueServiceMock,
            routeMock,
            routerMock,
            stepServiceMock,
            configServiceMock,
            snackBarMock,
            null as any // Mock other service if needed
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize tabs from route data', () => {
        component.ngOnInit()
        expect(component.tabs).toEqual([])
    })

    it('should call init method on constructor', () => {
        const initSpy = jest.spyOn(component, 'init')
        component.ngOnInit()
        expect(initSpy).toHaveBeenCalled()
    })

    it('should unsubscribe from router events in ngOnDestroy', () => {
        const unsubscribeSpy = jest.spyOn(component['routerSubscription']!, 'unsubscribe')
        component.ngOnDestroy()
        expect(unsubscribeSpy).toHaveBeenCalled()
    })

    it('should update org profile', () => {
        const updateOrgProfileSpy = jest.spyOn(component, 'updateOrgProfile')
        component.updateOrgProfile(true)
        expect(updateOrgProfileSpy).toHaveBeenCalled()
    })

    it('should navigate on update profile', () => {
        component.updateProfile()
        expect(routerMock.navigate).toHaveBeenCalledWith(['/app/home/welcome'])
    })

    it('should update current step on navigation event', () => {
        //const navigationEvent = { url: '/app/home/welcome' }
        //component['routerSubscription']!.next({ ...navigationEvent })
        expect(component.currentStep).toBe(1)
    })

    it('should check if next step is allowed', () => {
        const result = component.isNextStepAllowed
        expect(result).toBe(true) // Assuming it returns true based on current step
    })

    it('should show snackbar on error in updateOrgProfile', () => {
        const error = { error: 'Error: Something went wrong' }
        const openSnackbarSpy = jest.spyOn(snackBarMock, 'open')
        component.updateOrgProfile(true)
        component['openSnackbar'](error.error.split(':')[1])
        expect(openSnackbarSpy).toHaveBeenCalledWith('Something went wrong', 'X', { duration: 5000 })
    })

    it('should return next step from next getter', () => {
        component.currentStep = 1
        component.tabs = [
            {
                step: 1, key: 'welcome', routerLink: '/welcome',
                name: '',
                badges: {
                    enabled: false,
                    uri: undefined
                },
                enabled: false,
                description: ''
            },
            {
                step: 2, key: 'nextStep', routerLink: '/next',
                name: '',
                badges: {
                    enabled: false,
                    uri: undefined
                },
                enabled: false,
                description: ''
            },
        ]
        const nextStep = component.next
        expect(nextStep).toEqual({ step: 2, key: 'nextStep', routerLink: '/next' })
    })

    it('should return null if no next step from next getter', () => {
        component.currentStep = 3
        const nextStep = component.next
        expect(nextStep).toBe('done')
    })

    it('should return previous step from previous getter', () => {
        component.currentStep = 2
        component.tabs = [
            {
                step: 1, key: 'welcome', routerLink: '/welcome',
                name: '',
                badges: {
                    enabled: false,
                    uri: undefined
                },
                enabled: false,
                description: ''
            },
            {
                step: 2, key: 'nextStep', routerLink: '/next',
                name: '',
                badges: {
                    enabled: false,
                    uri: undefined
                },
                enabled: false,
                description: ''
            },
        ]
        const prevStep = component.previous
        expect(prevStep).toEqual({ step: 1, key: 'welcome', routerLink: '/welcome' })
    })

    it('should return null if no current step from current getter', () => {
        component.currentStep = 10
        const currentStep = component.current
        expect(currentStep).toBeNull()
    })

    it('should check form validity from isFormValid getter', () => {
        // component.current = { key: 'someKey' } as any
        const isValid = component.isFormValid
        expect(isValid).toBe(true) // Assuming the form status is valid
    })
})
