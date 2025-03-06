import { FeaturesComponent } from './features.component'
import { Router, ActivatedRoute } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { CustomTourService } from '@sunbird-cb/collection'
import { SubapplicationRespondService } from '@sunbird-cb/utils'
import { ValueService } from '@sunbird-cb/utils'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { of, Subject } from 'rxjs'

jest.mock('@angular/router')
jest.mock('@sunbird-cb/utils')
jest.mock('@sunbird-cb/collection')
jest.mock('@angular/material/legacy-dialog')

describe('FeaturesComponent', () => {
    let component: FeaturesComponent
    let mockRouter: Router
    let mockActivatedRoute: ActivatedRoute
    let mockConfigurationsService: ConfigurationsService
    let mockCustomTourService: CustomTourService
    let mockSubapplicationRespondService: SubapplicationRespondService
    let mockValueService: ValueService
    let mockMatDialog: MatDialog

    beforeEach(() => {
        // Mocking all the service dependencies
        mockRouter = { navigate: jest.fn() } as any
        mockActivatedRoute = { snapshot: { queryParamMap: { get: jest.fn(() => 'test-query') } } } as any
        mockConfigurationsService = { appsConfig: { groups: [], features: {} }, tourGuideNotifier: new Subject<boolean>() } as any
        mockCustomTourService = { startTour: jest.fn() } as any
        mockSubapplicationRespondService = { unsubscribeResponse: jest.fn() } as any
        mockValueService = { isXSmall$: of(false) } as any
        mockMatDialog = { open: jest.fn() } as any

        // Create component instance with mocked services
        component = new FeaturesComponent(
            mockMatDialog,
            mockRouter,
            mockActivatedRoute,
            mockConfigurationsService,
            mockCustomTourService,
            mockSubapplicationRespondService,
            mockValueService
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should subscribe to queryControl valueChanges and update query param in the URL', () => {
        const spyNavigate = jest.spyOn(mockRouter, 'navigate')
        const newQuery = 'new-query'

        component.ngOnInit()
        component.queryControl.setValue(newQuery)

        expect(spyNavigate).toHaveBeenCalledWith([], { queryParams: { q: newQuery } })
    })

    it('should filter features based on query', () => {
        const query = 'feature-query'
        //const mockFeature = { name: 'Feature 1', keywords: ['keyword1'], description: 'feature description' }
        // const mockGroup = { featureWidgets: [{ widgetData: { actionBtn: mockFeature } }] }
        // component['featuresConfig'] = [mockGroup]

        const filteredFeatures = component['filteredFeatures'](query)

        expect(filteredFeatures.length).toBe(1)
        expect(filteredFeatures[0].featureWidgets.length).toBe(1)
    })

    it('should clear query when clear method is called', () => {
        component.clear()
        expect(component.queryControl.value).toBe('')
    })

    it('should call startTour when startTour is invoked', () => {
        component.startTour()
        expect(mockCustomTourService.startTour).toHaveBeenCalled()
        expect(mockSubapplicationRespondService.unsubscribeResponse).toHaveBeenCalled()
    })

    it('should open the logout dialog when logout method is called', () => {
        component.logout()
        expect(mockMatDialog.open).toHaveBeenCalled()
    })

    it('should update isTourGuideAvailable based on tourGuideNotifier', () => {
        component.ngOnInit()
        mockConfigurationsService.tourGuideNotifier.next(true)

        expect(component.isTourGuideAvailable).toBe(true)

        mockConfigurationsService.tourGuideNotifier.next(false)
        expect(component.isTourGuideAvailable).toBe(false)
    })

    it('should handle ngOnDestroy and unsubscribe from queryChangeSubs', () => {
        component.ngOnInit()
        const spyUnsubscribe = jest.spyOn(component['queryChangeSubs']!, 'unsubscribe')

        component.ngOnDestroy()

        expect(spyUnsubscribe).toHaveBeenCalled()
    })
})
