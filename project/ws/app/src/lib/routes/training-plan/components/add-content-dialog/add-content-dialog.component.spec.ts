import { of } from 'rxjs'
import { AddContentDialogComponent } from './add-content-dialog.component'

describe('AddContentDialogComponent', () => {
    let component: AddContentDialogComponent
    let mockDialogRef: any
    let mockTrainingPlanService: any
    let mockData: any

    beforeEach(() => {
        // Mock dependencies
        mockDialogRef = {
            close: jest.fn()
        }

        mockTrainingPlanService = {
            getFilterEntity: jest.fn().mockReturnValue(of([])),
            getProviders: jest.fn().mockReturnValue(of([])),
            createNewContentrequest: jest.fn().mockReturnValue(of({}))
        }

        mockData = {}

        // Create component instance
        component = new AddContentDialogComponent(
            mockData,
            mockDialogRef,
            mockTrainingPlanService
        )

        // Call lifecycle hook manually
        component.ngOnInit()
    })

    test('should create', () => {
        expect(component).toBeTruthy()
    })

    test('should initialize form with required validators', () => {
        expect(component.contentForm.get('competencyArea')).toBeTruthy()
        expect(component.contentForm.get('provider')).toBeTruthy()
        expect(component.contentForm.get('contentdescription')).toBeTruthy()

        // Check validators
        const competencyAreaControl = component.contentForm.get('competencyArea')
        competencyAreaControl?.setValue('')
        expect(competencyAreaControl?.valid).toBeFalsy()
        expect(competencyAreaControl?.hasError('required')).toBeTruthy()

        const contentDescriptionControl = component.contentForm.get('contentdescription')
        contentDescriptionControl?.setValue('')
        expect(contentDescriptionControl?.valid).toBeFalsy()
        expect(contentDescriptionControl?.hasError('required')).toBeTruthy()

        // Test max length validator
        contentDescriptionControl?.setValue('a'.repeat(1001))
        expect(contentDescriptionControl?.valid).toBeFalsy()
        expect(contentDescriptionControl?.hasError('maxlength')).toBeTruthy()
    })

    test('should close dialog when closeModal is called', () => {
        component.closeModal()
        expect(mockDialogRef.close).toHaveBeenCalled()
    })

    test('should filter values correctly', () => {
        const array = [
            { name: 'Apple' },
            { name: 'Banana' },
            { name: 'Orange' }
        ]

        const result = component.filterValues('an', array)
        expect(result).toHaveLength(2)
        expect(result).toContainEqual({ name: 'Banana' })
        expect(result).toContainEqual({ name: 'Orange' })
    })

    test('should fetch competencies on init', () => {
        const mockCompetencies = [
            { id: '1', name: 'Comp1', type: 'Competency Area', children: [] }
        ]

        mockTrainingPlanService.getFilterEntity.mockReturnValue(of(mockCompetencies))

        component.getCompetencies()

        expect(mockTrainingPlanService.getFilterEntity).toHaveBeenCalledWith({
            search: { type: 'Competency Area' },
            filter: { isDetail: true }
        })

        expect(component.allCompetencies).toEqual(mockCompetencies)
    })

    test('should fetch providers on init', () => {
        const mockProviders = [
            { name: 'Provider1', orgId: '1' },
            { name: 'Provider2', orgId: '2' }
        ]

        mockTrainingPlanService.getProviders.mockReturnValue(of(mockProviders))

        component.getProviders()

        expect(mockTrainingPlanService.getProviders).toHaveBeenCalled()
        expect(component.providersList.length).toBe(2)
        expect(component.providersList[0].checked).toBe(false)
        expect(component.filteredProviders).toEqual(component.providersList)
    })

    test('should filter providers when search text changes', () => {
        // Setup providers
        component.providersList = [
            { name: 'Provider1', orgId: '1' },
            { name: 'Provider2', orgId: '2' },
            { name: 'Other', orgId: '3' }
        ]

        // Simulate value change
        component.contentForm.get('providerText')?.setValue('provider')

        // Check filtered results
        expect(component.filteredProviders.length).toBe(2)
        expect(component.filteredProviders[0].name).toBe('Provider1')
        expect(component.filteredProviders[1].name).toBe('Provider2')
    })

    test('should select competency area correctly', () => {
        const mockCompetencyArea = {
            id: '1',
            name: 'Comp1',
            type: 'Competency Area',
            children: [
                { id: 'theme1', name: 'Theme1', type: 'Theme', selected: false }
            ]
        }

        component.allCompetencies = [mockCompetencyArea]
        component.compAreaSelected({ name: 'Comp1' })

        expect(component.seletedCompetencyArea).toEqual(mockCompetencyArea)
        expect(component.allCompetencyTheme.length).toBe(1)
        expect(component.allCompetencyTheme[0].name).toBe('Theme1')
        expect(component.allCompetencyTheme[0].selected).toBe(false)
    })

    test('should select competency theme correctly', () => {
        // Setup
        component.allCompetencyTheme = [
            {
                id: 'theme1',
                name: 'Theme1',
                type: 'Theme',
                selected: false,
                children: [
                    { id: 'subtheme1', name: 'SubTheme1', type: 'SubTheme', selected: false }
                ]
            }
        ]
        component.seletedCompetencyTheme = []

        // Select theme
        component.compThemeSelected({ name: 'Theme1' })

        // Check selection
        expect(component.seletedCompetencyTheme.length).toBe(1)
        expect(component.seletedCompetencyTheme[0].name).toBe('Theme1')
        expect(component.seletedCompetencyTheme[0].selected).toBe(true)
        expect(component.allCompetencySubtheme.length).toBe(1)
        expect(component.allCompetencySubtheme[0].name).toBe('SubTheme1')
        expect(component.allCompetencySubtheme[0].compThemeID).toBe('theme1')

        // Deselect theme
        component.compThemeSelected({ name: 'Theme1' })

        // Check deselection
        expect(component.seletedCompetencyTheme.length).toBe(0)
        expect(component.allCompetencySubtheme.length).toBe(0)
    })

    test('should select competency subtheme correctly', () => {
        // Setup
        component.allCompetencySubtheme = [
            { id: 'subtheme1', name: 'SubTheme1', type: 'SubTheme', selected: false, compThemeID: 'theme1' }
        ]
        component.seletedCompetencySubTheme = []

        // Select subtheme
        component.compSubThemeSelected({ name: 'SubTheme1' })

        // Check selection
        expect(component.seletedCompetencySubTheme.length).toBe(1)
        expect(component.seletedCompetencySubTheme[0].name).toBe('SubTheme1')
        expect(component.seletedCompetencySubTheme[0].selected).toBe(true)
        expect(component.enableCompetencyAdd).toBe(true)

        // Deselect subtheme
        component.compSubThemeSelected({ name: 'SubTheme1' })

        // Check deselection
        expect(component.seletedCompetencySubTheme.length).toBe(0)
    })

    test('should reset fields correctly', () => {
        // Setup initial state
        component.enableCompetencyAdd = true
        component.allCompetencyTheme = [{ name: 'Theme1' }]
        component.allCompetencySubtheme = [{ name: 'SubTheme1' }]

        // Call reset
        component.resetCompfields()

        // Check reset state
        expect(component.enableCompetencyAdd).toBe(false)
        expect(component.allCompetencyTheme).toEqual([])
        expect(component.allCompetencySubtheme).toEqual([])
        expect(component.contentForm.pristine).toBe(true)
    })

    test('should reset sub-fields correctly', () => {
        // Setup initial state
        component.enableCompetencyAdd = true
        component.allCompetencySubtheme = [{ name: 'SubTheme1' }]
        component.seletedCompetencyTheme = [{ name: 'Theme1' }]
        component.seletedCompetencySubTheme = [{ name: 'SubTheme1' }]

        // Call reset
        component.resetCompSubfields()

        // Check reset state
        expect(component.enableCompetencyAdd).toBe(false)
        expect(component.allCompetencySubtheme).toEqual([])
        expect(component.seletedCompetencyTheme).toEqual([])
        expect(component.seletedCompetencySubTheme).toEqual([])
    })

    test('should handle provider selection correctly', () => {
        const provider = { name: 'Provider1', orgId: '1' }

        // Select provider
        component.selectionChange({ isUserInput: true }, provider)

        // Check selection
        expect(component.selectedProvidersList.length).toBe(1)
        expect(component.selectedProvidersList[0]).toEqual(provider)

        // Deselect provider
        component.selectionChange({ isUserInput: true }, provider)

        // Check deselection
        expect(component.selectedProvidersList.length).toBe(0)

        // Ignore non-user input
        component.selectionChange({ isUserInput: false }, provider)
        expect(component.selectedProvidersList.length).toBe(0)
    })

    test('should validate form correctly', () => {
        // Empty form should be invalid
        expect(component.isFormInValid()).toBe(true)

        // Setup form with valid data
        component.contentForm.get('competencyArea')?.setValue('Area')
        component.contentForm.get('provider')?.setValue('Provider')
        component.contentForm.get('contentdescription')?.setValue('Description')
        component.seletedCompetencyArea = { id: '1', name: 'Area' }
        component.seletedCompetencyTheme = [{ id: '2', name: 'Theme' }]
        component.seletedCompetencySubTheme = [{ id: '3', name: 'SubTheme' }]

        // Form should be valid
        expect(component.isFormInValid()).toBe(false)
    })

    test('should submit form correctly', () => {
        // Setup form with valid data
        component.contentForm.get('competencyArea')?.setValue('Area')
        component.contentForm.get('provider')?.setValue('Provider')
        component.contentForm.get('contentdescription')?.setValue('Description')

        component.seletedCompetencyArea = {
            id: '1',
            name: 'Area',
            type: 'Competency Area'
        }

        component.seletedCompetencyTheme = [{
            id: '2',
            name: 'Theme',
            type: 'Theme'
        }]

        component.seletedCompetencySubTheme = [{
            id: '3',
            name: 'SubTheme',
            type: 'SubTheme',
            compThemeID: '2'
        }]

        component.selectedProvidersList = [
            { name: 'Provider1', orgId: 'p1' }
        ]

        // Mock successful response
        const mockResponse = { status: 'success' }
        mockTrainingPlanService.createNewContentrequest.mockReturnValue(of(mockResponse))

        // Submit form
        component.submit()

        // Verify service call
        expect(mockTrainingPlanService.createNewContentrequest).toHaveBeenCalled()
        const requestArg = mockTrainingPlanService.createNewContentrequest.mock.calls[0][0]

        // Verify request structure
        expect(requestArg.request.competency.id).toBe('1')
        expect(requestArg.request.competency.name).toBe('Area')
        expect(requestArg.request.competency.children.length).toBe(1)
        expect(requestArg.request.competency.children[0].id).toBe('2')
        expect(requestArg.request.competency.children[0].children.length).toBe(1)
        expect(requestArg.request.competency.children[0].children[0].id).toBe('3')
        expect(requestArg.request.providerList).toEqual(['p1'])
        expect(requestArg.request.description).toBe('Description')

        // Verify dialog closed with response
        expect(mockDialogRef.close).toHaveBeenCalledWith({ event: 'close', data: mockResponse })
    })

    test('should clear search correctly', () => {
        // Setup
        const mockEvent = {
            stopPropagation: jest.fn()
        }

        component.contentForm.get('providerText')?.setValue('search text')

        // Call clearSearch
        component.clearSearch(mockEvent)

        // Verify result
        expect(mockEvent.stopPropagation).toHaveBeenCalled()
        expect(component.contentForm.get('providerText')?.value).toBe('')
    })
})