import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { of } from 'rxjs'
import { AparYearService } from '../../../../common/apar-year-select/apar-year.service'
import { TrainingPlanDashboardService } from '../../../home/services/training-plan-dashboard.service'
import { UseInPlanDialogComponent } from './use-in-plan-dialog.component'

const searchResponse = {
  params: { status: 'success' },
  result: {
    result: {
      totalCount: 1,
      data: [
        {
          id: 'P-2603',
          name: 'APAR 2026-27 — Bihar Administrative Service',
          planYear: '2026-27',
          endDate: '2027-03-31T00:00:00.000Z',
          status: 'draft',
          createdByName: 'General Administration Dept.',
        },
      ],
    },
  },
}

describe('UseInPlanDialogComponent', () => {
  let component: UseInPlanDialogComponent
  let fixture: ComponentFixture<UseInPlanDialogComponent>
  let getTrainingPlansV4: jest.Mock
  let close: jest.Mock

  const createComponent = () => {
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({
      declarations: [UseInPlanDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: MatDialogRef, useValue: { close } },
        { provide: MAT_DIALOG_DATA, useValue: { groupId: 'g1', groupName: 'DS & above' } },
        { provide: TrainingPlanDashboardService, useValue: { getTrainingPlansV4 } },
        { provide: AparYearService, useValue: { getCurrentAparYear: () => '2026-27' } },
        { provide: ConfigurationsService, useValue: { userProfile: { rootOrgId: 'org-1', userId: 'user-1' } } },
      ],
    })
    fixture = TestBed.createComponent(UseInPlanDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(() => {
    close = jest.fn()
    getTrainingPlansV4 = jest.fn(() => of(searchResponse))
    createComponent()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should search the draft plans of the logged in org on open', () => {
    expect(getTrainingPlansV4).toHaveBeenCalledWith({
      filter: { status: ['draft'], orgIdList: ['org-1'], createdBy: 'user-1', planYear: '2026-27' },
      pageNumber: 0,
      pageSize: 5,
      searchString: '',
      orderBy: 'createdAt',
      orderDirection: 'desc',
    })
  })

  it('should map the response onto the table rows', () => {
    expect(component.plans()).toEqual([
      {
        id: 'P-2603',
        reportingYear: '2026-27',
        timeline: '31 Mar, 2027',
        title: 'APAR 2026-27 — Bihar Administrative Service',
        subtitle: 'P-2603 · General Administration Dept.',
        status: 'Draft',
      },
    ])
    expect(component.totalCount()).toBe(1)
  })

  it('should open on the running apar year', () => {
    expect(component.reportingYear()).toBe('2026-27')
  })

  it('should filter by reporting year and go back to the first page', () => {
    component.onPageChange({ pageIndex: 1, pageSize: 5, length: 1 })
    component.onReportingYearChange('2025-26')
    expect(component.pageIndex()).toBe(0)
    expect(getTrainingPlansV4).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filter: { status: ['draft'], orgIdList: ['org-1'], createdBy: 'user-1', planYear: '2025-26' },
      }),
    )
  })

  it('should request the next page', () => {
    component.onPageChange({ pageIndex: 1, pageSize: 10, length: 20 })
    expect(getTrainingPlansV4).toHaveBeenLastCalledWith(
      expect.objectContaining({ pageNumber: 1, pageSize: 10 }),
    )
  })

  it('should clear the rows when the search fails', () => {
    getTrainingPlansV4 = jest.fn(() => of({ params: { status: 'failed' } }))
    createComponent()
    expect(component.plans()).toEqual([])
    expect(component.totalCount()).toBe(0)
    expect(component.isLoading()).toBe(false)
  })

  it('should close with the selected plan', () => {
    component.onSelectPlan(component.plans()[0])
    component.onUseInPlan()
    expect(close).toHaveBeenCalledWith(component.plans()[0])
  })

  it('should not close while no plan is selected', () => {
    component.onUseInPlan()
    expect(close).not.toHaveBeenCalled()
  })

  it('should close with nothing on cancel', () => {
    component.onCancel()
    expect(close).toHaveBeenCalledWith()
  })
})
