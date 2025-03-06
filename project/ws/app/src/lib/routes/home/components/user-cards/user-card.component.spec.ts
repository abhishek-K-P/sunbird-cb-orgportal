import { UserCardComponent } from './user-card.component'
import { of, Subject } from 'rxjs'
import { DatePipe } from '@angular/common'
import { UntypedFormGroup } from '@angular/forms'

// Mock services and dependencies
const mockUsersService = {
	getUserById: jest.fn(),
	getDesignations: jest.fn(),
	getGroups: jest.fn(),
	getMasterLanguages: jest.fn(),
	updateUserDetails: jest.fn(),
	addUserToDepartment: jest.fn(),
	mentorList$: new Subject()
}

const mockRolesService = {
	getAllRoles: jest.fn()
}

const mockApprovalSvc = {
	getProfileConfig: jest.fn(),
	handleWorkflowV2: jest.fn(),
	handleWorkflow: jest.fn()
}

const mockDialog = {
	open: jest.fn().mockReturnValue({
		afterClosed: () => of(true)
	})
}

const mockSnackBar = {
	open: jest.fn()
}

const mockEvents = {
	raiseInteractTelemetry: jest.fn()
}

const mockRoute = {
	snapshot: {
		data: {
			configService: {
				unMappedUser: {
					rootOrgId: 'org123',
					roles: ['MDO_ADMIN']
				}
			}
		}
	}
}

const mockChangeDetectorRef = {
	detectChanges: jest.fn()
}

describe('UserCardComponent', () => {
	let component: UserCardComponent
	const datePipe = new DatePipe('en-US')

	beforeEach(() => {
		// Reset mocks
		jest.clearAllMocks()

		// Setup mock responses
		mockUsersService.getUserById.mockReturnValue(of({
			userId: 'user123',
			firstName: 'John',
			lastName: 'Doe',
			profileDetails: {
				personalDetails: {
					firstname: 'John',
					primaryEmail: 'john@example.com',
					mobile: '9876543210',
					gender: 'MALE',
					dob: '01-01-1990'
				},
				professionalDetails: [{
					designation: 'Developer',
					group: 'IT'
				}],
				additionalProperties: {
					tag: ['tag1', 'tag2']
				},
				employmentDetails: {
					pinCode: '123456',
					employeeCode: 'EMP123'
				}
			},
			organisations: [{
				roles: ['CONTENT_CREATOR']
			}],
			roles: ['CONTENT_CREATOR']
		}))

		mockUsersService.getDesignations.mockReturnValue(of({
			responseData: ['Developer', 'Manager', 'Analyst']
		}))

		mockUsersService.getGroups.mockReturnValue(of({
			result: {
				response: ['IT', 'HR', 'Finance', 'Others']
			}
		}))

		mockUsersService.getMasterLanguages.mockReturnValue(of({
			languages: [
				{ name: 'English' },
				{ name: 'Hindi' }
			]
		}))

		mockRolesService.getAllRoles.mockReturnValue(of({
			result: {
				response: {
					value: JSON.stringify({
						orgTypeList: [{
							name: 'MDO',
							roles: ['MDO_ADMIN', 'CONTENT_CREATOR']
						}]
					})
				}
			}
		}))

		mockApprovalSvc.getProfileConfig.mockResolvedValue({
			profileData: ['field1', 'field2']
		})

		mockUsersService.updateUserDetails.mockReturnValue(of({ success: true }))
		mockUsersService.addUserToDepartment.mockReturnValue(of({ success: true }))
		mockApprovalSvc.handleWorkflowV2.mockReturnValue(of({ result: { data: true } }))

		// Initialize component
		component = new UserCardComponent(
			mockUsersService as any,
			mockRolesService as any,
			mockDialog as any,
			mockApprovalSvc as any,
			mockRoute as any,
			mockSnackBar as any,
			mockEvents as any,
			datePipe,
			mockChangeDetectorRef as any
		)

		// Initialize sample data
		component.usersData = [
			{
				userId: 'user123',
				firstName: 'John',
				lastName: 'Doe',
				profileDetails: {
					personalDetails: {
						firstname: 'John',
						profileStatusUpdatedOn: '2023-01-01 12:00:00'
					}
				}
			}
		]
	})

	it('should create the component', () => {
		expect(component).toBeTruthy()
	})

	it('should initialize with default values', () => {
		expect(component.startIndex).toBe(0)
		expect(component.pageSize).toBe(20)
		expect(component.selectedtags).toEqual([])
	})

	it('should format profileStatusUpdatedOn value in ngOnInit', () => {
		component.ngOnInit()
		expect(component.usersData[0].profileDetails.profileStatusUpdatedOn).toBe('2023-01-01')
	})

	it('should load roles on init', () => {
		component.ngOnInit()
		expect(mockRolesService.getAllRoles).toHaveBeenCalled()
	})

	it('should load designations on init', () => {
		component.init()
		expect(mockUsersService.getDesignations).toHaveBeenCalled()
	})

	it('should load groups on init', () => {
		component.init()
		expect(mockUsersService.getGroups).toHaveBeenCalled()
	})

	it('should load languages on init', () => {
		component.init()
		expect(mockUsersService.getMasterLanguages).toHaveBeenCalled()
	})

	it('should close other panels when a panel is opened', () => {
		const mockPanel1 = { close: jest.fn() }
		const mockPanel2 = { close: jest.fn() }
		const mockOpenPanel = mockPanel1

		component.panels = {
			forEach: (callback: Function) => {
				callback(mockPanel1)
				callback(mockPanel2)
			}
		} as any

		component.closeOtherPanels(mockOpenPanel as any)

		expect(mockPanel2.close).toHaveBeenCalled()
		expect(mockPanel1.close).not.toHaveBeenCalled()
	})

	it('should handle pagination change', () => {
		const mockPageEvent = { pageIndex: 2, pageSize: 25 }
		const emitSpy = jest.spyOn(component.paginationData, 'emit')

		component.onChangePage(mockPageEvent as any)

		expect(emitSpy).toHaveBeenCalledWith({ pageIndex: 2, pageSize: 25 })
	})

	it('should handle pagination change for approvals', () => {
		const mockPageEvent = { pageIndex: 2, pageSize: 25 }
		const emitSpy = jest.spyOn(component.paginationData, 'emit')

		component.isApprovals = true
		component.onChangePage(mockPageEvent as any)

		expect(emitSpy).toHaveBeenCalledWith({ pageIndex: 2, pageSize: 25 })
	})

	it('should emit search event', () => {
		const emitSpy = jest.spyOn(component.searchByEnterKey, 'emit')
		const mockEvent = { target: { value: 'search term' } }

		component.onSearch(mockEvent)

		expect(emitSpy).toHaveBeenCalledWith(mockEvent)
	})

	it('should handle onEditUser', () => {
		const mockUser = { userId: 'user123' }
		const mockPanel = { open: jest.fn() }

		component.onEditUser(mockUser, mockPanel)

		expect(mockUsersService.getUserById).toHaveBeenCalledWith('user123')
		setTimeout(() => {
			expect(mockPanel.open).toHaveBeenCalled()
		}, 0)
	})

	it('should get user avatar name', () => {
		const user = {
			firstName: 'John',
			profileDetails: {
				personalDetails: {
					firstname: 'John'
				}
			}
		}

		const result = component.getUseravatarName(user)
		expect(result).toBe('John')
	})

	it('should mark user status', () => {
		const user = { userId: 'user123' }
		component.markStatus('ACTIVE', user)

		expect(mockUsersService.updateUserDetails).toHaveBeenCalledWith({
			request: {
				userId: 'user123',
				profileDetails: {
					profileStatus: 'ACTIVE',
				},
			},
		})
	})

	it('should submit form data and update user', () => {
		// Setup
		const mockUser = { userId: 'user123' }
		const mockPanel = { close: jest.fn() }
		component.updateUserDataForm = {
			valid: true,
			controls: {
				dob: { value: new Date('1990-01-01') },
				domicileMedium: { value: 'English' },
				gender: { value: 'Male' },
				category: { value: 'General' },
				mobile: { value: '9876543210' },
				primaryEmail: { value: 'john@example.com' },
				designation: { value: 'Developer' },
				group: { value: 'IT' },
				pincode: { value: '123456' },
				employeeID: { value: 'EMP123' }
			}
		} as unknown as UntypedFormGroup

		component.selectedtags = ['tag1', 'tag2']
		const updateSpy = jest.spyOn(component.updateList, 'emit')

		// Execute
		component.onSubmit(component.updateUserDataForm, mockUser, mockPanel)

		// Verify
		expect(mockUsersService.updateUserDetails).toHaveBeenCalled()
		setTimeout(() => {
			expect(mockPanel.close).toHaveBeenCalled()
			expect(updateSpy).toHaveBeenCalled()
			expect(mockSnackBar.open).toHaveBeenCalledWith(
				'User updated Successfully, updated data will be reflecting in sometime.',
				'X',
				expect.any(Object)
			)
		}, 0)
	})

	it('should handle approvals submission', () => {
		// Setup
		const mockPanel = { close: jest.fn() }
		const mockAppData = {
			userWorkflow: {
				wfInfo: [
					{
						actorUUID: 'actor123',
						applicationId: 'app123',
						serviceName: 'service1',
						userId: 'user123',
						wfId: 'wf123',
						deptName: 'dept1',
						updateFieldValues: JSON.stringify([
							{
								toValue: { name: 'newValue' }
							}
						])
					}
				]
			}
		}
		component.currentFilter = 'transfers'
		component.actionList = []

		// Execute
		component.onApprovalSubmit(mockPanel, mockAppData)

		// Verify
		expect(mockApprovalSvc.handleWorkflowV2).toHaveBeenCalled()
		setTimeout(() => {
			expect(mockSnackBar.open).toHaveBeenCalledWith('Request has been updated')
			expect(component.updateList.emit).toHaveBeenCalled()
		}, 100)
	})

	it('should save mentor profile', () => {
		// Setup
		const mockUser = {
			userId: 'user123',
			rootOrgId: 'org123',
			roles: [{ role: 'CONTENT_CREATOR' }]
		}
		const mockEvent = { checked: true }
		component.userRoles = new Set(['CONTENT_CREATOR'])

		// Execute
		component.saveMentorProfile(mockUser, mockEvent)

		// Verify
		expect(mockUsersService.addUserToDepartment).toHaveBeenCalledWith({
			request: {
				organisationId: 'org123',
				userId: 'user123',
				roles: ['CONTENT_CREATOR', 'MENTOR']
			}
		})

		setTimeout(() => {
			expect(mockSnackBar.open).toHaveBeenCalledWith('User Assigned as Mentor Successfully')
		}, 0)
	})

	it('should detect if user has mentor role', () => {
		// Setup
		const userWithMentor = {
			roles: [{ role: 'CONTENT_CREATOR' }, { role: 'MENTOR' }]
		}

		const userWithoutMentor = {
			roles: [{ role: 'CONTENT_CREATOR' }]
		}

		// Execute & Verify
		expect(component.getUserRoles(userWithMentor)).toBe(true)
		expect(component.getUserRoles(userWithoutMentor)).toBe(false)
	})

	it('should transform date string to Date object', () => {
		// Access private method using any type
		const component: any = new UserCardComponent(
			mockUsersService as any,
			mockRolesService as any,
			mockDialog as any,
			mockApprovalSvc as any,
			mockRoute as any,
			mockSnackBar as any,
			mockEvents as any,
			datePipe,
			mockChangeDetectorRef as any
		)

		// Test ISO format date
		expect(component.getDateFromText('2023-01-01T12:00:00')).toBe('2023-01-01')

		// Test DD-MM-YYYY format
		expect(component.getDateFromText('01-01-2023')).toBeInstanceOf(Date)

		// Test empty string
		expect(component.getDateFromText('')).toBe('')
	})
})