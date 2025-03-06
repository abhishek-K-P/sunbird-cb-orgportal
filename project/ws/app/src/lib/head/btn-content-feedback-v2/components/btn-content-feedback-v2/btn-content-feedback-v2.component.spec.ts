import { BtnContentFeedbackV2Component } from './btn-content-feedback-v2.component'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { BtnContentFeedbackDialogV2Component } from '../btn-content-feedback-dialog-v2/btn-content-feedback-dialog-v2.component'

describe('BtnContentFeedbackV2Component', () => {
    let component: BtnContentFeedbackV2Component
    let dialogMock: MatDialog
    let configSvcMock: ConfigurationsService

    beforeEach(() => {
        // Mock the dependencies
        dialogMock = { open: jest.fn() } as unknown as MatDialog
        configSvcMock = {
            restrictedFeatures: new Set(),
        } as unknown as ConfigurationsService

        // Instantiate the component with mocked dependencies
        component = new BtnContentFeedbackV2Component(dialogMock, configSvcMock)
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should set isFeedbackEnabled to true when contentFeedback is not restricted', () => {
        // Set up the mock to return an empty set, meaning contentFeedback is not restricted
        configSvcMock.restrictedFeatures = new Set()

        // Call ngOnInit to initialize the component
        component.ngOnInit()

        expect(component.isFeedbackEnabled).toBe(true)
    })

    it('should set isFeedbackEnabled to false when contentFeedback is restricted', () => {
        // Set up the mock to have contentFeedback restricted
        configSvcMock.restrictedFeatures = new Set(['contentFeedback'])

        // Call ngOnInit to initialize the component
        component.ngOnInit()

        expect(component.isFeedbackEnabled).toBe(false)
    })

    it('should not open dialog when forPreview is true', () => {
        component.forPreview = true
        component.widgetData = {} as any

        component.openFeedbackDialog()

        expect(dialogMock.open).not.toHaveBeenCalled()
    })

    it('should open dialog when forPreview is false', () => {
        component.forPreview = false
        component.widgetData = { /* mock necessary widget data */ } as any

        component.openFeedbackDialog()

        expect(dialogMock.open).toHaveBeenCalledWith(
            BtnContentFeedbackDialogV2Component,
            {
                data: component.widgetData,
                minWidth: '320px',
                width: '500px',
            }
        )
    })

    it('should have the correct id binding', () => {
        expect(component.id).toBe('v2-feedbak-content')
    })
})
