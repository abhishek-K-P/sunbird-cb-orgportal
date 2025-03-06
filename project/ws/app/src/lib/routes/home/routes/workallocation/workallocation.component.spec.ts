import { WorkallocationComponent } from './workallocation.component'
import { of, throwError } from 'rxjs'

describe('WorkallocationComponent', () => {
	let component: WorkallocationComponent
	let mockExportAsService: any
	let mockRouter: any
	let mockWrkAllocServ: any
	let mockWorkallocationSrvc: any
	let mockActiveRoute: any
	let mockEvents: any
	let mockRoute: any
	let mockDialog: any
	let mockEventSvc: any

	beforeEach(() => {
		// Mock DOM element for loader
		document.body.innerHTML = '<div id="loader"></div>'

		// Initialize mocks
		mockExportAsService = {
			save: jest.fn().mockReturnValue(of({}))
		}

		mockRouter = {
			navigate: jest.fn()
		}

		mockWrkAllocServ = {
			getPDF: jest.fn().mockReturnValue(of(new Blob()))
		}

		mockWorkallocationSrvc = {
			getAllUsers: jest.fn().mockReturnValue(of({
				result: {
					response: {
						channel: 'testChannel',
						rootOrgId: 'testOrgId'
					}
				}
			})),
			getUsers: jest.fn().mockReturnValue(of({
				result: {
					data: [{ id: '1', name: 'User 1' }],
					totalhit: 1
				}
			})),
			fetchWAT: jest.fn().mockReturnValue(of({
				result: {
					data: [
						{
							id: '1',
							name: 'Work Order 1',
							userIds: ['user1', 'user2'],
							updatedAt: '2023-01-01T12:00:00Z',
							updatedByName: 'Test User',
							errorCount: 0,
							createdAt: '2023-01-01T10:00:00Z',
							createdByName: 'Test Creator',
							publishedPdfLink: 'test-link',
							signedPdfLink: 'signed-link'
						}
					]
				}
			})),
			fetchAllWATRequestBySearch: jest.fn().mockReturnValue(of({
				result: {
					data: [
						{
							id: '2',
							name: 'Work Order 2',
							userIds: ['user3'],
							updatedAt: '2023-01-02T12:00:00Z',
							updatedByName: 'Test User 2',
							errorCount: 0,
							createdAt: '2023-01-02T10:00:00Z',
							createdByName: 'Test Creator 2',
							publishedPdfLink: 'test-link-2',
							signedPdfLink: 'signed-link-2'
						}
					]
				}
			})),
			fetchUserByWID: jest.fn().mockReturnValue(of({
				result: {
					data: {
						first_name: 'John',
						last_name: 'Doe'
					}
				}
			})),
			getTime: jest.fn().mockReturnValue('2023-01-01')
		}

		mockActiveRoute = {
			snapshot: {
				params: {
					tab: 'draft'
				}
			}
		}

		mockEvents = {
			raiseInteractTelemetry: jest.fn()
		}

		mockRoute = {
			parent: {
				snapshot: {
					data: {
						configService: {}
					}
				}
			}
		}

		mockDialog = {
			open: jest.fn().mockReturnValue({
				afterClosed: jest.fn().mockReturnValue(of({}))
			})
		}

		mockEventSvc = {
			handleTabTelemetry: jest.fn()
		}

		// Create component instance
		component = new WorkallocationComponent(
			mockExportAsService,
			mockRouter,
			mockWrkAllocServ,
			mockWorkallocationSrvc,
			mockActiveRoute,
			mockEvents,
			mockRoute,
			mockDialog,
			mockEventSvc
		)

		// Mock paginator
		component.paginator = {
			firstPage: jest.fn()
		} as any

		// Initialize component
		component.ngOnInit()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})

	it('should initialize with correct table data structure', () => {
		expect(component.tabledata).toBeDefined()
		expect(component.tabledata.columns.length).toBe(5)
		expect(component.tabledata.columns[0].displayName).toBe('Work order')
	})

	it('should set currentFilter based on route params', () => {
		expect(component.currentFilter).toBe('Draft')
		expect(component.currentUrl).toBe('app/home/workallocation/draft')
	})

	it('should fetch WAT data when filter is applied', () => {
		component.filter('Published')
		expect(mockWorkallocationSrvc.fetchWAT).toHaveBeenCalledWith('Published')
		expect(component.currentFilter).toBe('Published')
	})

	it('should display loader when fetching data', () => {
		const loaderElement = document.getElementById('loader')
		component.displayLoader(true)
		expect(loaderElement?.style.display).toBe('block')

		component.displayLoader(false)
		expect(loaderElement?.style.display).toBe('none')
	})

	it('should handle PDF export', () => {
		component.selectedPDFid = '123'
		component.export()
		expect(mockWrkAllocServ.getPDF).toHaveBeenCalledWith('123')
		expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
	})

	it('should handle buttonClick for Download action', () => {
		const row = { id: '1', name: 'Test' }
		component.buttonClick('Download', row)
		expect(component.downloaddata).toContain(row)
		expect(mockExportAsService.save).toHaveBeenCalled()
	})

	it('should handle search based on query', () => {
		const searchQuery = 'test query'
		component.searchBasedOnQurey(searchQuery as any)
		expect(mockWorkallocationSrvc.fetchAllWATRequestBySearch).toHaveBeenCalledWith(searchQuery, 'Draft')
	})

	it('should handle onRoleClick', () => {
		const element = { id: '123' }
		component.onRoleClick(element)
		expect(component.selectedPDFid).toBe('123')
		expect(component.isPrint).toBe(true)
		expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
	})

	it('should handle onNewAllocationClick', () => {
		component.onNewAllocationClick()
		expect(mockDialog.open).toHaveBeenCalled()
		expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
	})

	it('should handle tabTelemetry', () => {
		component.tabTelemetry('Tab1', 1)
		expect(mockEventSvc.handleTabTelemetry).toHaveBeenCalled()
	})

	it('should handle viewAllocation', () => {
		const data = { userId: '123' }
		component.viewAllocation(data)
		expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/workallocation/details/123'])
	})

	it('should handle error in fetchWAT', () => {
		mockWorkallocationSrvc.fetchWAT = jest.fn().mockReturnValue(throwError('Error'))
		const spy = jest.spyOn(component, 'displayLoader')

		component.getWAT('Draft')
		expect(spy).toHaveBeenCalledWith(true)
		expect(spy).toHaveBeenCalledWith(false)
	})

	it('should handle ngOnChanges', () => {
		const changes = {
			data: {
				currentValue: [{ id: '1' }]
			}
		}
		component.ngOnChanges(changes as any)
		expect(component.data).toEqual([{ id: '1' }])
		expect(component.length).toBe(1)
		expect(component.paginator.firstPage).toHaveBeenCalled()
	})

	it('should handle applyFilter', () => {
		component.data = { filter: '' } as any
		component.applyFilter('Test')
		expect(component.data.filter).toBe('test')

		component.applyFilter('')
		expect(component.data.filter).toBe('')
	})

	it('should handle getUserByWID', () => {
		const result = component.getUserByWID('123')
		expect(mockWorkallocationSrvc.fetchUserByWID).toHaveBeenCalledWith('123')
		expect(result).toBe('Loading..')
	})
})