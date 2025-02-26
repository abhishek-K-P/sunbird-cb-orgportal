import { AssistantMessageCardComponent } from './assistant-message-card.component'
import { Subject } from 'rxjs'

describe('AssistantMessageCardComponent', () => {
    let component: AssistantMessageCardComponent
    let mockWatStoreService: any

    // Mock subjects for the service
    const activitiesGroupSubject = new Subject<any[]>()
    const competencyGroupSubject = new Subject<any[]>()
    const updateCompGroupOSubject = new Subject<any[]>()
    const officerGroupSubject = new Subject<any>()

    beforeEach(() => {
        // Create mock for WatStoreService
        mockWatStoreService = {
            getactivitiesGroup: activitiesGroupSubject.asObservable(),
            getcompetencyGroup: competencyGroupSubject.asObservable(),
            getUpdateCompGroupO: updateCompGroupOSubject.asObservable(),
            getOfficerGroup: officerGroupSubject.asObservable(),
            setErrorCount: jest.fn(),
            setCurrentProgress: jest.fn()
        }

        // Instantiate the component with mocked service
        component = new AssistantMessageCardComponent(mockWatStoreService)

        // Call ngOnInit to set up subscriptions
        component.ngOnInit()
    })

    afterEach(() => {
        // Clean up by calling ngOnDestroy
        component.ngOnDestroy()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('Progress Color', () => {
        it('should return red color for progress <= 30', () => {
            // Mock the progress calculation
            jest.spyOn(component, 'currentProgress', 'get').mockReturnValue(30)

            expect(component.progressColor()).toBe('#D13924')
        })

        it('should return orange color for progress between 31 and 70', () => {
            jest.spyOn(component, 'currentProgress', 'get').mockReturnValue(50)

            expect(component.progressColor()).toBe('#E99E38')
        })

        it('should return green color for progress between 71 and 100', () => {
            jest.spyOn(component, 'currentProgress', 'get').mockReturnValue(80)

            expect(component.progressColor()).toBe('#1D8923')
        })

        it('should return empty string for invalid progress', () => {
            jest.spyOn(component, 'currentProgress', 'get').mockReturnValue(101)

            expect(component.progressColor()).toBe('')
        })
    })

    describe('calculateOfficerErrors', () => {
        it('should return error if officer name is empty but other fields are filled', () => {
            const data = { officerName: '', position: 'Manager', positionDescription: 'Description' }

            const result = component.calculateOfficerErrors(data)

            expect(result).toContainEqual(expect.objectContaining({
                _type: 'error',
                type: 'officer',
                label: 'Officer name is empty'
            }))
        })

        it('should return error if position is empty but other fields are filled', () => {
            const data = { officerName: 'John', position: '', positionDescription: 'Description' }

            const result = component.calculateOfficerErrors(data)

            expect(result).toContainEqual(expect.objectContaining({
                _type: 'error',
                type: 'officer',
                label: 'Designation missing'
            }))
        })

        it('should return warning if position description is empty', () => {
            const data = { officerName: 'John', position: 'Manager', positionDescription: '' }

            const result = component.calculateOfficerErrors(data)

            expect(result).toContainEqual(expect.objectContaining({
                _type: 'warning',
                type: 'officer',
                label: 'Designation description missing'
            }))
        })
    })

    describe('calculateOfficerProgress', () => {
        it('should calculate correct progress for complete officer data', () => {
            const data = {
                officerName: 'John Doe',
                position: 'Manager',
                positionDescription: 'Team Manager'
            }

            const result = component.calculateOfficerProgress(data)

            expect(result).toBe(100)
        })

        it('should calculate correct progress for partially complete officer data', () => {
            const data = {
                officerName: 'John Doe',
                position: 'Manager',
                positionDescription: ''
            }

            const result = component.calculateOfficerProgress(data)

            // 33.33 + 33.33 = 66.66, which should floor to 66
            expect(result).toBe(66)
        })
    })

    describe('fetchFormsData', () => {
        it('should update dataStructure with activities from store', () => {
            const mockActivities = [{ activities: [{ activityDescription: 'test' }] }]

            // Mock the validationsCombined method
            component.validationsCombined = jest.fn()

            // Emit mock activities
            activitiesGroupSubject.next(mockActivities)

            expect(component.dataStructure.activityGroups).toEqual(mockActivities)
            expect(component.validationsCombined).toHaveBeenCalled()
        })

        it('should update dataStructure with competencies from store', () => {
            const mockCompetencies = [{ competincies: [{ compName: 'test' }] }]

            // Mock the validationsCombined method
            component.validationsCombined = jest.fn()

            // Emit mock competencies
            competencyGroupSubject.next(mockCompetencies)

            expect(component.dataStructure.compGroups).toEqual(mockCompetencies)
            expect(component.validationsCombined).toHaveBeenCalled()
        })

        it('should update dataStructure with competency details from store', () => {
            const mockCompDetails = [{ compLevel: 'test' }]

            // Mock the validationsCombined method
            component.validationsCombined = jest.fn()

            // Emit mock competency details
            updateCompGroupOSubject.next(mockCompDetails)

            expect(component.dataStructure.compDetails).toEqual(mockCompDetails)
            expect(component.validationsCombined).toHaveBeenCalled()
        })

        it('should update dataStructure with officer data from store', () => {
            const mockOfficerData = { officerName: 'John', position: 'Manager' }

            // Mock the validationsCombined method
            component.validationsCombined = jest.fn()

            // Emit mock officer data
            officerGroupSubject.next(mockOfficerData)

            expect(component.dataStructure.officerFormData).toEqual(mockOfficerData)
            expect(component.validationsCombined).toHaveBeenCalled()
        })
    })

    describe('validationsCombined', () => {
        it('should group validations by type and update error count', () => {
            // Mock the individualValidations method
            jest.spyOn(component, 'individualValidations').mockReturnValue([
                { _type: 'error', type: 'officer', counts: 0, label: 'Officer name is empty' },
                { _type: 'warning', type: 'competency', counts: 1, label: 'Competency level missing' }
            ])

            component.validationsCombined()

            expect(component.validations).toEqual({
                error: [{ _type: 'error', type: 'officer', counts: 0, label: 'Officer name is empty' }],
                warning: [{ _type: 'warning', type: 'competency', counts: 1, label: 'Competency level missing' }]
            })

            expect(mockWatStoreService.setErrorCount).toHaveBeenCalledWith(1)
        })
    })

    describe('calculatePercentage', () => {
        it('should calculate overall progress based on weighted component progresses', () => {
            // Setup mock data structure
            component.dataStructure = {
                officerFormData: { officerName: 'John', position: 'Manager', positionDescription: 'Team Manager' },
                activityGroups: [{}],
                compGroups: [{}],
                compDetails: [{}]
            }

            // Mock the component progress calculations
            jest.spyOn(component, 'calculateOfficerProgress').mockReturnValue(100)
            jest.spyOn(component, 'calculateActivityProgress').mockReturnValue(80)
            jest.spyOn(component, 'calculateCompProgress').mockReturnValue(60)
            jest.spyOn(component, 'calculateCompDetailsProgress').mockReturnValue(40)

            const result = component.calculatePercentage()

            // Calculate expected progress:
            // Officer: 100 * 0.1 = 10
            // Activity: 80 * 0.6 = 48
            // Competency: 60 * 0.2 = 12
            // Comp Details: 40 * 0.1 = 4
            // Total: 10 + 48 + 12 + 4 = 74
            expect(result).toBe(74)
            expect(mockWatStoreService.setCurrentProgress).toHaveBeenCalledWith(74)
        })

        it('should handle exceptions and return 0', () => {
            // Setup mock data that would cause error
            component.dataStructure = {}

            // Mock calculation method to throw error
            jest.spyOn(component, 'calculateOfficerProgress').mockImplementation(() => {
                throw new Error('Test error')
            })

            const result = component.calculatePercentage()

            expect(result).toBe(0)
        })
    })
})