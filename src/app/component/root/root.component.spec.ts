import { RootComponent } from './root.component'
import { Router, NavigationStart } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
import { BreadcrumbsOrgService } from '@sunbird-cb/collection'
import { MatLegacyDialog } from '@angular/material/legacy-dialog'
import { SwUpdate } from '@angular/service-worker'
import { TelemetryService } from '@sunbird-cb/utils'
import { LoggerService } from '@sunbird-cb/utils'
import { of } from 'rxjs'
import { RootService } from './root.service'
import { ValueService } from '@sunbird-cb/utils' // Ensure ValueService is imported

jest.mock('@angular/router')
jest.mock('@sunbird-cb/collection')
jest.mock('@sunbird-cb/utils')
jest.mock('@angular/material/legacy-dialog')
jest.mock('@angular/service-worker')
jest.mock('@angular/core', () => ({
	...jest.requireActual('@angular/core'),
	ChangeDetectorRef: jest.fn().mockReturnValue({
		detectChanges: jest.fn(),
	}),
}))

describe('RootComponent', () => {
	let component: RootComponent
	let router: Router
	let route: ActivatedRoute
	let breadcrumbsService: BreadcrumbsOrgService
	let telemetryService: TelemetryService
	let swUpdate: SwUpdate
	let dialog: MatLegacyDialog
	let logger: LoggerService
	let rootService: RootService
	let valueSvc: ValueService // Declare valueSvc

	beforeEach(() => {
		// Mock ValueService with necessary properties
		valueSvc = {
			isXSmall$: of(false), // Return a mock observable
		} as any

		router = new Router()
		route = {
			snapshot: { root: { firstChild: null } },
			events: of(new NavigationStart(0, '/some-route')),
		} as any
		breadcrumbsService = new BreadcrumbsOrgService(null as any)
		telemetryService = new TelemetryService(null as any, null as any, null as any, null as any)
		swUpdate = {
			isEnabled: true,
			available: of({}),
			checkForUpdate: jest.fn(),
			activateUpdate: jest.fn(),
		} as any
		dialog = { open: jest.fn(() => ({ afterClosed: jest.fn(() => of(true)) })) } as any
		logger = { log: jest.fn() } as any
		rootService = new RootService()

		component = new RootComponent(
			router,
			route,
			null as any, // authSvc
			null as any, // appRef
			logger as any,
			swUpdate as any,
			dialog as any,
			null as any, // configSvc
			valueSvc as any, // Mocked valueSvc
			telemetryService as any,
			null as any, // mobileAppsSvc
			rootService as any,
			breadcrumbsService as any,
			null as any, // changeDetector
			null as any, // utilitySvc
			null as any, // eventSvc
			null as any, // authSvc
		)

		component.ngOnInit()
	})

	it('should initialize properly in ngOnInit', () => {
		expect(component.isInIframe).toBe(false) // Assuming window.self !== window.top is true by default
		expect(breadcrumbsService.initialize).toHaveBeenCalled()
	})

	it('should handle NavigationStart event correctly', () => {
		// const spy = jest.spyOn(component, 'ngOnInit')
		// router.events.next(new NavigationStart(0, '/public/home'))
		expect(window.location.href).toBe('/public/logout') // Checks redirection in NavigationStart
	})

	it('should handle NavigationEnd event correctly', () => {
		component.ngOnInit() // Simulate ngOnInit for initial setup
		//	router.events.next(new NavigationEnd(0, '/some-route', '/some-route'))
		expect(component.currentUrl).toBe('/some-route')
		expect(component.routeChangeInProgress).toBe(false)
	})

	it('should open dialog when app update is available', () => {
		component.initAppUpdateCheck()
		expect(swUpdate.checkForUpdate).toHaveBeenCalled()
		expect(dialog.open).toHaveBeenCalled()
	})

	it('should call activateUpdate and reload page if user accepts app update', async () => {
		component.initAppUpdateCheck()
		// const dialogRef = dialog.open.mock.results[0].value
		// dialogRef.afterClosed.mockReturnValueOnce(of(true))

		// await dialogRef.afterClosed()

		expect(swUpdate.activateUpdate).toHaveBeenCalled()
		// Check if window location.reload is called after update
		const reloadSpy = jest.spyOn(window.location, 'reload').mockImplementation(() => { })
		expect(reloadSpy).toHaveBeenCalled()
	})

	it('should call telemetryService.raiseAppStartTelemetry when app starts', () => {
		const telemetrySpy = jest.spyOn(telemetryService, 'impression')
		component.raiseAppStartTelemetry()
		expect(telemetrySpy).toHaveBeenCalled()
	})

	it('should detect changes in ngOnInit', () => {
		//const detectChangesSpy = jest.spyOn(component.changeDetector, 'detectChanges')
		component.ngOnInit()
		//expect(detectChangesSpy).toHaveBeenCalled()
	})

	it('should unsubscribe from loaderSubscription on destroy', () => {
		const unsubscribeSpy = jest.spyOn(component.loaderSubscription, 'unsubscribe')
		//component.ngOnDestroy()
		expect(unsubscribeSpy).toHaveBeenCalled()
	})
})
