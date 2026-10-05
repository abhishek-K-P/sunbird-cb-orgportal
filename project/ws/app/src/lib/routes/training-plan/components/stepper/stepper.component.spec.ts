
import { DestroyRef } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Subject } from 'rxjs'
import { TrainingPlanDataSharingService } from '../../services/training-plan-data-share.service'
import { StepperComponent } from './stepper.component'

describe('StepperComponent', () => {
    let component: StepperComponent
    let route: any
    let tpdsSvc: any
    let destroyRef: any
    let accessControlRef: any

    const savedGroup = (overrides: any = {}) => ({
        userGroupId: 'ug-1',
        userGroupName: 'Section officers',
        userGroupCriteriaList: [{ criteriaKey: 'designation', criteriaValue: ['Section Officer'] }],
        ...overrides,
    })

    /** The access control step, reporting the groups it holds. */
    const withAccessControl = (groups: any[]) => {
        accessControlRef = {
            processRequestCreation: jest.fn().mockResolvedValue({ accessControl: { userGroups: groups } }),
            callSnackbar: jest.fn(),
            userGroup: { length: groups.length },
        }
        ;(component as any).accessControlRef = accessControlRef
    }

    const saveAndMoveOn = () => (component as any).saveAccessControlThenMoveOn()

    beforeEach(() => {
        jest.useFakeTimers()
        route = { snapshot: { data: {} } }
        tpdsSvc = {
            trainingPlanStepperData: {},
            saveAccessControlAndContinue: new Subject<void>(),
            getAccessControlUserGroupIds: jest.fn().mockReturnValue([]),
        }
        destroyRef = { onDestroy: jest.fn() }

        component = new StepperComponent(
            route as ActivatedRoute,
            tpdsSvc as TrainingPlanDataSharingService,
            destroyRef as DestroyRef
        )
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    describe('saveAccessControlThenMoveOn', () => {
        it('should do nothing while the access control step is not rendered', async () => {
            await saveAndMoveOn()

            expect(tpdsSvc.trainingPlanStepperData.accessControl).toBeUndefined()
            expect(component.tabIndexValue).toBe(0)
        })

        it('should ask for a condition when the step reports no groups', async () => {
            withAccessControl([])

            await saveAndMoveOn()

            expect(accessControlRef.callSnackbar).toHaveBeenCalledWith(
                'Please add at least one condition with a selection.', 'error')
            expect(component.tabIndexValue).toBe(0)
        })

        it('should ask for a condition when a group on the form is still incomplete', async () => {
            withAccessControl([savedGroup()])
            accessControlRef.userGroup = { length: 2 }

            await saveAndMoveOn()

            expect(accessControlRef.callSnackbar).toHaveBeenCalledWith(
                'Please add at least one condition with a selection.', 'error')
        })

        it('should name the group that has never been saved', async () => {
            withAccessControl([savedGroup({ userGroupId: '' })])

            await saveAndMoveOn()

            expect(accessControlRef.callSnackbar).toHaveBeenCalledWith(
                'Please save the user group "Section officers" before continuing.', 'error')
            expect(component.tabIndexValue).toBe(0)
        })

        it('should name every unsaved group', async () => {
            withAccessControl([
                savedGroup({ userGroupId: '', userGroupName: 'A' }),
                savedGroup({ userGroupId: '', userGroupName: 'B' }),
                savedGroup({ userGroupId: '', userGroupName: '' }),
            ])

            await saveAndMoveOn()

            expect(accessControlRef.callSnackbar).toHaveBeenCalledWith(
                'Please save the user groups "A", "B" and "User group 3" before continuing.', 'error')
        })

        it('should treat a saved group changed since its save as unsaved', async () => {
            ;(component as any).rememberSavedGroups([savedGroup()])
            withAccessControl([savedGroup({ userGroupName: 'Renamed officers' })])

            await saveAndMoveOn()

            expect(accessControlRef.callSnackbar).toHaveBeenCalledWith(
                'Please save the user group "Renamed officers" before continuing.', 'error')
        })

        /** Each group was saved from its own button, so the step only moves on, it never saves again. */
        it('should keep the saved groups and move to the timeline once every group is saved', async () => {
            const groups = [savedGroup(), savedGroup({ userGroupId: 'ug-2', userGroupName: 'Under secretaries' })]
            ;(component as any).rememberSavedGroups(groups)
            withAccessControl(groups)
            const emitted = jest.spyOn(component.addAccessSettingsIsInvalid, 'emit')

            await saveAndMoveOn()
            jest.runAllTimers()

            expect(accessControlRef.callSnackbar).not.toHaveBeenCalled()
            expect(component.tempSavedAccessControl).toEqual({ userGroups: groups, version: 1 })
            expect(tpdsSvc.trainingPlanStepperData.accessControl).toBe(component.tempSavedAccessControl)
            expect(component.addAccessSettingDisable).toBe(false)
            expect(component.addTimelineDisable).toBe(false)
            expect(component.tabIndexValue).toBe(3)
            expect(emitted).toHaveBeenCalledWith(false)
        })

        it('should keep the version the plan already carries', async () => {
            component.tempSavedAccessControl = { userGroups: [], version: 4 }
            withAccessControl([savedGroup()])

            await saveAndMoveOn()

            expect(component.tempSavedAccessControl.version).toBe(4)
        })

        it('should run when the plan asks to save and continue', async () => {
            component.ngOnInit()
            withAccessControl([savedGroup()])

            tpdsSvc.saveAccessControlAndContinue.next()
            await Promise.resolve()
            await Promise.resolve()

            expect(accessControlRef.processRequestCreation).toHaveBeenCalled()
            expect(component.tabIndexValue).toBe(3)
        })
    })
})
