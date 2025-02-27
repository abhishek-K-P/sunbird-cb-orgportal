import { CreateWorkallocationComponent } from './create-workallocation.component'
import { UntypedFormBuilder } from '@angular/forms'
import { of } from 'rxjs'
import { Router } from '@angular/router'

describe('CreateWorkallocationComponent', () => {
  let component: CreateWorkallocationComponent
  let mockAllocationService: any
  let mockExportAsService: any
  let mockSnackBar: any
  let mockDialog: any
  let mockEvents: any
  let mockConfigSvc: any
  let mockFormBuilder: UntypedFormBuilder
  let mockRouter: any

  beforeEach(() => {
    // Mock dependencies
    mockAllocationService = {
      getAllUsers: jest.fn().mockReturnValue(of({})),
      onSearchUser: jest.fn().mockReturnValue(of({ result: { data: [] } })),
      onSearchRole: jest.fn().mockReturnValue(of([])),
      onSearchPosition: jest.fn().mockReturnValue(of({ responseData: [] })),
      createAllocation: jest.fn().mockReturnValue(of({ success: true })),
      getAllocationDetails: jest.fn().mockReturnValue(of({ result: { data: [{ allocationDetails: { draftWAObject: { id: 'test-id' } } }] } })),
      updateAllocation: jest.fn().mockReturnValue(of({ success: true }))
    }

    mockExportAsService = {
      save: jest.fn().mockReturnValue(of({})),
      get: jest.fn().mockReturnValue(of({}))
    }

    mockSnackBar = {
      open: jest.fn()
    }

    mockDialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: jest.fn().mockReturnValue(of({ data: { userId: 'test-user-id' } }))
      })
    }

    mockEvents = {
      raiseInteractTelemetry: jest.fn()
    }

    mockConfigSvc = {
      unMappedUser: {
        channel: 'Test Department',
        rootOrgId: 'dept-123'
      }
    }

    mockRouter = {
      navigate: jest.fn()
    }

    mockFormBuilder = new UntypedFormBuilder()

    // Initialize component with mocked dependencies
    component = new CreateWorkallocationComponent(
      mockExportAsService,
      mockSnackBar,
      mockFormBuilder,
      mockAllocationService,
      mockRouter as Router,
      mockDialog,
      mockEvents,
      mockConfigSvc
    )

    // Initialize the form
    component.ngOnInit()
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize with default values', () => {
    expect(component.currentTab).toBe('officer')
    expect(component.sticky).toBe(false)
    expect(component.selectedIndex).toBe(0)
    expect(component.tabsData.length).toBe(2)
    expect(component.ralist).toEqual([])
    expect(component.activitieslist).toEqual([])
    expect(component.showPublishButton).toBe(false)
  })

  it('should initialize form with required validators', () => {
    expect(component.newAllocationForm.get('fname')?.validator).toBeTruthy()
    expect(component.newAllocationForm.get('email')?.validator).toBeTruthy()
    expect(component.newAllocationForm.get('position')?.validator).toBeTruthy()
  })

  it('should handle onSideNavTabClick', () => {
    // Mock the document.getElementById method
    document.getElementById = jest.fn().mockReturnValue({
      scrollIntoView: jest.fn()
    })

    component.onSideNavTabClick('roles')

    expect(component.currentTab).toBe('roles')
    expect(document.getElementById).toHaveBeenCalledWith('roles')
    expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
  })

  it('should handle onSearchUser', () => {
    const mockUsers = [{ userDetails: { first_name: 'John', email: 'john@example.com' } }]
    mockAllocationService.onSearchUser.mockReturnValue(of({ result: { data: mockUsers } }))

    // Mock displayLoader method
    component.displayLoader = jest.fn()

    const event = { target: { value: 'John' } }
    component.onSearchUser(event)

    expect(mockAllocationService.onSearchUser).toHaveBeenCalledWith('John')
    expect(component.displayLoader).toHaveBeenCalledWith('true')
    expect(component.displayLoader).toHaveBeenCalledWith('false')
    expect(component.userslist).toEqual(mockUsers)
    expect(component.similarUsers).toEqual(mockUsers)
    expect(component.nosimilarUsers).toBe(false)
  })

  it('should handle onSearchRole', () => {
    const mockRoles = [{ name: 'Admin', childNodes: [] }]
    mockAllocationService.onSearchRole.mockReturnValue(of(mockRoles))

    // Mock displayLoader method
    component.displayLoader = jest.fn()

    const event = { target: { value: 'Admin' } }
    component.onSearchRole(event)

    expect(mockAllocationService.onSearchRole).toHaveBeenCalledWith('Admin')
    expect(component.displayLoader).toHaveBeenCalledWith('true')
    expect(component.displayLoader).toHaveBeenCalledWith('false')
    expect(component.similarRoles).toEqual(mockRoles)
    expect(component.nosimilarRoles).toBe(false)
  })

  it('should handle onSearchPosition', () => {
    const mockPositions = [{ name: 'Manager', id: 'pos-123' }]
    mockAllocationService.onSearchPosition.mockReturnValue(of({ responseData: mockPositions }))

    // Mock displayLoader method
    component.displayLoader = jest.fn()

    const event = { target: { value: 'Manager' } }
    component.onSearchPosition(event)

    expect(mockAllocationService.onSearchPosition).toHaveBeenCalled()
    expect(component.displayLoader).toHaveBeenCalledWith('true')
    expect(component.displayLoader).toHaveBeenCalledWith('false')
    expect(component.similarPositions).toEqual(mockPositions)
    expect(component.nosimilarPositions).toBe(false)
  })

  it('should handle selectUser', () => {
    const mockUser = {
      userDetails: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        wid: 'user-123'
      },
      allocationDetails: {
        userPosition: 'Manager'
      }
    }

    component.selectUser(mockUser)

    expect(component.selectedUser).toEqual(mockUser)
    expect(component.similarUsers).toEqual([])
    expect(component.newAllocationForm.get('fname')?.value).toBe('John Doe')
    expect(component.newAllocationForm.get('email')?.value).toBe('john@example.com')
    expect(component.newAllocationForm.get('position')?.value).toBe('Manager')
  })

  it('should handle selectRole', () => {
    // Mock ElementRef
    component.inputvar = {
      nativeElement: {
        value: 'test'
      }
    } as any

    const mockRole = {
      name: 'Admin',
      childNodes: [{ name: 'Activity 1' }, { name: 'Activity 2' }]
    }

    component.selectRole(mockRole)

    expect(component.selectedRole).toEqual(mockRole)
    expect(component.activitieslist.length).toBe(2)
    expect(component.similarRoles).toEqual([])
    expect(component.selectedActivity).toBe('')
    expect(component.inputvar.nativeElement.value).toBe('')
  })

  it('should handle selectPosition', () => {
    const mockPosition = {
      name: 'Manager',
      id: 'pos-123'
    }

    component.selectedUser = {
      userDetails: {}
    }

    component.selectPosition(mockPosition)

    expect(component.selectedPosition).toEqual(mockPosition)
    expect(component.similarPositions).toEqual([])
    expect(component.newAllocationForm.get('position')?.value).toBe('Manager')
    expect(component.selectedUser.userDetails.position).toBe('Manager')
  })

  it('should handle export', () => {
    component.export()

    expect(mockExportAsService.save).toHaveBeenCalled()
  })

  it('should handle onSubmit', () => {
    component.selectedUser = {
      userDetails: {
        wid: 'user-123',
        email: 'john@example.com'
      },
      allocationDetails: {
        archivedList: []
      }
    }

    component.departmentID = 'dept-123'
    component.departmentName = 'Test Department'
    component.ralist = [{ name: 'Role 1', childNodes: [] }]

    component.newAllocationForm.patchValue({
      fname: 'John Doe',
      email: 'john@example.com',
      position: 'Manager'
    })

    component.onSubmit()

    expect(mockAllocationService.createAllocation).toHaveBeenCalled()
    expect(mockSnackBar.open).toHaveBeenCalledWith('Work Allocated Successfully', 'X', { duration: 5000 })
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/workallocation'])
  })

  it('should handle publishWorkOrder', () => {
    component.publishWorkAllocationData = {
      userId: 'user-123'
    }
    component.waId = 'wa-123'

    component.publishWorkOrder()

    expect(component.publishWorkAllocationData.waId).toBe('wa-123')
    expect(component.publishWorkAllocationData.status).toBe('Published')
    expect(mockAllocationService.updateAllocation).toHaveBeenCalledWith(component.publishWorkAllocationData)
    expect(mockSnackBar.open).toHaveBeenCalledWith('Work Allocated Successfully', 'X', { duration: 5000 })
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/workallocation'])
  })

  it('should handle removeSelectedUSer', () => {
    // Setup mock dialog to return result as true
    mockDialog.open.mockReturnValue({
      afterClosed: jest.fn().mockReturnValue(of(true))
    })

    component.selectedUser = { userDetails: {} }
    component.ralist = [{ name: 'Role 1' }]
    component.activitieslist = [{ name: 'Activity 1' }]

    component.removeSelectedUSer()

    expect(mockDialog.open).toHaveBeenCalled()
    expect(component.selectedUser).toBe('')
    expect(component.ralist).toEqual([])
    expect(component.activitieslist).toEqual([])
  })

  it('should handle addRolesActivity with selected role', () => {
    // Mock ElementRef
    component.inputvar = {
      nativeElement: {
        value: ''
      }
    } as any

    component.selectedRole = {
      name: 'Admin',
      childNodes: []
    }

    component.activitieslist = [{ name: 'Activity 1' }]
    component.ralist = []

    component.addRolesActivity(0)

    expect(component.showRAerror).toBe(false)
    expect(component.ralist.length).toBe(1)
    expect(component.selectedRole).toBe('')
    expect(component.activitieslist).toEqual([])
  })

  it('should handle removeActivity', () => {
    component.activitieslist = [{ name: 'Activity 1' }, { name: 'Activity 2' }]

    component.removeActivity(0)

    expect(component.activitieslist.length).toBe(1)
    expect(component.activitieslist[0].name).toBe('Activity 2')
  })

  it('should handle buttonClick delete action', () => {
    component.ralist = [{ name: 'Role 1' }, { name: 'Role 2' }]

    component.buttonClick('Delete', component.ralist[0])

    expect(component.ralist.length).toBe(1)
    expect(component.ralist[0].name).toBe('Role 2')
  })
})