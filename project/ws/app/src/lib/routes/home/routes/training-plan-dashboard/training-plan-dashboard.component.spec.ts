
import { ActivatedRoute, Router } from '@angular/router'
import { TrainingPlanDashboardService } from '../../services/training-plan-dashboard.service'
import { LoaderService } from '../../../../../../../../../src/app/services/loader.service'
import { TrainingPlanService } from '../../../training-plan/services/traininig-plan.service'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { TrainingPlanDashboardComponent } from './training-plan-dashboard.component'

describe('TrainingPlanDashboardComponent', () => {
    let component: TrainingPlanDashboardComponent

    const router: Partial<Router> = {}
    const activeRoute: Partial<ActivatedRoute> = {}
    const trainingDashboardSvc: Partial<TrainingPlanDashboardService> = {}
    const loaderService: Partial<LoaderService> = {}
    const trainingPlanService: Partial<TrainingPlanService> = {}
    const snackBar: Partial<MatSnackBar> = {}
    const dialog: Partial<MatDialog> = {}

    beforeAll(() => {
        component = new TrainingPlanDashboardComponent(
            router as Router,
            activeRoute as ActivatedRoute,
            trainingDashboardSvc as TrainingPlanDashboardService,
            loaderService as LoaderService,
            trainingPlanService as TrainingPlanService,
            snackBar as MatSnackBar,
            dialog as MatDialog
        )
    })

    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })
})