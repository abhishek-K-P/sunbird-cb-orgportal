import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TrainingPlanDashboardService } from '../../services/training-plan-dashboard.service'
import moment from 'moment'
import { LoaderService } from '../../../../../../../../../src/app/services/loader.service'
import { TrainingPlanService } from '../../../training-plan/services/traininig-plan.service'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ConfirmationBoxComponent } from '../../../training-plan/components/confirmation-box/confirmation.box.component'
import { MatTableDataSource } from '@angular/material/table'
import { MatSort } from '@angular/material/sort'
import { MatPaginator } from '@angular/material/paginator'
import { AparYearService } from '../../../../common/apar-year-select/apar-year.service'
import _ from 'lodash'

@Component({
  selector: 'ws-app-training-plan-dashboard',
  templateUrl: './training-plan-dashboard.component.html',
  styleUrls: ['./training-plan-dashboard.component.scss'],
  standalone: false
})
export class TrainingPlanDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort, { static: false }) sort!: MatSort
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator

  // Component Properties
  currentFilter = 'Live'
  pageIndex = 0
  limit = 20
  searchQuery = ''

  // Data Properties
  trainingPlanData: any = []
  fetchContentDone = false
  completeDataRes: any = []
  totalTrainingPlanCount = 0
  dataSource = new MatTableDataSource<any>([])

  // APAR Year Properties
  selectedAparYear = ''

  // UI Properties
  displayedColumns: string[] = ['name', 'contentCount', 'contentType', 'endDate', 'planType', 'createdByName', 'createdAt', 'actions']
  cachedActions: { [key: string]: any[] } = {}
  currentRowActions: any[] = []

  // Config Properties
  configSvc: any
  pageConfig: any
  currentUser: any
  urlQueryParams: any
  dialogRef: any
  tabledata!: any

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private trainingDashboardSvc: TrainingPlanDashboardService,
    private loaderService: LoaderService,
    private trainingPlanService: TrainingPlanService,
    private snackBar: MatSnackBar,
    private aparYearSvc: AparYearService,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.initializeConfig()
    this.selectedAparYear = this.aparYearSvc.getCurrentAparYear()
    this.setupRouteSubscription()
    this.hasAccess()
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort
  }

  // Initialization Methods
  private initializeConfig() {
    this.configSvc = this.activeRoute.snapshot.data['configService']
    this.currentUser = this.configSvc.userProfileV2?.userId
    this.pageConfig = this.activeRoute.snapshot.data['pageData']
  }

  private setupRouteSubscription() {
    this.activeRoute.queryParams.subscribe((res: any) => {
      this.urlQueryParams = res
      if (Object.keys(this.urlQueryParams).length) {
        this.currentFilter = this.urlQueryParams.type
      }
      this.filter(this.currentFilter)
    })
  }

  // Filter and Search Methods
  filter(filter: string) {
    this.cachedActions = {}
    this.currentFilter = filter
    this.searchQuery = ''
    this.filterData('')
  }

  filterData(searchString: string) {
    this.limit = 20
    this.pageIndex = 0
    this.searchQuery = searchString
    this.getTrainingPlanCBP(this.currentFilter, searchString)
  }

  searchTrainingPlan(searchString: string) {
    this.pageIndex = 0
    this.filterData(searchString.trim())
  }

  changeAparYear(aparYear: string) {
    if (this.selectedAparYear === aparYear) {
      return
    }
    this.selectedAparYear = aparYear
    this.filterData(this.searchQuery)
  }

  // API Methods
  async getTrainingPlanCBP(type: string, searchString: string) {
    this.loaderService.changeLoaderState(true)
    // The rows are emptied before the call, so the loading flag has to go down with them:
    // left up, the emptied table reads as a finished fetch and the no-data message shows
    // until the response lands. Set here rather than in the callers so searching, paging
    // and changing the year all show the spinner the way switching tab does.
    this.fetchContentDone = false
    this.completeDataRes = []
    this.trainingPlanData = []
    this.totalTrainingPlanCount = 0
    this.dataSource.data = []

    const payload: any = {
      filter: {
        status: [type],
        orgIdList: [this.configSvc.userProfile.rootOrgId]
      },
      pageNumber: this.pageIndex,
      pageSize: this.limit,
      searchString: searchString,
        "applyOrgIdFilter": true
    }

    if (this.selectedAparYear) {
      payload.filter.planYear = this.selectedAparYear
    }

    if (!searchString) {
      payload.orderBy = "createdAt"
      payload.orderDirection = "desc"
    }

    this.trainingDashboardSvc.getTrainingPlansV4(payload).subscribe({
      next: (response: any) => {
        if (response.params?.status === 'success') {
          this.completeDataRes = response?.result?.result?.data || []
          this.trainingPlanData = this.completeDataRes
          this.totalTrainingPlanCount = response?.result?.result?.totalCount || 0
          this.convertDataAsPerTable()
        } else {
          this.loaderService.changeLoaderState(false)
          this.fetchContentDone = true
        }
      },
      error: () => {
        this.loaderService.changeLoaderState(false)
        this.fetchContentDone = true
      }
    })
  }

  // Data Processing Methods
  convertDataAsPerTable() {
    this.cachedActions = {}

    this.completeDataRes.forEach((res: any) => {
      res.contentCount = res?.contentList?.length || 0
      res.endDate = res?.endDate ? moment(res.endDate).format('MMM DD[,] YYYY') : ''
      res.createdAt = res?.createdAt ? moment(res.createdAt).format('MMM DD[,] YYYY') : ''
      res.createdByName = res?.createdBy === this.currentUser ? 'You' : res?.createdByName
      res.planType = res?.isApar ? 'APAR' : 'Non-APAR'

      // Add sortable date values
      res.endDateSort = res?.endDate ? moment(res.endDate, 'MMM DD, YYYY').valueOf() : 0
      res.createdAtSort = res?.createdAt ? moment(res.createdAt, 'MMM DD, YYYY').valueOf() : 0

      // Add competencies if needed
      const compyData: any = []
      if (res?.contentList && res.contentList.length > 0) {
        res.contentList.forEach((contentEle: any) => {
          if (contentEle?.competencies_v5?.length > 0) {
            contentEle.competencies_v5.forEach((compeEle: any) => {
              compyData.push(compeEle.competencyArea)
            })
          }
        })
        res.competencies = _.uniq(compyData)
      }
    })

    this.dataSource = new MatTableDataSource(this.completeDataRes)
    this.setupTableSorting()
    this.fetchContentDone = true
    this.loaderService.changeLoaderState(false)
  }

  private setupTableSorting() {
    setTimeout(() => {
      this.dataSource.sort = this.sort
      this.dataSource.sortingDataAccessor = (item, property) => {
        switch (property) {
          case 'endDate': return item.endDateSort
          case 'createdAt': return item.createdAtSort
          case 'contentCount': return Number(item.contentCount) || 0
          case 'name': return item.name?.toLowerCase() || ''
          default: return item[property]?.toLowerCase() || item[property] || ''
        }
      }
    }, 0)
  }

  // Action Menu Methods
  prepareActions(element: any) {
    this.currentRowActions = this.getAvailableActions(element)
  }

  getAvailableActions(element: any): any[] {
    const cacheKey = `${element.id}_${element.createdBy}_${this.currentFilter}`

    if (this.cachedActions[cacheKey]) {
      return this.cachedActions[cacheKey]
    }

    if (!this.pageConfig?.data?.actionMenu) {
      const fallbackActions = [
        { key: 'preivewContent', name: 'Preview', icon: 'visibility', userAccess: true },
        { key: 'editContent', name: 'Edit', icon: 'edit', userAccess: true },
        { key: 'deleteContent', name: 'Delete', icon: 'delete', userAccess: true },
        { key: 'publishContent', name: 'Publish', icon: 'publish', userAccess: this.currentFilter === 'draft' }
      ].filter(action => action.userAccess)

      this.cachedActions[cacheKey] = fallbackActions
      return fallbackActions
    }

    const availableActions: any[] = []
    const isOwner = element.createdBy === this.currentUser
    const isDraft = this.currentFilter === 'draft'

    this.pageConfig.data.actionMenu.forEach((_v: any) => {
      let flag = false
      let hasAccess = false

      // Check user roles
      _v.enabledFor.forEach((role: any) => {
        if (this.configSvc.userRoles.has(role)) {
          flag = true
          if (role === 'mdo_leader') _v.isMdoLeader = true
          if (role === 'mdo_admin') _v.isMdoAdmin = true
        }
      })

      if (!flag) return

      // Apply business logic
      switch (_v.key) {
        case 'preivewContent':
          hasAccess = true
          break
        case 'editContent':
        case 'deleteContent':
          hasAccess = _v.isMdoLeader && element?.status !== 'RETIRE' ? true : isOwner && element?.status !== 'RETIRE' ? true : false
          break
        case 'publishContent':
          hasAccess = isDraft ? _v.isMdoLeader ? true : isOwner : false
          break
        default:
          hasAccess = flag
      }

      if (hasAccess) {
        availableActions.push({
          ..._v,
          userAccess: true,
          icon: this.getActionIcon(_v.key),
          displayName: _v.name || _v.displayName
        })
      }
    })

    this.cachedActions[cacheKey] = availableActions
    return availableActions
  }

  getActionIcon(actionKey: string): string {
    const iconMap: { [key: string]: string } = {
      'preivewContent': 'visibility',
      'editContent': 'edit',
      'deleteContent': 'delete',
      'publishContent': 'publish'
    }
    return iconMap[actionKey] || 'more_horiz'
  }

  // Menu Action Handlers
  menuSelected(event: any) {
    this.currentRowActions = []

    switch (event.action) {
      case 'preivewContent':
        this.previewData(event.row)
        break
      case 'editContent':
        this.editContentData(event.row)
        break
      case 'deleteContent':
      case 'publishContent':
        this.showConformationModal(event.row, event.action)
        break
    }
  }

  previewData(selectedRow: any) {
    this.router.navigate(['app', 'training-plan', 'preview-plan-for-dashboard', selectedRow.id])
  }

  editContentData(selectedRow: any) {
    this.router.navigate(['app', 'training-plan', 'update-plan', selectedRow.id])
  }

  showConformationModal(selectedRow: any, type: any) {
    const isDelete = type === 'deleteContent'
    this.dialogRef = this.dialog.open(ConfirmationBoxComponent, {
      disableClose: true,
      data: {
        type: 'conformation',
        icon: 'radio_on',
        title: isDelete ? 'Are you sure you want to delete the plan?' : 'Are you sure you want to publish the plan?',
        subTitle: "You won't be able to revert this",
        primaryAction: 'Confirm',
        secondaryAction: 'Cancel',
      },
      autoFocus: false,
    })

    this.dialogRef.afterClosed().subscribe((res: any) => {
      if (res === 'confirmed') {
        if (isDelete) {
          this.deleteContentData(selectedRow)
        } else {
          this.publishContentData(selectedRow)
        }
      }
    })
  }

  deleteContentData(selectedRow: any) {
    this.loaderService.changeLoaderState(true)
    const obj = {
      request: {
        id: selectedRow.id,
        comment: 'Content deleted',
      },
    }

    this.trainingPlanService.archivePlanV4(obj).subscribe({
      next: () => {
        this.snackBar.open('CBP plan deleted successfully.')
        this.loaderService.changeLoaderState(false)
        this.tabNavigate('RETIRE', selectedRow.userType)
      },
      error: () => {
        this.loaderService.changeLoaderState(false)
      }
    })
  }

  publishContentData(selectedRow: any) {
    this.loaderService.changeLoaderState(true)
    const obj = {
      request: {
        id: selectedRow.id,
        comment: 'CBP plan approved',
      },
    }

    this.trainingPlanService.publishPlanV4(obj).subscribe({
      next: (data: any) => {
        if (data?.params?.status?.toLowerCase() === 'success') {
          this.snackBar.open('CBP plan published successfully.')
          this.loaderService.changeLoaderState(false)
          this.tabNavigate('Live', selectedRow.userType)
        } else {
          this.snackBar.open('Something went wrong while publishing CBP plan. Try again later')
          this.loaderService.changeLoaderState(false)
        }
      },
      error: () => {
        this.snackBar.open('Something went wrong while publishing CBP plan. Try again later')
        this.loaderService.changeLoaderState(false)
      }
    })
  }

  // Navigation and Utility Methods
  createCbp() {
    if (!this.selectedAparYear) {
      this.snackBar.open('Please select an APAR year to continue.')
      return
    }
    // The year is carried over only when a plan can be set to it. A closed year is filterable
    // here but not authorable, so the stepper is left to fall back to the current year
    if (!this.aparYearSvc.isAparYearEditable(this.selectedAparYear)) {
      this.router.navigate(['app', 'training-plan', 'create-plan'])
      return
    }
    this.router.navigate(['app', 'training-plan', 'create-plan'], {
      queryParams: { aparYear: this.selectedAparYear }
    })
  }

  tabNavigate(item: any, tabSelected?: any) {
    this.searchQuery = ''
    this.router.navigate(['app', 'home', 'training-plan-dashboard'], {
      queryParams: { type: item, tabSelected }
    })
  }

  onPaginateChange(pageData: any) {
    this.pageIndex = pageData?.pageIndex || 0
    this.limit = pageData?.pageSize || 20
    this.getTrainingPlanCBP(this.currentFilter, this.searchQuery)
  }

  onSortChange(event: any) {
    console.log('Sort changed:', event)
  }

  trackByActionKey(_index: number, action: any): any {
    return action.key
  }

  hasAccess() {
    if (this.pageConfig?.data?.actionMenu) {
      this.pageConfig.data.actionMenu.forEach((_v: any) => {
        let flag = false
        _v.enabledFor.forEach((ele: any) => {
          if (this.configSvc.userRoles.has(ele)) {
            flag = true
            if (ele === 'mdo_leader') _v.isMdoLeader = true
            if (ele === 'mdo_admin') _v.isMdoAdmin = true
          }
        })
        _v.userAccess = flag
      })
    }
  }

  public tabTelemetry(_label: string, _index: number) {
    // Telemetry implementation if needed
  }
}
