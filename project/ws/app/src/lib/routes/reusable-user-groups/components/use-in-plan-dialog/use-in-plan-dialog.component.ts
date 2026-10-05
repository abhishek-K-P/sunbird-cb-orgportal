import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { PageEvent } from '@angular/material/paginator'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import moment from 'moment'
import { Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'
import { AparYearService } from '../../../../common/apar-year-select/apar-year.service'
import { TrainingPlanDashboardService } from '../../../home/services/training-plan-dashboard.service'
import { IUsableTrainingPlan, IUseInPlanDialogData } from '../../interface/reusable-user-groups.interface'

const DEFAULT_PAGE_SIZE = 5
const SEARCH_DEBOUNCE_MS = 300
const PLAN_STATUSES = ['draft']

@Component({
  selector: 'ws-app-use-in-plan-dialog',
  templateUrl: './use-in-plan-dialog.component.html',
  styleUrl: './use-in-plan-dialog.component.scss',
  standalone: false,
})
export class UseInPlanDialogComponent implements OnInit {

  private readonly dialogRef = inject(MatDialogRef<UseInPlanDialogComponent>)
  private readonly trainingPlanSvc = inject(TrainingPlanDashboardService)
  private readonly aparYearSvc = inject(AparYearService)
  private readonly configSvc = inject(ConfigurationsService)
  private readonly destroyRef = inject(DestroyRef)

  private readonly searchInput = new Subject<string>()

  readonly data: IUseInPlanDialogData = inject(MAT_DIALOG_DATA)

  readonly displayedColumns = ['select', 'reportingYear', 'timeline', 'title', 'status']

  readonly plans = signal<IUsableTrainingPlan[]>([])
  readonly totalCount = signal(0)
  readonly isLoading = signal(false)
  readonly searchKey = signal('')
  readonly reportingYear = signal(this.aparYearSvc.getCurrentAparYear())
  readonly pageIndex = signal(0)
  readonly pageSize = signal(DEFAULT_PAGE_SIZE)
  readonly selectedPlanId = signal<string | undefined>(undefined)

  ngOnInit() {
    this.searchInput
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(value => {
        this.searchKey.set(value)
        this.pageIndex.set(0)
        this.fetchPlans()
      })

    this.fetchPlans()
  }

  fetchPlans() {
    this.isLoading.set(true)
    this.trainingPlanSvc.getTrainingPlansV4(this.buildPayload())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res?.params?.status === 'success') {
            this.plans.set((res?.result?.result?.data ?? []).map((plan: any) => this.toPlan(plan)))
            this.totalCount.set(res?.result?.result?.totalCount ?? 0)
          } else {
            this.plans.set([])
            this.totalCount.set(0)
          }
          this.isLoading.set(false)
        },
        error: () => {
          this.plans.set([])
          this.totalCount.set(0)
          this.isLoading.set(false)
        },
      })
  }

  onSearch(value: string) {
    this.searchInput.next((value ?? '').trim())
  }

  onReportingYearChange(value: string) {
    this.reportingYear.set(value)
    this.pageIndex.set(0)
    this.fetchPlans()
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex)
    this.pageSize.set(event.pageSize)
    this.fetchPlans()
  }

  onSelectPlan(plan: IUsableTrainingPlan) {
    this.selectedPlanId.set(plan?.id)
  }

  onCancel() {
    this.dialogRef.close()
  }

  onUseInPlan() {
    const plan = this.plans().find(item => item.id === this.selectedPlanId())
    if (plan) {
      this.dialogRef.close(plan)
    }
  }

  private buildPayload(): any {
    const searchString = this.searchKey()
    const payload: any = {
      searchString,
      filter: {
        status: PLAN_STATUSES,
        orgIdList: [this.configSvc.userProfile?.rootOrgId],
      },
      pageNumber: this.pageIndex(),
      pageSize: this.pageSize(),
    }


    // MDO admins see only the plans they created
    if (this.configSvc.userRoles?.has('MDO_ADMIN')) {
      payload.filter.createdBy = this.configSvc.userProfile?.userId
    }

    if (this.reportingYear()) {
      payload.filter.planYear = this.reportingYear()
    }

    if (!searchString) {
      payload.orderBy = 'createdAt'
      payload.orderDirection = 'desc'
    }

    return payload
  }

  private toPlan(plan: any): IUsableTrainingPlan {
    return {
      id: plan?.id,
      reportingYear: plan?.planYear ?? '',
      timeline: plan?.endDate ? moment(plan.endDate).format('DD MMM[,] YYYY') : '',
      title: plan?.name ?? '',
      subtitle: [plan?.id, plan?.createdByName].filter(Boolean).join(' · '),
      status: plan?.status === 'draft' ? 'Draft' : plan?.status ?? '',
    }
  }
}
