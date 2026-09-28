import { Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { PageEvent } from '@angular/material/paginator'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Sort, SortDirection } from '@angular/material/sort'
import { MatTableDataSource } from '@angular/material/table'
import { ActivatedRoute, Router } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { Observable } from 'rxjs'
import { filter, switchMap, tap } from 'rxjs/operators'
// eslint-disable-next-line max-len
import { ConfirmDialogComponent } from '../../../workallocation-v2/components/confirm-dialog/confirm-dialog.component'
import { UseInPlanDialogComponent } from '../../components/use-in-plan-dialog/use-in-plan-dialog.component'
import {
  IRoleBanner,
  IUsableTrainingPlan,
  IUserGroup,
  IUserGroupAction,
  IUserGroupReach,
  IUserGroupResult,
  IUserGroupsConfig,
} from '../../interface/reusable-user-groups.interface'
import { ReusableUserGroupsService } from '../../services/reusable-user-groups.service'
import { canActOnGroup, isActionDisabled, isActionVisible, isGroupOwner, isRoleAllowed } from '../../utils/user-group-access'
import { SnackbarComponent } from '@sunbird-cb/consumption'

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_SORT_BY = 'updateddate'
const DEFAULT_SORT_ORDER: SortDirection = 'desc'

const CRITERIA_FILTER_KEYS: Record<string, string> = {
  rootOrgId: 'rootOrgId',
  user: 'identifier',
  group: 'profileDetails.professionalDetails.group',
  designation: 'profileDetails.professionalDetails.designation',
  profilestatus: 'profileDetails.profileStatus',
  Cadre: 'profileDetails.cadreDetails.cadreName',
  service: 'profileDetails.cadreDetails.civilServiceName',
  batch: 'profileDetails.cadreDetails.cadreBatch',
  isOnCentralDeputation: 'profileDetails.cadreDetails.isOnCentralDeputation',
}

@Component({
  selector: 'ws-app-user-groups-list',
  templateUrl: './user-groups-list.component.html',
  styleUrl: './user-groups-list.component.scss',
  standalone: false,
})
export class UserGroupsListComponent implements OnInit {

  private readonly route = inject(ActivatedRoute)
  private readonly configSvc = inject(ConfigurationsService)
  private readonly userGroupsSvc = inject(ReusableUserGroupsService)
  private readonly snackBar = inject(MatSnackBar)
  private readonly destroyRef = inject(DestroyRef)
  private readonly router = inject(Router)
  private readonly dialog = inject(MatDialog)

  private readonly userRoles = signal<Set<string>>(new Set<string>())
  private readonly userId = signal('')
  private readonly userOrgId = signal('')

  readonly config = signal<IUserGroupsConfig | undefined>(undefined)
  readonly dataSource = new MatTableDataSource<IUserGroup>([])
  readonly isLoading = signal(false)
  readonly groups = signal<IUserGroup[]>([])
  readonly totalCount = signal(0)
  readonly pageIndex = signal(0)
  readonly pageSize = signal(DEFAULT_PAGE_SIZE)
  readonly sortBy = signal(DEFAULT_SORT_BY)
  readonly sortOrder = signal<SortDirection>(DEFAULT_SORT_ORDER)
  readonly reachMap = signal<Record<string, IUserGroupReach>>({})
  readonly reachLoading = signal<Record<string, boolean>>({})

  readonly viewer = computed(() => ({ roles: this.userRoles(), userId: this.userId(), orgId: this.userOrgId() }))
  readonly displayedColumns = computed(() => (this.config()?.table?.columns ?? []).map(column => column.key))
  readonly canCreate = computed(() => this.isAllowed(this.config()?.createButton?.allowedRoles))
  readonly banner = computed<IRoleBanner | undefined>(() => {
    const roles = this.userRoles()
    const roleBanner = this.config()?.roleBanner
    const matched = (roleBanner?.roles ?? []).find(item => roles.has((item.role ?? '').toLowerCase()))
    return matched ?? roleBanner?.default
  })

  constructor() {
    effect(() => {
      this.dataSource.data = this.groups()
    })
  }

  ngOnInit() {
    this.config.set(this.route?.parent?.snapshot.data['pageData']?.data)
    this.userRoles.set(this.configSvc.userRoles ?? new Set<string>())
    this.userId.set(this.configSvc.userProfile?.userId ?? '')
    this.userOrgId.set(this.configSvc.userProfile?.rootOrgId ?? '')
    this.pageSize.set(this.config()?.table?.pageSize ?? DEFAULT_PAGE_SIZE)
    this.sortBy.set(this.config()?.search?.sortBy ?? DEFAULT_SORT_BY)
    this.sortOrder.set(this.config()?.search?.sortOrder ?? DEFAULT_SORT_ORDER)
    this.searchUserGroups()
  }

  isAllowed(allowedRoles?: string[]): boolean {
    return isRoleAllowed(allowedRoles, this.userRoles())
  }

  isOwner(group: IUserGroup): boolean {
    return isGroupOwner(group?.ownerId, this.userId())
  }

  rowActionsFor(group: IUserGroup): IUserGroupAction[] {
    return (this.config()?.table?.rowActions ?? [])
      .filter(action => isActionVisible(action, group, this.viewer()))
  }

  isDisabled(action: IUserGroupAction, group: IUserGroup): boolean {
    return isActionDisabled(action, group, this.viewer())
  }

  tooltipFor(action: IUserGroupAction, group: IUserGroup): string {
    return this.isDisabled(action, group) ? action?.disabledTooltip ?? '' : ''
  }

  canAct(action: IUserGroupAction, group: IUserGroup): boolean {
    return canActOnGroup(action, group, this.viewer())
  }

  conditionText(group: IUserGroup): string {
    const count = group?.conditionCount ?? 0
    const labels = this.config()?.table?.conditionLabel
    return `${count} ${count === 1 ? labels?.singular : labels?.plural}`
  }

  searchUserGroups() {
    this.isLoading.set(true)
    this.userGroupsSvc.searchUserGroups({
      filters: this.config()?.search?.filters ?? {},
      pageSize: this.pageSize(),
      pageNumber: this.pageIndex(),
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.groups.set((res?.result?.content ?? []).map(item => this.toUserGroup(item)))
          this.totalCount.set(res?.result?.count ?? 0)
          this.isLoading.set(false)
        },
        error: (err: any) => {
          this.groups.set([])
          this.totalCount.set(0)
          this.isLoading.set(false)
          this.callSnackbar(err?.error?.params?.errMsg ?? 'Unable to fetch user groups', 'error')
        },
      })
  }

  onSortChange(sort: Sort) {
    const column = (this.config()?.table?.columns ?? []).find(item => item.key === sort.active)
    this.sortBy.set(column?.sortField ?? this.config()?.search?.sortBy ?? DEFAULT_SORT_BY)
    this.sortOrder.set(sort.direction || this.config()?.search?.sortOrder || DEFAULT_SORT_ORDER)
    this.pageIndex.set(0)
    this.searchUserGroups()
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex)
    this.pageSize.set(event.pageSize)
    this.searchUserGroups()
  }

  onCheckReach(group: IUserGroup) {
    if (this.reachLoading()[group?.id]) {
      return
    }
    this.setReachLoading(group.id, true)

    this.userGroupsSvc.fetchUserCount(this.toUserSearchFilters(group))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          const count = res?.result?.response?.count ?? 0
          // Only this row is touched, a reach pulled for another group stays as it was
          this.reachMap.update(current => ({
            ...current,
            [group.id]: { count, checkedAt: new Date().toISOString() },
          }))
          this.setReachLoading(group.id, false)
        },
        error: (err: any) => {
          this.setReachLoading(group.id, false)
          this.callSnackbar(err?.error?.params?.errMsg ?? 'Unable to check the reach', 'error')
        },
      })
  }

  private setReachLoading(groupId: string, loading: boolean) {
    this.reachLoading.update(current => ({ ...current, [groupId]: loading }))
  }

  private toConditionPairs(entry: any): [string, any][] {
    if (!entry) {
      return []
    }
    if (entry.criteriaKey) {
      return [[entry.criteriaKey, entry.criteriaValue]]
    }
    return Object.keys(entry).map(key => [key, entry[key]] as [string, any])
  }

  private toUserSearchFilters(group: IUserGroup): Record<string, any> {
    const filters: Record<string, any> = {}
    const criteria = group?.criteria ?? []

    criteria.forEach(entry => {
      this.toConditionPairs(entry).forEach(([criteriaKey, values]) => {
        const filterKey = CRITERIA_FILTER_KEYS[criteriaKey]
        if (!filterKey || !Array.isArray(values) || !values.length) {
          return
        }
        // Central deputation is a single flag, every other condition is a list of selections
        filters[filterKey] = criteriaKey === 'isOnCentralDeputation' ? values[0] : values
      })
    })

    // The count stays inside the logged in organisation unless the group names its own
    if (!filters['rootOrgId']?.length && this.configSvc.userProfile?.rootOrgId) {
      filters['rootOrgId'] = [this.configSvc.userProfile.rootOrgId]
    }

    if (Object.keys(filters).length) {
      filters['status'] = 1
    }

    return filters
  }

  onCreate() {
    this.router.navigate(['user-groups'], { relativeTo: this.route.parent })
  }

  onRowAction(action: IUserGroupAction, group: IUserGroup) {
    // The row may have been drawn before the roles landed, so the guard is repeated on the click
    if (!this.canAct(action, group)) {
      return
    }
    switch (action.key) {
      case 'edit':
        this.router.navigate(['user-groups', group.id], { relativeTo: this.route.parent })
        break
      case 'copy':
        this.copyUserGroup(group)
        break
      case 'use':
        this.useInPlan(group)
        break
      case 'delete':
        this.deleteUserGroup(group)
        break
      default:
        break
    }
  }

  private toUserGroup(result: IUserGroupResult): IUserGroup {
    const criteria = result?.criteria ?? []
    return {
      id: result?.usergroupid,
      name: result?.usergroupname,
      criteria,
      conditionCount: criteria.length,
      owner: result?.createdByName ?? '',
      ownerId: result?.createdby ?? '',
      orgId: result?.orgid ?? '',
      status: result?.status,
      updatedOn: result?.updateddate,
    }
  }

  copyUserGroup(group: IUserGroup): void {
    this.confirm(`Are you sure you want to copy "${group.name}"?`)
      .pipe(
        filter(confirmed => !!confirmed),
        tap(() => this.isLoading.set(true)),
        switchMap(() => this.userGroupsSvc.fetchUserGroup(group.id)),
        switchMap(res => this.userGroupsSvc.createUserGroup({
          userGroupName: `${res?.result?.usergroupname ?? group.name} Copy`,
          criteria: res?.result?.criteria ?? [],
        })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: res => {
          this.callSnackbar(`${res?.result?.usergroupname ?? group.name} created`, 'success')
          this.searchUserGroups()
        },
        error: (err: any) => {
          this.isLoading.set(false)
          this.callSnackbar(err?.error?.params?.errMsg ?? 'Unable to copy the user group', 'error')
        },
      })
  }

  deleteUserGroup(group: IUserGroup): void {
    this.confirm(`Are you sure you want to delete "${group.name}"?`)
      .pipe(
        filter(confirmed => !!confirmed),
        tap(() => this.isLoading.set(true)),
        switchMap(() => this.userGroupsSvc.deleteUserGroup(group.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: res => {
          this.callSnackbar(res?.result?.response ?? `${group.name} deleted`, 'success')
          // The last row of a page has gone, so step back rather than land on a page that no longer exists
          if (this.groups().length === 1 && this.pageIndex() > 0) {
            this.pageIndex.update(index => index - 1)
          }
          this.searchUserGroups()
        },
        error: (err: any) => {
          this.isLoading.set(false)
          this.callSnackbar(err?.error?.params?.errMsg || err?.error?.params?.err || 'Unable to delete the user group', 'error')
        },
      })
  }

  useInPlan(group: IUserGroup): void {
    this.dialog.open(UseInPlanDialogComponent, {
      width: '1055px',
      maxWidth: '95vw',
      autoFocus: false,
      data: { groupId: group.id, groupName: group.name },
      panelClass: 'remove-padding',
    })
      .afterClosed()
      .pipe(
        filter(plan => !!plan),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((plan: IUsableTrainingPlan) => {
        this.router.navigate(['app', 'training-plan', 'update-plan', plan.id], {
          queryParams: { userGroupId: group.id },
        })
      })
  }

  private confirm(message: string): Observable<any> {
    return this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      minHeight: '210px',
      height: 'auto',
      autoFocus: false,
      data: {
        message,
        dialogType: 'warning',
        icon: { iconName: 'error_outline', iconClass: 'warning-icon' },
        buttonsList: [
          { btnAction: false, displayText: 'No', btnClass: 'btn-outline-primary' },
          { btnAction: true, displayText: 'Yes', btnClass: 'successBtn' },
        ],
      },
      panelClass: 'remove-padding',
    }).afterClosed()
  }

  callSnackbar(message: string, type: 'success' | 'error'): void {
    if (type === 'success') {
      this.snackBar.openFromComponent(SnackbarComponent, {
        data: { message, type: 'success' },
        duration: 3000,
        panelClass: 'course-success-snackbar',
      })
    } else if (type === 'error') {
      this.snackBar.openFromComponent(SnackbarComponent, {
        data: { message, type: 'error' },
        duration: 3000,
        panelClass: 'course-error-snackbar',
      })
    }
  }
}
