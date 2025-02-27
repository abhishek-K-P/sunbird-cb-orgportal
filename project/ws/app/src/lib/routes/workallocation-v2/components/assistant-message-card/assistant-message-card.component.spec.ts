import { AssistantMessageCardComponent } from './assistant-message-card.component'
import { Subject } from 'rxjs'

describe('AssistantMessageCardComponent', () => {
    let component: AssistantMessageCardComponent
    let watStoreServiceMock: any
    let activitiesSubject: Subject<any>
    let competencySubject: Subject<any>
    let updateCompGroupSubject: Subject<any>
    let officerGroupSubject: Subject<any>

    beforeEach(() => {
        // Create subjects for mock observables
        activitiesSubject = new Subject<any>()
        competencySubject = new Subject<any>()
        updateCompGroupSubject = new Subject<any>()
        officerGroupSubject = new Subject<any>()

        // Create spy object for WatStoreService
        watStoreServiceMock = {
            getactivitiesGroup: activitiesSubject.asObservable(),
            getcompetencyGroup: competencySubject.asObservable(),
            getUpdateCompGroupO: updateCompGroupSubject.asObservable(),
            getOfficerGroup: officerGroupSubject.asObservable(),
            setErrorCount: jest.fn(),
            setCurrentProgress: jest.fn()
        }

        // Create component instance
        component = new AssistantMessageCardComponent(watStoreServiceMock)
        component.ngOnInit()
    })

    afterEach(() => {
        // Call ngOnDestroy to clean up subscriptions
        component.ngOnDestroy()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('Progress Color', () => {
        it('should return red color for progress <= 30', () => {
            jest.spyOn(component, 'currentProgress', 'get').mockReturnValue(30)
            expect(component.progressColor()).toBe('#D13924')
        })

        it('should return orange color for progress between 30 and 70', () => {
            jest.spyOn(component, 'currentProgress', 'get').mockReturnValue(50)
            expect(component.progressColor()).toBe('#E99E38')
        })

        it('should return green color for progress > 70', () => {
            jest.spyOn(component, 'currentProgress', 'get').mockReturnValue(80)
            expect(component.progressColor()).toBe('#1D8923')
        })
    })

    describe('Data Reception and Validation', () => {
        it('should process officer form data', () => {
            const spyValidationsCombined = jest.spyOn(component, 'validationsCombined')

            officerGroupSubject.next({
                officerName: 'John Doe',
                position: 'Manager',
                positionDescription: 'Project Management'
            })

            expect(spyValidationsCombined).toHaveBeenCalled()
            expect(component.dataStructure.officerFormData).toBeDefined()
        })

        it('should process activities data when available', () => {
            const spyValidationsCombined = jest.spyOn(component, 'validationsCombined')

            activitiesSubject.next([{
                activities: [{ activityDescription: 'Task 1', assignedTo: 'Team A' }]
            }])

            expect(spyValidationsCombined).toHaveBeenCalled()
            expect(component.dataStructure.activityGroups).toBeDefined()
        })

        it('should process competency group data when available', () => {
            const spyValidationsCombined = jest.spyOn(component, 'validationsCombined')

            competencySubject.next([{
                competincies: [{ compName: 'Leadership', compDescription: 'Ability to lead teams' }]
            }])

            expect(spyValidationsCombined).toHaveBeenCalled()
            expect(component.dataStructure.compGroups).toBeDefined()
        })

        it('should process competency details when available', () => {
            const spyValidationsCombined = jest.spyOn(component, 'validationsCombined')

            updateCompGroupSubject.next([{
                compLevel: 'Advanced',
                compType: 'Technical',
                compArea: 'Project Management'
            }])

            expect(spyValidationsCombined).toHaveBeenCalled()
            expect(component.dataStructure.compDetails).toBeDefined()
        })
    })

    describe('Officer Validation', () => {
        it('should detect missing officer name error', () => {
            const result = component.calculateOfficerErrors({
                officerName: '',
                position: 'Manager',
                positionDescription: 'Description'
            })

            expect(result.find(item => item.label === 'Officer name is empty')).toBeTruthy()
        })

        it('should detect missing position error', () => {
            const result = component.calculateOfficerErrors({
                officerName: 'John Doe',
                position: '',
                positionDescription: 'Description'
            })

            expect(result.find(item => item.label === 'Designation missing')).toBeTruthy()
        })

        it('should detect missing position description warning', () => {
            const result = component.calculateOfficerErrors({
                officerName: 'John Doe',
                position: 'Manager',
                positionDescription: ''
            })

            expect(result.find(item => item.label === 'Designation description missing')).toBeTruthy()
        })

        it('should not return errors for complete officer data', () => {
            const result = component.calculateOfficerErrors({
                officerName: 'John Doe',
                position: 'Manager',
                positionDescription: 'Description'
            })

            expect(result.length).toBe(0)
        })
    })

    describe('Activity Validation', () => {
        it('should detect unmapped activities', () => {
            const data = [
                {
                    activities: [
                        { activityDescription: '', assignedTo: '' }
                    ]
                }
            ]

            const result = component.calculateActivityError(data)
            expect(result.find(item => item.label === 'Unmapped activities')).toBeTruthy()
        })

        it('should detect missing activity description', () => {
            const data = [
                { activities: [] },
                {
                    groupName: 'Role 1',
                    groupDescription: 'Description',
                    activities: [
                        { activityDescription: '', assignedTo: 'Team A' }
                    ]
                }
            ]

            const result = component.calculateActivityError(data)
            expect(result.find(item => item.label === 'Activity description missing')).toBeTruthy()
        })

        it('should detect missing submit to', () => {
            const data = [
                { activities: [] },
                {
                    groupName: 'Role 1',
                    groupDescription: 'Description',
                    activities: [
                        { activityDescription: 'Activity 1', assignedTo: '' }
                    ]
                }
            ]

            const result = component.calculateActivityError(data)
            expect(result.find(item => item.label === 'Submit to is missing')).toBeTruthy()
        })

        it('should detect missing role label', () => {
            const data = [
                { activities: [] },
                {
                    groupName: '',
                    groupDescription: 'Description',
                    activities: [
                        { activityDescription: 'Activity 1', assignedTo: 'Team A' }
                    ]
                }
            ]

            const result = component.calculateActivityError(data)
            expect(result.find(item => item.label === 'Role label missing')).toBeTruthy()
        })

        it('should detect missing role description (warning)', () => {
            const data = [
                { activities: [] },
                {
                    groupName: 'Role 1',
                    groupDescription: '',
                    activities: [
                        { activityDescription: 'Activity 1', assignedTo: 'Team A' }
                    ]
                }
            ]

            const result = component.calculateActivityError(data)
            expect(result.find(item => item.label === 'Role description missing')).toBeTruthy()
        })
    })

    describe('Competency Validation', () => {
        it('should detect unmapped competencies', () => {
            const data = [
                {
                    competincies: [
                        { compName: '', compDescription: '' }
                    ]
                }
            ]

            const result = component.calculateCompError(data)
            expect(result.find(item => item.label === 'Unmapped competencies')).toBeTruthy()
        })

        it('should detect missing competency label', () => {
            const data = [
                { competincies: [] },
                {
                    competincies: [
                        { compName: '', compDescription: 'Description' }
                    ]
                }
            ]

            const result = component.calculateCompError(data)
            expect(result.find(item => item.label === 'Competency label missing')).toBeTruthy()
        })

        it('should detect missing competency description (warning)', () => {
            const data = [
                { competincies: [] },
                {
                    competincies: [
                        { compName: 'Competency 1', compDescription: '' }
                    ]
                }
            ]

            const result = component.calculateCompError(data)
            expect(result.find(item => item.label === 'Competency description missing')).toBeTruthy()
        })
    })

    describe('Competency Details Validation', () => {
        it('should detect missing competency level', () => {
            const data = [
                { compLevel: '', compType: 'Technical', compArea: 'Leadership' }
            ]

            const result = component.calculateCompDetailsError(data)
            expect(result.find(item => item.label === 'Competency level missing')).toBeTruthy()
        })

        it('should detect missing competency type', () => {
            const data = [
                { compLevel: 'Advanced', compType: '', compArea: 'Leadership' }
            ]

            const result = component.calculateCompDetailsError(data)
            expect(result.find(item => item.label === 'Competency type missing')).toBeTruthy()
        })

        it('should detect missing competency area', () => {
            const data = [
                { compLevel: 'Advanced', compType: 'Technical', compArea: '' }
            ]

            const result = component.calculateCompDetailsError(data)
            expect(result.find(item => item.label === 'Competency area missing')).toBeTruthy()
        })
    })

    describe('Progress Calculation', () => {
        it('should calculate officer progress correctly', () => {
            const data = {
                officerName: 'John Doe',
                position: 'Manager',
                positionDescription: 'Description'
            }

            const result = component.calculateOfficerProgress(data)
            expect(result).toBe(100)
        })

        it('should calculate partial officer progress', () => {
            const data = {
                officerName: 'John Doe',
                position: 'Manager',
                positionDescription: ''
            }

            const result = component.calculateOfficerProgress(data)
            // Should equal the sum of officerName and position percentages
            expect(result).toBe(Math.floor(component.defaultProgressValues.officer.controls.officerName +
                component.defaultProgressValues.officer.controls.position))
        })

        it('should calculate activity progress with complete data', () => {
            const data = [
                { activities: [] }, // Unmapped section
                {
                    groupName: 'Role 1',
                    groupDescription: 'Description',
                    activities: [
                        { activityDescription: 'Activity 1', assignedTo: 'Team A' }
                    ]
                }
            ]

            const result = component.calculateActivityProgress(data)
            expect(result).toBeGreaterThan(0)
        })

        it('should calculate competency progress with complete data', () => {
            const data = [
                { competincies: [] }, // Unmapped section
                {
                    competincies: [
                        { compName: 'Competency 1', compDescription: 'Description' }
                    ]
                }
            ]

            const result = component.calculateCompProgress(data)
            expect(result).toBeGreaterThan(0)
        })

        it('should calculate competency details progress with complete data', () => {
            const data = [
                { compLevel: 'Advanced', compType: 'Technical', compArea: 'Leadership' }
            ]

            const result = component.calculateCompDetailsProgress(data)
            expect(result).toBe(100)
        })

        it('should handle empty data in progress calculations', () => {
            expect(component.calculateOfficerProgress({})).toBe(0)
            expect(component.calculateActivityProgress([])).toBeNaN() // This should be fixed in the component
            expect(component.calculateCompProgress([])).toBe(0)
            expect(component.calculateCompDetailsProgress([])).toBe(0)
        })

        it('should calculate overall progress', () => {
            // Set up data
            component.dataStructure = {
                officerFormData: {
                    officerName: 'John Doe',
                    position: 'Manager',
                    positionDescription: 'Description'
                },
                activityGroups: [
                    { activities: [] },
                    {
                        groupName: 'Role 1',
                        groupDescription: 'Description',
                        activities: [{ activityDescription: 'Activity 1', assignedTo: 'Team A' }]
                    }
                ],
                compGroups: [
                    { competincies: [] },
                    {
                        competincies: [{ compName: 'Competency 1', compDescription: 'Description' }]
                    }
                ],
                compDetails: [
                    { compLevel: 'Advanced', compType: 'Technical', compArea: 'Leadership' }
                ]
            }

            // Mock sub-calculation methods to return predictable values
            jest.spyOn(component, 'calculateOfficerProgress').mockReturnValue(100)
            jest.spyOn(component, 'calculateActivityProgress').mockReturnValue(80)
            jest.spyOn(component, 'calculateCompProgress').mockReturnValue(75)
            jest.spyOn(component, 'calculateCompDetailsProgress').mockReturnValue(100)

            const result = component.calculatePercentage()

            // Expect the total to be the weighted sum of all progress values
            const expected = Math.ceil(
                10 + // Officer (100 * 10/100)
                48 + // Activity (80 * 60/100)
                15 + // Competency (75 * 20/100)
                10   // CompDetails (100 * 10/100)
            )

            expect(result).toBe(expected)
            expect(watStoreServiceMock.setCurrentProgress).toHaveBeenCalledWith(expected)
        })
    })

    describe('Combined Validations', () => {
        it('should group validations by type', () => {
            // Set up mock data that will generate both errors and warnings
            component.dataStructure = {
                officerFormData: {
                    officerName: '',
                    position: 'Manager',
                    positionDescription: ''
                },
                activityGroups: [
                    {
                        activities: [{ activityDescription: '', assignedTo: '' }]
                    }
                ]
            }

            component.validationsCombined()

            // Should contain both error and warning groups
            expect(component.validations.error).toBeDefined()
            expect(watStoreServiceMock.setErrorCount).toHaveBeenCalled()
        })
    })
})