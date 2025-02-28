import { of, throwError } from 'rxjs'
import { HttpErrorResponse } from '@angular/common/http'
import { ReportsSectionComponent } from './reports-section.component'

describe('ReportsSectionComponent', () => {
	let component: ReportsSectionComponent
	let mockActiveRouter: any
	let mockDownloadService: any
	let mockDatePipe: any
	let mockDialog: any
	let mockEvents: any
	let mockSnackBar: any
	let mockSanitizer: any
	let mockChangeDetector: any
	let mockLoaderService: any

	beforeEach(() => {
		// Mock dependencies
		mockActiveRouter = {
			parent: {
				snapshot: {
					data: {
						configService: {
							unMappedUser: {
								id: 'user123',
								roles: ['MDO_LEADER'],
								rootOrg: { organisationType: 'department' }
							},
							userProfile: {
								rootOrgId: 'rootOrg123',
								departmentName: 'Test Department'
							}
						}
					}
				}
			}
		}

		mockDownloadService = {
			getReportInfo: jest.fn(),
			getAdminsList: jest.fn(),
			getAccessDetails: jest.fn(),
			updateAccessToReports: jest.fn(),
			getDepartmentType: jest.fn(),
			searchOrgs: jest.fn(),
			getOrgsOfDepartment: jest.fn(),
			downloadReportsForEachOrgId: jest.fn()
		}

		mockDatePipe = {
			transform: jest.fn((date, format) => {
				if (!date) return ''
				if (format === 'dd/MM/yyyy, hh:mm a') return '01/01/2023, 12:00 PM'
				if (format === 'yyyy/MM/dd') return '2023/01/01'
				if (format === 'dd-MMM-yyyy') return '01-Jan-2023'
				return date.toString()
			})
		}

		mockDialog = {
			open: jest.fn()
		}

		mockEvents = {
			raiseInteractTelemetry: jest.fn()
		}

		mockSnackBar = {
			open: jest.fn()
		}

		mockSanitizer = {
			bypassSecurityTrustHtml: jest.fn(html => html)
		}

		mockChangeDetector = {
			detectChanges: jest.fn()
		}

		mockLoaderService = {
			changeLoaderState: jest.fn()
		}

		// Create component with mocked dependencies
		component = new ReportsSectionComponent(
			mockActiveRouter,
			mockDownloadService,
			mockDatePipe as any,
			mockDialog,
			mockEvents,
			mockSnackBar,
			mockSanitizer,
			mockChangeDetector,
			mockLoaderService
		);

		// Mock environment
		(global as any).environment = {
			teamsUrl: 'https://teams.example.com',
			karmYogiPath: '/path'
		}

		// Mock document methods
		document.createElement = jest.fn(() => ({
			value: '',
			href: '',
			download: '',
			select: jest.fn(),
			click: jest.fn()
		})) as any
		document.body.appendChild = jest.fn()
		document.body.removeChild = jest.fn()
		document.execCommand = jest.fn()

		// Mock window methods
		window.URL.createObjectURL = jest.fn(() => 'blob:url')
		window.URL.revokeObjectURL = jest.fn()
	})

	it('should create the component', () => {
		expect(component).toBeTruthy()
	})

	describe('ngOnInit', () => {
		it('should call initialization methods', () => {
			// Spy on the methods
			jest.spyOn(component, 'getReportInfo')
			jest.spyOn(component, 'setTableHeaders')
			jest.spyOn(component, 'getAdminTableData')
			jest.spyOn(component, 'filterOrgsSearch')

			// Call ngOnInit
			component.ngOnInit()

			// Verify methods were called
			expect(component.getReportInfo).toHaveBeenCalled()
			expect(component.setTableHeaders).toHaveBeenCalled()
			expect(component.getAdminTableData).toHaveBeenCalledWith(true)
			expect(component.filterOrgsSearch).toHaveBeenCalled()
			expect(component.noteLoaded).toBe(false)
		})
	})

	describe('getReportInfo', () => {
		it('should set lastUpdatedOn and reportsAvailbale when API returns data', () => {
			const mockResponse = {
				lastModified: '2023-01-01',
				fileMetaData: { empty: false }
			}

			mockDownloadService.getReportInfo.mockReturnValue(of(mockResponse))

			component.getReportInfo()

			expect(component.lastUpdatedOn).toBe('01/01/2023, 12:00 PM')
			expect(component.reportsAvailbale).toBe(true)
		})

		it('should handle error when API fails', () => {
			const errorResponse = new HttpErrorResponse({
				error: { message: 'API Error' },
				status: 500
			})

			mockDownloadService.getReportInfo.mockReturnValue(throwError(() => errorResponse))

			component.getReportInfo()

			expect(mockSnackBar.open).toHaveBeenCalledWith('API Error', 'X', { duration: 5000 })
		})
	})

	describe('setTableHeaders', () => {
		it('should set adminTableData with correct columns', () => {
			component.setTableHeaders()

			expect(component.adminTableData).toEqual({
				columns: [
					{ displayName: 'S. No.', key: 'sno', type: 'position' },
					{ displayName: 'MDO Admin Name', key: 'MDOAdmin', type: 'text' },
					{ displayName: 'MDO Admin Email', key: 'MDOAdminemail', type: 'text' },
					{ displayName: 'Access Expiry Date', key: 'expiryDate', type: 'datePicker' },
					{ displayName: 'Action', key: 'assigned', type: 'action' },
				],
			})
		})
	})

	describe('getAdminTableData', () => {
		it('should set adminTableDataSource with formatted admin data', () => {
			const mockAdminsResponse = {
				content: [
					{
						id: 'admin123',
						firstName: 'Admin',
						lastName: '',
						isDeleted: false,
						profileDetails: {
							personalDetails: {
								primaryEmail: 'admin@example.com'
							}
						}
					}
				]
			}

			const mockAccessResponse = [
				{
					userId: 'user123',
					reportAccessExpiry: '2023-12-31'
				},
				{
					userId: 'admin123',
					reportAccessExpiry: '2023-12-31'
				}
			]

			mockDownloadService.getAdminsList.mockReturnValue(of(mockAdminsResponse))
			mockDownloadService.getAccessDetails.mockReturnValue(of(mockAccessResponse))

			component.getAdminTableData(true)

			expect(component.showAdminsTable).toBe(true)
			expect(component.showLoaderOnTable).toBe(true)
			expect(mockDownloadService.getAdminsList).toHaveBeenCalled()
			expect(mockDownloadService.getAccessDetails).toHaveBeenCalled()

			// Wait for observable to complete
			setTimeout(() => {
				expect(component.noteLoaded).toBe(true)
				expect(component.showLoaderOnTable).toBe(false)
				expect(component.adminTableDataSource).toHaveLength(1)
				expect(component.adminTableDataSource[0].userID).toBe('admin123')
				expect(component.adminTableDataSource[0].MDOAdmin).toBe('Admin')
			}, 0)
		})

		it('should handle error during API calls', () => {
			const errorResponse = new HttpErrorResponse({
				error: { message: 'API Error' },
				status: 500
			})

			mockDownloadService.getAdminsList.mockReturnValue(throwError(() => errorResponse))

			component.getAdminTableData(true)

			setTimeout(() => {
				expect(mockSnackBar.open).toHaveBeenCalledWith('API Error', 'X', { duration: 5000 })
				expect(component.noteLoaded).toBe(true)
				expect(component.showLoaderOnTable).toBe(false)
			}, 0)
		})
	})

	describe('getNoteList', () => {
		it('should set appropriate notes for MDO leader with users', () => {
			component.getNoteList(true, true, '2023/12/31')

			expect(component.reportAccessExpireDate).toBe('2023/12/31')
			expect(component.hassAccessToreports).toBe(true)
			expect(component.reportsNoteList).toHaveLength(2)
			expect(component.reportsNoteList[0]).toContain('You can grant access to these reports')
		})

		it('should set appropriate notes for MDO admin with access', () => {
			mockDatePipe.transform.mockImplementation((date: any, format: any) => {
				if (format === 'yyyy/MM/dd' && !date) return '2023/01/01'
				if (format === 'yyyy/MM/dd') return '2023/01/01'
				if (format === 'dd-MMM-yyyy') return '01-Jan-2023'
				return date?.toString() || ''
			})

			component.getNoteList(false, true, '2023/12/31')

			expect(component.hassAccessToreports).toBe(true)
			expect(component.reportsNoteList).toHaveLength(2)
			expect(component.reportsNoteList[0]).toContain('These reports contain Personally Identifiable Information')
		})

		it('should set appropriate notes for MDO admin with expired access', () => {
			mockDatePipe.transform.mockImplementation((date: any, format: any) => {
				if (format === 'yyyy/MM/dd' && !date) return '2023/12/31'
				if (format === 'yyyy/MM/dd') return '2023/12/31'
				if (format === 'dd-MMM-yyyy') return '31-Dec-2023'
				return date?.toString() || ''
			})

			component.getNoteList(false, true, '2023/01/01')

			expect(component.hassAccessToreports).toBe(false)
			expect(component.reportsNoteList).toHaveLength(1)
			expect(component.reportsNoteList[0]).toContain('Your access to reports expired on')
		})
	})

	describe('copyToClipboard', () => {
		it('should copy password to clipboard', () => {
			component.password = 'testPassword'

			component.copyToClipboard()

			expect(document.createElement).toHaveBeenCalledWith('textarea')
			expect(document.body.appendChild).toHaveBeenCalled()
			expect(document.execCommand).toHaveBeenCalledWith('copy')
			expect(document.body.removeChild).toHaveBeenCalled()
			expect(mockSnackBar.open).toHaveBeenCalledWith('Password copied to clipboard.', 'X', { duration: 5000 })
		})
	})

	describe('updateAccess', () => {
		it('should call updateAccessToReports and show success message', () => {
			const rowData = {
				userID: 'admin123',
				expiryDate: '2023-12-31'
			}

			const successResponse = {
				result: {
					message: 'Access granted successfully'
				}
			}

			mockDownloadService.updateAccessToReports.mockReturnValue(of(successResponse))
			jest.spyOn(component, 'getAdminTableData')

			component.updateAccess(rowData)

			expect(component.showLoaderOnTable).toBe(true)
			expect(mockDownloadService.updateAccessToReports).toHaveBeenCalledWith({
				request: {
					userId: 'admin123',
					reportExpiryDate: '2023-12-31'
				}
			})

			setTimeout(() => {
				expect(mockSnackBar.open).toHaveBeenCalledWith('Access granted successfully', 'X', { duration: 5000 })
				expect(component.getAdminTableData).toHaveBeenCalled()
			}, 0)
		})

		it('should handle error when updating access', () => {
			const rowData = {
				userID: 'admin123',
				expiryDate: '2023-12-31'
			}

			const errorResponse = new HttpErrorResponse({
				error: { message: 'Update failed' },
				status: 500
			})

			mockDownloadService.updateAccessToReports.mockReturnValue(throwError(() => errorResponse))
			jest.spyOn(component, 'getAdminTableData')

			component.updateAccess(rowData)

			setTimeout(() => {
				expect(mockSnackBar.open).toHaveBeenCalledWith('Update failed', 'X', { duration: 5000 })
				expect(component.getAdminTableData).toHaveBeenCalled()
			}, 0)
		})
	})

	describe('openVideoPopup', () => {
		it('should open dialog with correct MDO_LEADER video', () => {
			component.openVideoPopup()

			expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
				data: {
					videoLink: '/path/assets/public/content/guide-videos/MDO-leader-reports.MP4'
				},
				disableClose: true,
				width: '50%',
				height: '60%',
				panelClass: 'overflow-visable'
			})
		})
	})

	describe('downloadReportsForEach', () => {
		it('should download reports for selected organizations', () => {
			const mockEvent = { stopPropagation: jest.fn() } as any

			///		component.selection.select({ sbOrgId: 'org123', orgName: 'Test Org' })

			// const mockResponse = [
			// 	new HttpResponse({
			// 		body: new Blob(['test'], { type: 'application/zip' }),
			// 		headers: {
			// 			getAll: (name: string) => name === 'Password' ? ['pass123'] : [],
			// 			get: (name: string) => name === 'Content-Type' ? 'application/zip' : null
			// 		},
			// 		status: 200
			// 	})
			// ]

			// mockDownloadService.downloadReportsForEachOrgId.mockReturnValue(of(mockResponse))
			jest.spyOn(component, 'raiseTelemetry')

			component.downloadReportsForEach(mockEvent)

			expect(mockEvent.stopPropagation).toHaveBeenCalled()
			expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(true)
			expect(mockDownloadService.downloadReportsForEachOrgId).toHaveBeenCalled()

			setTimeout(() => {
				expect(component.customReportPwd).toBe('pass123')
				expect(window.URL.createObjectURL).toHaveBeenCalled()
				expect(component.raiseTelemetry).toHaveBeenCalled()
				expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
				expect(mockChangeDetector.detectChanges).toHaveBeenCalled()
			}, 0)
		})
	})

	describe('retryDownload', () => {
		it('should retry download for failed item', () => {
			const mockEvent = { stopPropagation: jest.fn() } as any
			const item = { sbOrgId: 'org123', orgName: 'Test Org', status: 'Failed' }

			jest.spyOn(component, 'downloadReportsForEach')

			component.retryDownload(mockEvent, item)

			expect(mockEvent.stopPropagation).toHaveBeenCalled()
			expect(item.status).toBe('Pending')
			expect(component.downloadReportsForEach).toHaveBeenCalledWith(mockEvent, [item])
		})
	})

	describe('filterOrgsSearch', () => {
		it('should fetch and process organization data', async () => {
			const mockDepartmentType = {
				result: {
					response: {
						value: JSON.stringify({
							fields: [
								{ value: 'department', name: 'Department' }
							]
						})
					}
				}
			}

			const mockSearchOrgsResponse = {
				result: {
					response: [
						{ mapId: 'map123', orgName: 'Test Org', sbOrgId: 'org123' }
					]
				}
			}

			const mockOrgsOfDepartmentResponse = {
				result: {
					response: {
						content: [
							{ orgName: 'Sub Org', sbOrgId: 'subOrg123' }
						]
					}
				}
			}

			mockDownloadService.getDepartmentType.mockReturnValue(of(mockDepartmentType))
			mockDownloadService.searchOrgs.mockReturnValue(of(mockSearchOrgsResponse))
			mockDownloadService.getOrgsOfDepartment.mockReturnValue(of(mockOrgsOfDepartmentResponse))
			jest.spyOn(component, 'updateDataSource')

			await component.filterOrgsSearch()

			expect(mockDownloadService.getDepartmentType).toHaveBeenCalled()
			expect(mockDownloadService.searchOrgs).toHaveBeenCalled()

			setTimeout(() => {
				expect(component.orgListData).toEqual(mockSearchOrgsResponse.result.response)
				expect(mockDownloadService.getOrgsOfDepartment).toHaveBeenCalledWith('map123')
				expect(component.l1orgListData).toEqual([{ orgName: 'Sub Org', sbOrgId: 'subOrg123' }])
				expect(component.updateDataSource).toHaveBeenCalled()
				expect(mockChangeDetector.detectChanges).toHaveBeenCalled()
			}, 0)
		})
	})

	describe('updateDataSource', () => {
		it('should update data source with organization data', () => {
			component.orgListData = [{ orgName: 'Main Org', sbOrgId: 'org123' }]
			component.l1orgListData = [{ orgName: 'Sub Org', sbOrgId: 'subOrg123' }]

			component.updateDataSource()

			expect(component.dataSource.data).toEqual([
				{ orgName: 'Main Org', sbOrgId: 'org123' },
				{ orgName: 'Sub Org', sbOrgId: 'subOrg123' }
			])
		})

		it('should update failed items in data source', () => {
			component.orgListData = [{ orgName: 'Main Org', sbOrgId: 'org123' }]
			component.l1orgListData = []

			const failedItems = [
				{ orgName: 'Main Org', sbOrgId: 'org123', status: 'Failed' }
			]

			component.updateDataSource(failedItems)

			expect(component.dataSource.data).toEqual([
				{ orgName: 'Main Org', sbOrgId: 'org123', status: 'Failed' }
			])
		})
	})
})