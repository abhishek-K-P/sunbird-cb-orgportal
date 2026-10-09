import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core'
import { UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms'
import { MomentDateAdapter } from '@angular/material-moment-adapter'
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core'
import { MatCheckboxChange } from '@angular/material/checkbox'
import { MatChipInputEvent } from '@angular/material/chips'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { HttpErrorResponse } from '@angular/common/http'
import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged, map, startWith, switchMap, takeUntil } from 'rxjs/operators'
/* tslint:disable */
import * as _ from 'lodash'
/* tslint:enable */
import { UsersService } from '../../../../users/services/users.service'
import { BP_TRAINER_ROLE, RolesService, toBpCoTrainerCode } from '../../../../users/services/roles.service'
import { ActivatedRoute } from '@angular/router'

export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'DD-MM-YYYY',
    monthYearLabel: 'YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY',
  },
}

// const EMAIL_PATTERN = /^[a-zA-Z0-9](\.?[a-zA-Z0-9_]+)*@[a-zA-Z0-9]*.[a-zA-Z]{2,}$/
// const EMAIL_PATTERN = /^[a-zA-Z0-9]+[a-zA-Z0-9._-]*[a-zA-Z0-9]+@[a-zA-Z0-9]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,4}$/
const EMAIL_PATTERN = /^[a-zA-Z0-9]+[a-zA-Z0-9._-]*[a-zA-Z0-9]+@[a-zA-Z0-9]+([-a-zA-Z0-9]*[a-zA-Z0-9]+)?(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,4}$/
const MOBILE_PATTERN = /^[0]?[6789]\d{9}$/
const PIN_CODE_PATTERN = /^[1-9][0-9]{5}$/

@Component({
  selector: 'ws-single-user-creation',
  templateUrl: './single-user-creation.component.html',
  styleUrls: ['./single-user-creation.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  standalone: false
})
export class SingleUserCreationComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() selectedOrgData: any
  @Input() editUserData: any
  @Input() isNgo: boolean = false
  @Output() userCreated = new EventEmitter<any>()

  @ViewChildren('rolesCheckbox') checkboxes!: QueryList<ElementRef>
  @ViewChild('updateconfirm') updateConfirmTemplate!: TemplateRef<any>
  defaultRole = ['PUBLIC']
  defaultNgoDesignation = 'Volunteer'
  private destroySubject$ = new Subject()
  separatorKeysCodes: number[] = [ENTER, COMMA]
  masterData: any = {}
  rolesArr: string[] = []
  fullProfile: any
  namePatern = `^[a-zA-Z\\s\\']{1,50}$`

  designationListLoadCount = 50
  designationDefaultLoadCount = 50
  isLoadingMoreDesignations = false;
  desigantionFilterEnable = false
  designationOffset = 0
  odcsDesignationCount = 0
  defaultSearchDesignationCount = 0
  // Guard to avoid continuous legacy API calls when there is no more data
  noMoreLegacyDesignations = false

  displayLoader = false
  isMdoLeader = false
  isMoAdmin = false
  orgHasDesignations = false
  designationSearchText = ''

  filteredRoles: string[] = []
  readonly bpTrainerRole = BP_TRAINER_ROLE
  bpCoTrainerRoles: { roleId: number, roleName: string, roleCode: string }[] = []
  isLoadingBpCoTrainerRoles = false
  // emailRegix = `^[\\w\-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$`
  userCreationForm = this.formBuilder.group({
    email: new UntypedFormControl('', [Validators.required, Validators.pattern(EMAIL_PATTERN)]),
    firstName: new UntypedFormControl('', [Validators.required, Validators.pattern(this.namePatern)]),
    phone: new UntypedFormControl('', [Validators.required, Validators.pattern(MOBILE_PATTERN), Validators.minLength(10)]),
    channel: new UntypedFormControl(''),
    designation: new UntypedFormControl('', [Validators.required]),
    group: new UntypedFormControl('', [Validators.required]),
    dob: new UntypedFormControl(''),
    domicileMedium: new UntypedFormControl(''),
    gender: new UntypedFormControl(''),
    pincode: new UntypedFormControl('', [Validators.pattern(PIN_CODE_PATTERN)]),
    category: new UntypedFormControl(''),
    tags: new UntypedFormControl([]),
    roles: new UntypedFormControl([], [Validators.required]),
    // required only while BP_PROGRAM_TRAINER is selected, see updateBpCoTrainerRoleState()
    bpCoTrainerRole: new UntypedFormControl(''),
    searchDesignation: new UntypedFormControl('', [])
  })
  today = new Date()

  constructor(
    private formBuilder: UntypedFormBuilder,
    private usersService: UsersService,
    private matSnackBar: MatSnackBar,
    private rolesService: RolesService,
    private activatedRouter: ActivatedRoute,
    private dialog: MatDialog,
  ) {

    this.fullProfile = _.get(this.activatedRouter.snapshot, 'data.configService')

    if (this.userCreationForm.get('searchDesignation')) {
      // tslint:disable-next-line
      this.userCreationForm.get('searchDesignation')!.valueChanges
        .pipe(
          debounceTime(100),
          distinctUntilChanged(),
          startWith(''),
        )
        .subscribe(res => {
          const txt = res?.toString()?.trim() ?? ''
          if (txt?.length) {
            this.desigantionFilterEnable = true
            // If org has IGOT designations, call the IGOT API; otherwise filter from local backup
            if (this.orgHasDesignations) {
              this.isLoadingMoreDesignations = true
              this.getIgotDesignations(txt)
            } else if (this.masterData && this.masterData.designationBackup) {
              this.masterData.designation = this.masterData.designationBackup.filter((item: any) =>
                item.name.toLowerCase().includes(txt.toLowerCase()))
            }
          } else {
            if (this.masterData && this.masterData.designationBackup) {
              this.masterData.designation = this.masterData.designationBackup.slice(0, this.designationDefaultLoadCount)
              this.desigantionFilterEnable = false
              this.checkCurrentDesignationPresent()
            }
          }
        })
    }

    if (this.userCreationForm.get('domicileMedium')) {
      // tslint:disable-next-line
      this.userCreationForm.get('domicileMedium')!.valueChanges
        .pipe(
          debounceTime(100),
          distinctUntilChanged(),
          startWith(''),
        )
        .subscribe(res => {
          if (this.masterData && this.masterData.language) {
            this.masterData.language = this.masterData.languageBackup.filter((item: any) =>
              item.name.toLowerCase().includes(res && res.toLowerCase()))
          }
        })
    }
  }

  ngOnInit() {
    if (this.selectedOrgData && this.selectedOrgData.roleId && !this.userCreationForm.contains('department') && !this.isNgo) {
      this.userCreationForm.addControl('department', new UntypedFormControl({ value: this.selectedOrgData.depatName, disabled: true }))
      if (this.editUserData) {
        this.assignData()
      }
    }

    // Remove validators for designation and group if isNgo is true
    if (this.isNgo) {
      this.userCreationForm.get('designation')?.clearValidators()
      this.userCreationForm.get('designation')?.updateValueAndValidity()
      this.userCreationForm.get('group')?.clearValidators()
      this.userCreationForm.get('group')?.updateValueAndValidity()
      if (!this.userCreationForm.contains('externalId')) {
        this.userCreationForm.addControl('externalId', new UntypedFormControl(''))
      }
      if (this.editUserData) {
        this.assignData()
      }
    } else {
      // Only load designation and group data if not NGO
      this.checkOrgHasDesignations()
      this.getGroups()
    }

    this.getMasterLanguages()
    this.getOrgRolesList()
    const fullProfile = _.get(this.activatedRouter?.snapshot, 'data.configService')
    if (fullProfile?.unMappedUser && fullProfile?.unMappedUser?.roles) {
      this.isMdoLeader = fullProfile?.unMappedUser?.roles.includes('MDO_LEADER')
      this.isMoAdmin = fullProfile?.unMappedUser?.roles.includes('MDO_ADMIN')
    }
  }

  ngAfterViewInit(): void {
    this.setDefaultValue()

  }

  assignData() {
    Object.keys(this.userCreationForm.controls).forEach((ele: any) => {
      switch (ele) {
        case 'designation':
        case 'group':
          this.userCreationForm.get(ele)?.patchValue(this.editUserData?.profileDetails?.professionalDetails?.[0]?.[ele] || '')
          break
        case 'tags':
          this.userCreationForm.get(ele)?.patchValue(this.editUserData?.profileDetails?.additionalProperties?.tag || [])
          break
        case 'externalId':
          this.userCreationForm.get(ele)?.patchValue(this.editUserData?.profileDetails?.additionalProperties?.externalSystemId || '')
          break
        case 'pincode':
          this.userCreationForm.get(ele)?.patchValue(
            this.isNgo
              ? (this.editUserData?.profileDetails?.personalDetails?.pinCode
                || this.editUserData?.profileDetails?.employmentDetails?.pinCode || '')
              : (this.editUserData?.profileDetails?.employmentDetails?.pinCode || ''))
          break
        case 'roles':
          this.userCreationForm.get(ele)?.patchValue(this.editUserData?.[ele] || [])
          break
        case 'email':
          this.userCreationForm.get(ele)?.patchValue(this.editUserData?.profileDetails?.personalDetails?.primaryEmail || '')
          break
        case 'phone':
          this.userCreationForm.get(ele)?.patchValue(this.editUserData?.profileDetails?.personalDetails?.mobile || '')
          break
        case 'firstName':
          this.userCreationForm.get(ele)?.patchValue(this.editUserData?.profileDetails?.personalDetails?.firstname || '')
          break
        case 'dob':
          this.userCreationForm.get(ele)?.patchValue(this.getDateFromText(this.editUserData?.profileDetails?.personalDetails?.[ele]) || '')
          break
        case 'category':
        case 'domicileMedium':
        case 'gender':
          this.userCreationForm.get(ele)?.patchValue(this.editUserData?.profileDetails?.personalDetails?.[ele] || '')
          break
        case 'bpCoTrainerRole':
          this.userCreationForm.get(ele)?.patchValue(toBpCoTrainerCode(this.editUserData?.profileDetails?.bpCoTrainer))
          break
      }
    })
    this.updateBpCoTrainerRoleState()
  }
  designationSearch(evt: any) {
    const searchText = evt?.target?.value
    const txt = (searchText || '').toString().trim()
    this.designationSearchText = txt
    if (txt?.length) {
      this.desigantionFilterEnable = true
      this.isLoadingMoreDesignations = true
      if (this.orgHasDesignations) {
        this.getIgotDesignations(txt, 0)
      } else {
        this.getDesignation(txt, 0)
      }
    } else if (this.masterData && this.masterData?.designationBackup) {
      this.masterData.designation = this.masterData?.designationBackup.slice(0, this.designationDefaultLoadCount)
      this.desigantionFilterEnable = false
      this.checkCurrentDesignationPresent()
    }
  }

  checkOrgHasDesignations(): void {
    const igotDesignationBody: any = {
      request: {
        filters: {
          status: 'Live',
          category: 'designation',
          categories: [
            _.get(this.fullProfile?.unMappedUser, 'rootOrgId', '') + '_odcs_designation'
          ],
          objectType: 'Term',
        },
        fields: ['name'],
        offset: 0,
        limit: 1,
        sort_by: {
          lastUpdatedOn: 'desc',
          objectType: 'Term',
        },
        facets: [],
      },
    }
    this.usersService.searchIgotDesignation(igotDesignationBody).subscribe({
      next: (res: any) => {
        const count = _.get(res, 'result.count', 0)
        this.orgHasDesignations = count > 0
        // reset pagination counters before fetching
        this.designationOffset = 0
        this.designationListLoadCount = this.designationDefaultLoadCount
        this.getdesignationsMeta()
      },
      error: () => {
        this.orgHasDesignations = false
        this.designationOffset = 0
        this.designationListLoadCount = this.designationDefaultLoadCount
        this.getdesignationsMeta()
      }
    })
  }
  getdesignationsMeta() {
    this.isLoadingMoreDesignations = true
    // Reset pagination counters before fetching
    this.designationOffset = 0
    this.designationListLoadCount = this.designationDefaultLoadCount
    // reset legacy no-more-data guard
    this.noMoreLegacyDesignations = false
    if (this.orgHasDesignations) {
      // For orgs using IGOT taxonomy, fetch first page from IGOT
      this.getIgotDesignations(undefined, 0)
    } else {
      this.getDesignation(undefined, 0)
    }
  }
  getIgotDesignations(searchText?: string, offset?: number) {
    // Compute the requested offset (number of items) and ensure we don't request beyond known total
    const reqOffset = (typeof offset === 'number') ? offset : this.designationOffset || 0
    // If we already know the total count and requested offset is beyond it, do nothing
    if (this.odcsDesignationCount && reqOffset >= this.odcsDesignationCount) {
      this.isLoadingMoreDesignations = false
      return
    }

    const igotDesignationBody: any = {
      request: {
        filters: {
          status: 'Live',
          category: 'designation',
          categories: [
            _.get(this.fullProfile?.unMappedUser, 'rootOrgId', '') + '_odcs_designation'
          ],
          objectType: 'Term',
        },
        fields: ['name'],
        offset: reqOffset,
        // keep server page size as default load count (50)
        limit: this.designationDefaultLoadCount,
        sort_by: {
          lastUpdatedOn: 'desc',
          objectType: 'Term',
        },
        facets: [],
      },
    }
    if (searchText?.length) {
      igotDesignationBody.request.query = searchText
      // when searching, always start from first page
      igotDesignationBody.request.offset = 0
      // use the current display count as limit for search (to show more results if previously loaded)
      igotDesignationBody.request.limit = this.designationListLoadCount
    }


    // this.masterData['designation'] = _res.responseData.slice(0, this.designationDefaultLoadCount)
    // this.masterData['designationBackup'] = _res.responseData

    this.usersService.searchIgotDesignation(igotDesignationBody).subscribe({
      next: (res: any) => {
        // IGOT returns terms under result.Term with { name, ... } structure
        const igotData = _.get(res, 'result.Term', [])
        const total = _.get(res, 'result.count', 0)
        // update total count for pagination control when not a search
        if (!searchText || !searchText.length) {
          this.odcsDesignationCount = total
        }
        // If this is a search call, don't overwrite the full backup; only replace the visible list
        if (searchText?.length) {
          this.masterData['designation'] = igotData.slice(0, this.designationDefaultLoadCount)
        } else {
          // Append or set the backup depending on offset (server pagination)
          if (!this.masterData['designationBackup'] || (offset === 0 || offset === undefined)) {
            this.masterData['designationBackup'] = igotData
          } else {
            // append and dedupe by name (case-insensitive)
            const combined = (this.masterData['designationBackup'] || []).concat(igotData)
            this.masterData['designationBackup'] = _.uniqBy(combined, (it: any) => (it?.name || '').toLowerCase())
          }
          // Ensure visible list matches the requested display count
          this.masterData['designation'] = this.masterData['designationBackup'].slice(0, this.designationListLoadCount)
        }
        this.isLoadingMoreDesignations = false
        // Ensure currently selected designation (if any) is present in the list
        this.checkCurrentDesignationPresent()
      },
      error: () => {
        this.isLoadingMoreDesignations = false
        // this.openSnackbar('Something went wrong. Please refresh or try again later.')
      },
    })
  }

  setDefaultValue(): void {
    if (!this.isNgo && (!this.userCreationForm.get('roles')?.value || this.userCreationForm.get('roles')?.value.length === 0)) {
      // tslint:disable-next-line
      this.userCreationForm.get('roles')!.patchValue(this.defaultRole)
    }
    this.userCreationForm.patchValue({
      channel: (this.fullProfile && this.fullProfile.unMappedUser.channel) || '',
    })
  }

  getDesignation(searchText?: string, offset?: number): void {
    // if starting fresh or searching, clear the no-more-data guard
    if (!searchText || searchText.length === 0) {
      // keep previous flag unless explicitly starting from first page
    }
    const reqOffset = (typeof offset === 'number') ? offset : this.designationOffset
    const reqLimit = this.designationDefaultLoadCount
    const pageIndex = reqLimit > 0 ? Math.floor(reqOffset / reqLimit) : 0
    // if we're requesting from first page, clear the no-more-data guard
    if (pageIndex === 0) {
      this.noMoreLegacyDesignations = false
    }
    const requestBody: any = {
      filterCriteriaMap: {
        status: 'Active'
      },
      requestedFields: [],
      pageNumber: pageIndex,
      pageSize: reqLimit,
    }
    if (searchText?.length) {
      requestBody['searchString'] = searchText
      // when searching, start from first page
      requestBody.pageNumber = 0
      // allow larger page for search if needed
      requestBody.pageSize = this.designationListLoadCount
      // reset guard when performing a fresh search
      this.noMoreLegacyDesignations = false
    }

    this.usersService.searchDesignation(requestBody).subscribe({
      next: (res: any) => {
        const content = _.get(res, 'result.result.data', [])
        const mapped = content.map((item: any) => ({
          name: item.designation || '',
          status: item.status || 'Active',
        }))

        // total count may be present in different keys depending on API version.
        // Prefer 'result.result.totalcount' (legacy lower-case) then data.totalCount, then totalCount
        const total = _.get(res, 'result.result.totalcount', _.get(res, 'result.result.data.totalCount', _.get(res, 'result.result.totalCount', 0)))
        this.defaultSearchDesignationCount = total

        // If offset is zero (first page) replace backup, otherwise append + dedupe
        if (!this.masterData['designationBackup'] || reqOffset === 0) {
          this.masterData['designationBackup'] = mapped
        } else {
          const combined = (this.masterData['designationBackup'] || []).concat(mapped)
          this.masterData['designationBackup'] = _.uniqBy(combined, (it: any) => (it?.name || '').toLowerCase())
        }

        // If server returned no new items, mark as no-more-data to stop further scroll requests
        if (!mapped || mapped.length === 0) {
          this.noMoreLegacyDesignations = true
        }

        // If we've loaded at least the total count, mark no-more-data
        if (this.defaultSearchDesignationCount && (this.masterData['designationBackup'] || []).length >= this.defaultSearchDesignationCount) {
          this.noMoreLegacyDesignations = true
        }

        // Ensure visible list matches the requested display count
        this.masterData['designation'] = (this.masterData['designationBackup'] || []).slice(0, this.designationListLoadCount)
        this.isLoadingMoreDesignations = false
        this.checkCurrentDesignationPresent()
      },
      error: () => {
        // Stop further automatic calls on repeated errors to avoid tight loops
        this.isLoadingMoreDesignations = false
        this.noMoreLegacyDesignations = true
        this.matSnackBar.open('Unable to fetch designation details, please try again later!')
      }
    })
  }

  getMasterLanguages(): void {
    this.usersService.getMasterLanguages()
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((res: any) => {
        this.masterData['language'] = res.languages
        this.masterData['languageBackup'] = res.languages
        // tslint:disable-next-line
      }, (_err: HttpErrorResponse) => {
        if (!_err.ok) {
          this.matSnackBar.open('Unable to fetch master language details, please try again later!')
        }
      })
  }

  getGroups(): void {
    this.usersService.getGroups()
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((res: any) => {
        this.masterData['group'] = res.result.response.filter((ele: any) => ele !== 'Others')
        // tslint:disable-next-line
      }, (_err: HttpErrorResponse) => {
        if (!_err.ok) {
          this.matSnackBar.open('Unable to fetch group data, please try again later!')
        }
      })
  }

  getOrgRolesList(): void {
    this.rolesService.getAllRoles()
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((res: any) => {
        if (res && res.result && res.result.response.value) {
          this.masterData['rolesList'] = JSON.parse(res.result.response.value)
          if (Array.isArray(this.masterData.rolesList.orgTypeList)) {
            const mdoArray = this.masterData.rolesList.orgTypeList.find((elem: any) => elem.name === 'MDO')
            const ngoArray = this.masterData.rolesList.orgTypeList.find((elem: any) => elem.name === 'NGO')
            this.masterData['mdoRoles'] = mdoArray.roles || []
            this.masterData['ngoRoles'] = ngoArray.roles || []
            // Filter based on isMdoLeader flag
            if (this.isNgo) {
              this.filteredRoles = this.masterData?.ngoRoles
            } else if (this.isMdoLeader) {
              this.filteredRoles = this.masterData?.mdoRoles  // show all roles
            } else if (this.isMoAdmin) {
              this.filteredRoles = this.masterData?.mdoRoles.filter((role: any) => role !== 'MDO_LEADER' && role !== 'MDO_ADMIN')  // show only PUBLIC
            } else {
              this.filteredRoles = this.masterData?.mdoRoles.filter((role: any) => role === 'PUBLIC')  // show only PUBLIC
            }
          }
        }
        // tslint:disable-next-line
      }, (_err: HttpErrorResponse) => {
        if (!_err.ok) {
          this.matSnackBar.open('Unable to fetch roles list, please try again later!')
        }
      })
  }

  handleRolesCheck(event: MatCheckboxChange, role: string): void {
    if (event.checked) {
      this.rolesArr.push(role)
    } else {
      if (this.rolesArr.indexOf(role) > -1) {
        this.rolesArr.splice(this.rolesArr.indexOf(role), 1)
      }
    }
    // tslint:disable-next-line
    if (this.isNgo) {
      this.userCreationForm.get('roles')!.patchValue(this.rolesArr)
    } else {
      this.userCreationForm.get('roles')!.patchValue([...this.defaultRole, ...this.rolesArr])
    }
    this.updateBpCoTrainerRoleState()
  }

  get isBpTrainerSelected(): boolean {
    return (this.userCreationForm.get('roles')?.value || []).includes(this.bpTrainerRole)
  }

  updateBpCoTrainerRoleState(): void {
    const control = this.userCreationForm.get('bpCoTrainerRole')
    if (!control) {
      return
    }
    if (this.isBpTrainerSelected) {
      control.setValidators([Validators.required])
      if (!this.bpCoTrainerRoles.length && !this.isLoadingBpCoTrainerRoles) {
        this.getBpCoTrainerRoles()
      }
    } else {
      control.clearValidators()
      control.setValue('')
    }
    control.updateValueAndValidity()
  }

  getBpCoTrainerRoles(): void {
    this.isLoadingBpCoTrainerRoles = true
    this.rolesService.getProgramCoordinatorRoles()
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((res: any) => {
        this.bpCoTrainerRoles = _.get(res, 'result.roles', [])
          .map((role: any) => ({ ...role, roleCode: toBpCoTrainerCode(role.roleName) }))
        this.isLoadingBpCoTrainerRoles = false
        // tslint:disable-next-line
      }, (_err: HttpErrorResponse) => {
        this.isLoadingBpCoTrainerRoles = false
        this.matSnackBar.open('Unable to fetch BP co-trainer roles, please try again later!')
      })
  }

  handleAddTags(event: MatChipInputEvent): void {
    const value = event.value as string
    // tslint:disable-next-line
    if (!this.userCreationForm.get('tags')!.value) {
      // tslint:disable-next-line
      this.userCreationForm.get('tags')!.patchValue([])
    }

    if ((value && value.trim()) && this.userCreationForm.get('tags')) {
      // tslint:disable-next-line
      this.userCreationForm.get('tags')!.value.push(value.trim())
    }

    if (event.input) {
      event.input.value = ''
    }

    // Clear textbox
    event.value = ''

    // Optional - mark form control update
    this.userCreationForm.get('tags')?.updateValueAndValidity()
  }

  handleValidTags(event: any): any {
    const charCode = event.charCode
    // tslint:disable-next-line
    return ((charCode > 64 && charCode < 91) || (charCode > 96 && charCode < 123) || charCode == 8 || charCode == 32)
  }

  handleRemoveTag(tag: any): void {
    if (this.userCreationForm.get('roles')) {
      // tslint:disable-next-line
      const indexValue = this.userCreationForm.get('tags')!.value.indexOf(tag)
      if (indexValue > -1) {
        // tslint:disable-next-line
        this.userCreationForm.get('tags')!.value.splice(indexValue, 1)
      }
    }
  }

  handleFormClear(): void {
    this.userCreationForm.reset()
    this.checkboxes.forEach((elem: any) => {
      if (elem.value !== 'PUBLIC') {
        elem.checked = false
      }
    })
    // this.initForm()
    this.rolesArr = []
    this.setDefaultValue()
    this.updateBpCoTrainerRoleState()
  }

  handleUserCreation(): void {
    this.displayLoader = true
    const dataToSubmit = { ...this.userCreationForm.value }
    if (dataToSubmit.dob) {
      // tslint:disable-next-line
      dataToSubmit.dob = `${new Date(dataToSubmit.dob).getDate()}-${new Date(dataToSubmit.dob).getMonth() + 1}-${new Date(dataToSubmit.dob).getFullYear()}`
    }

    if (this.selectedOrgData && this.selectedOrgData.roleId) {
      dataToSubmit.channel = this.selectedOrgData.depatName
    }
    if (this.isNgo) {
      dataToSubmit.designation = this.defaultNgoDesignation
    }

    if (!this.userCreationForm.value.channel) {
      this.matSnackBar.open('Channel info is empty! So unable to create user')
      return
    }

    // Account-level fields go under personalDetails (top level), same contract the
    // legacy create-user flow uses. Profile fields (gender, category, designation,
    // group, pincode, tags, ehrmsId/externalId) must be nested the same way
    // updateUser() below sends them, under profileDetails, otherwise they land in
    // the wrong place in the request.
    const postData: any = {
      personalDetails: {
        email: dataToSubmit.email,
        firstName: dataToSubmit.firstName,
        phone: dataToSubmit.phone,
        channel: dataToSubmit.channel,
        roles: dataToSubmit.roles,
      },
      profileDetails: {
        ...(this.isBpTrainerSelected ? { bpCoTrainer: dataToSubmit.bpCoTrainerRole } : null),
        personalDetails: {
          dob: dataToSubmit.dob,
          domicileMedium: dataToSubmit.domicileMedium,
          gender: dataToSubmit.gender,
          category: dataToSubmit.category,
          mobile: dataToSubmit.phone,
          primaryEmail: dataToSubmit.email,
          firstname: dataToSubmit.firstName,
          // NGO (volunteer org) users carry pin code in personalDetails
          ...(this.isNgo ? { pinCode: dataToSubmit.pincode } : null)
        },
        // NGO (volunteer org) users have no professionalDetails
        ...(this.isNgo ? null : {
          professionalDetails: [
            {
              designation: dataToSubmit.designation,
              group: dataToSubmit.group
            }
          ]
        }),
        additionalProperties: {
          tag: dataToSubmit.tags,
          ...(this.isNgo ? {
            externalSystemId: (dataToSubmit.externalId || '').trim(),
            externalSystem: 'eHRMS ID',
          } : null)
        },
        employmentDetails: {
          pinCode: dataToSubmit.pincode
        }
      }
    }
    if (this.isNgo) {
      postData.isNgo = true
    }
    debugger
    this.usersService.createUser(postData)
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((_res: any) => {
        this.displayLoader = false
        this.matSnackBar.open('User created successfully!')
        this.handleFormClear()
        if (this.selectedOrgData && this.selectedOrgData.roleId) {
          this.userCreated.emit(true)
        }
        // tslint:disable-next-line
      }, (_err: HttpErrorResponse) => {
        if (!_err.ok) {
          this.displayLoader = false
          this.matSnackBar.open(_.get(_err, 'error.params.errmsg') || 'Unable to create user, please try again later!')
        }
      })
  }

  confirmUpdateUser(): void {
    const dialog = this.dialog.open(this.updateConfirmTemplate, {
      width: '500px',
      autoFocus: false
    })
    dialog.afterClosed().subscribe(result => {
      if (result) {
        this.updateUser()
      }
    })
  }

  updateUser() {
    this.displayLoader = true
    const dataToSubmit = { ...this.userCreationForm.value }
    if (dataToSubmit.dob) {
      dataToSubmit.dob = `${new Date(dataToSubmit.dob).getDate()}-${new Date(dataToSubmit.dob).getMonth() + 1}-${new Date(dataToSubmit.dob).getFullYear()}`
    }

    if (this.selectedOrgData && this.selectedOrgData.roleId) {
      dataToSubmit.channel = this.selectedOrgData.depatName
    }

    if (this.isNgo) {
      dataToSubmit.designation = this.defaultNgoDesignation
    }

    if (!this.userCreationForm.value.channel) {
      this.matSnackBar.open('Channel info is empty! So unable to create user')
      return
    }

    // cleared when the BP trainer role is taken away from a user who had a co-trainer role
    const bpCoTrainer = this.isBpTrainerSelected ? dataToSubmit.bpCoTrainerRole : ''
    const requestBody = {
      request: {
        userId: this.editUserData.userId,
        profileDetails: {
          ...(bpCoTrainer || this.editUserData?.profileDetails?.bpCoTrainer ? { bpCoTrainer } : null),
          personalDetails: {
            dob: dataToSubmit.dob,
            domicileMedium: dataToSubmit.domicileMedium,
            gender: dataToSubmit.gender,
            category: dataToSubmit.category,
            mobile: dataToSubmit.phone,
            primaryEmail: dataToSubmit.email,
            firstname: dataToSubmit.firstName,
            // NGO (volunteer org) users carry pin code in personalDetails
            ...(this.isNgo ? { pinCode: dataToSubmit.pincode } : null)
          },
          // NGO (volunteer org) users have no professionalDetails
          ...(this.isNgo ? null : {
            professionalDetails: [
              {
                designation: dataToSubmit.designation,
                group: dataToSubmit.group
              }
            ]
          }),
          additionalProperties: {
            tag: dataToSubmit.tags,
            ...(this.isNgo ? {
              externalSystemId: (dataToSubmit.externalId || '').trim(),
              externalSystem: 'eHRMS ID',
            } : null)
          },
          employmentDetails: {
            pinCode: dataToSubmit.pincode
          }
        }
      }
    }
    this.usersService.updateUserDetails(requestBody)
      .pipe(
        switchMap((update: any) => {
          const reqPayload = {
            request: {
              organisationId: this.selectedOrgData.roleId,
              roles: dataToSubmit.roles,
              userId: this.editUserData.userId
            }
          }
          return this.usersService.addUserToRole(reqPayload).pipe(
            map((roleUpdate: any) => {
              return { updateRes: update, roleUpdateRes: roleUpdate }
            })
          )
        })
      )
      .subscribe((_res: any) => {
        this.displayLoader = false
        this.matSnackBar.open('User updated successfully!')
        this.handleFormClear()
        if (this.selectedOrgData && this.selectedOrgData.roleId) {
          this.userCreated.emit(true)
        }
      }, (_err: HttpErrorResponse) => {
        if (!_err.ok) {
          this.displayLoader = false
          this.matSnackBar.open(_.get(_err, 'error.params.errmsg') || 'Unable to update user, please try again later!')
        }
      })
  }

  ngOnDestroy(): void {
    this.destroySubject$.unsubscribe()
  }


  setupScrollListener(opened: boolean): void {
    if (opened) {
      this.desigantionFilterEnable = false
      this.designationListLoadCount = this.designationDefaultLoadCount // Reset the load count
      // Reset offset pagination
      this.designationOffset = 0
      if (this.orgHasDesignations) {
        // For IGOT taxonomy, refresh first page from API
        this.isLoadingMoreDesignations = true
        this.getIgotDesignations(undefined, 0)
      } else {
        this.getDesignation(undefined, 0)
        this.masterData.designation = this.masterData.designationBackup.slice(0, this.designationListLoadCount)
        this.checkCurrentDesignationPresent()
      }
      if (this.userCreationForm.get('searchDesignation')) {
        this.userCreationForm.get('searchDesignation')!.setValue('')
      }
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }, 100)
      // Wait for the panel to be rendered in the DOM
      setTimeout(() => {
        // Find the panel element
        const panel = document.querySelector('.mat-select-panel')
        if (panel) {
          // Add scroll event listener to the panel
          panel.addEventListener('scroll', this.onDesignationSelectScroll.bind(this))
        }
      }, 100)
    }
  }

  onDesignationSelectScroll(event: any): void {
    const element = event.target
    if (!this.desigantionFilterEnable) {
      // Check if user has scrolled to the bottom (with a small threshold)
      if (element.scrollTop + element.clientHeight >= element.scrollHeight - 5) {
        // Only load more if not already loading and if there are potentially more items
        if (!this.isLoadingMoreDesignations) {
          // If org uses IGOT designation taxonomy, request more from the API by increasing the limit
          if (this.orgHasDesignations) {
            this.isLoadingMoreDesignations = true
            // If we've already loaded everything, don't call the API again
            const loaded = (this.masterData?.designationBackup || []).length
            if (this.odcsDesignationCount && loaded >= this.odcsDesignationCount) {
              this.isLoadingMoreDesignations = false
              return
            }
            // Increase the offset by designationDefaultLoadCount and fetch the next page
            this.designationOffset = (this.designationOffset || 0) + this.designationDefaultLoadCount
            // Ensure the display size is increased to include newly fetched items
            this.designationListLoadCount += this.designationDefaultLoadCount
            this.getIgotDesignations(undefined, this.designationOffset)
          } else if (this.masterData?.designationBackup.length > this.masterData?.designation.length) {
            // Local pagination: expand the sliced list
            this.isLoadingMoreDesignations = true
            this.designationListLoadCount += this.designationDefaultLoadCount
            // Update the filtered list with more items
            setTimeout(() => {
              this.masterData.designation = this.masterData.designationBackup.slice(0, this.designationListLoadCount)
              this.checkCurrentDesignationPresent()
              this.isLoadingMoreDesignations = false
            }, 500) // Small timeout to simulate loading and prevent multiple triggers
          } else {
            // Legacy (server) pagination: request next page if total not reached
            const loadedLegacy = (this.masterData?.designationBackup || []).length
            if (!this.noMoreLegacyDesignations && this.defaultSearchDesignationCount && loadedLegacy < this.defaultSearchDesignationCount) {
              this.isLoadingMoreDesignations = true
              this.designationOffset = (this.designationOffset || 0) + this.designationDefaultLoadCount
              // increase display count to include newly fetched items
              this.designationListLoadCount += this.designationDefaultLoadCount
              this.getDesignation(undefined, this.designationOffset)
            }
          }
        }
      }
    }
  }


  checkCurrentDesignationPresent() {
    // Get the current designation value
    const currentDesignation = this.userCreationForm.get('designation')!.value
    // Check if current designation exists in the list
    if (currentDesignation) {
      const designationExists = this.masterData.designation.some(
        (designation: any) => designation.name.toLowerCase() === currentDesignation.toLowerCase()
      )

      // If designation doesn't exist in the list, add it
      if (!designationExists) {
        // Create a new designation object to match the structure of other items
        const newDesignation = {
          name: currentDesignation,
          // Add any other required properties matching your data structure
          id: 'custom-' + Date.now(),
          description: currentDesignation
        }
        // Make sure the custom designation appears in the filtered list
        if (this.masterData.designation.length >= this.designationListLoadCount) {
          // Replace the last item with the new one to maintain the same number of items
          this.masterData.designation.pop()
        }
        this.masterData.designation.unshift(newDesignation)
        this.isLoadingMoreDesignations = false
      }
    }
  }

  onDesignationDropdownClosed(): void {
    // Keep the designation value but clear the search input
    const currentDesignation = this.userCreationForm.get('designation')!.value
    setTimeout(() => {
      if (this.userCreationForm.get('searchDesignation')) {
        this.userCreationForm.get('searchDesignation')!.setValue('')
      }
      // Ensure the designation value remains selected
      if (currentDesignation) {
        const designationControl = this.userCreationForm.get('designation')
        if (designationControl) {
          designationControl.setValue(currentDesignation)
        }
      }
    }, 100)
  }

  getDateFromText(dateString: string): any {
    if (dateString) {
      const sv: string[] = dateString.split('T')
      if (sv && sv.length > 1) {
        return sv[0]
      }
      const splitValues: string[] = dateString.split('-')
      const [dd, mm, yyyy] = splitValues
      const dateToBeConverted = dd.length !== 4 ? `${yyyy}-${mm}-${dd}` : `${dd}-${mm}-${yyyy}`
      return new Date(dateToBeConverted)
    }
    return ''
  }

  getCheckedRoles(role: string): boolean {
    return role === 'PUBLIC' || (this.userCreationForm?.get('roles')?.value || []).includes(role)
  }

}
