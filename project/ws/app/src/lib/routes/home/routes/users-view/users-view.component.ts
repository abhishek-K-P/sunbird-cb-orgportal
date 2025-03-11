import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { ActivatedRoute, Router } from '@angular/router'
/* tslint:disable */
import * as _ from 'lodash'
/* tslint:enable */
// import { environment } from 'src/environments/environment'
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator'
import { EventService } from '@sunbird-cb/utils'
import { NsContent } from '@sunbird-cb/collection'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import { NSProfileDataV2 } from '../../models/profile-v2.model'
import { UsersService } from '../../../users/services/users.service'
import { LoaderService } from '../../../../../../../../../src/app/services/loader.service'
import { TelemetryEvents } from '../../../../head/_services/telemetry.event.model'
import { ReportsVideoComponent } from '../reports-video/reports-video.component'
import { ApprovalsService } from '../../services/approvals.service'

@Component({
  selector: 'ws-app-users-view',
  templateUrl: './users-view.component.html',
  styleUrls: ['./users-view.component.scss'],
  /* tslint:disable */
  host: { class: 'flex flex-col' },
  /* tslint:enable */
})
export class UsersViewComponent implements OnInit, OnDestroy {
  /* tslint:disable */
  Math: any
  /* tslint:enable */
  currentFilter = 'allusers'
  // filterPath = '/app/home/users'
  discussionList!: any
  discussProfileData!: any
  portalProfile!: NSProfileDataV2.IProfile
  userDetails: any
  location!: string | null
  tabs: any
  isLoading = false
  // tabsData: NSProfileDataV2.IProfileTab[]
  currentUser!: any
  connectionRequests!: any[]
  data: any = []
  usersData!: any
  configSvc: any
  activeUsersData!: any[]
  verifiedUsersData!: any[]
  nonverifiedUsersData!: any[]
  notmyuserUsersData!: any[]

  activeUsersDataCount?: number | 0
  activeUsersDataCountInner?: number | 0
  verifiedUsersDataCount?: number | 0
  verifiedUsersDataCountInner?: number | 0
  nonverifiedUsersDataCount?: number | 0
  nonverifiedUsersDataCountInner?: number | 0
  notmyuserUsersDataCount?: number | 0
  notmyuserUsersDataCountInner?: number | 0
  content: NsContent.IContent = {} as NsContent.IContent
  isMdoAdmin = false
  userList: any = []

  reportsNoteList: string[] = []

  currentOffset = 0
  limit = 20
  pageIndex = 0
  searchQuery = ''
  rootOrgId: any
  currentUserStatus: any
  filetrGroup = []
  filterDesignation = []
  filterRoles = []
  filterTags = []
  sortOrder: any
  searchText = ''
  filterFacets = []
  departName = ''
  pendingApprovals: any = []
  totalUserLimit: any
  isMoreThanLimit = false
  constructor(
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private events: EventService,
    private loaderService: LoaderService,
    private sanitizer: DomSanitizer,
    // private configSvc: ConfigurationsService,
    private usersService: UsersService,
    private apprService: ApprovalsService,
  ) {
    this.Math = Math
    this.configSvc = this.route.parent && this.route.parent.snapshot.data.configService
    this.currentUser = this.configSvc.userProfile && this.configSvc.userProfile.userId
    this.currentUserStatus = this.configSvc.unMappedUser.profileDetails.profileStatus
    this.departName = _.get(this.route, 'parent.snapshot.data.configService.unMappedUser.channel')
    this.totalUserLimit = this.usersService.TOTAL_USERS_LIMIT
    // this.usersData = _.get(this.route, 'snapshot.data.usersList.data') || {}
    // this.filterData()
  }

  ngOnDestroy() {
    // if (this.tabs) {
    //   this.tabs.unsubscribe()
    // }
  }
  ngOnInit() {
    this.currentFilter = this.route.snapshot.params['tab'] || 'allusers'
    this.rootOrgId = _.get(this.route.snapshot.parent, 'data.configService.unMappedUser.rootOrg.rootOrgId')
    this.searchQuery = ''
    if (this.configSvc.unMappedUser && this.configSvc.unMappedUser.roles) {
      this.isMdoAdmin = this.configSvc.unMappedUser.roles.includes('MDO_ADMIN')
    }

    this.getNMUsers('')
    this.getAllUsers('')
    this.getVUsers('')
    this.getNVUsers('')
    this.fetchApprovals()
    this.reportsNoteList = [
      `Easily create users individually or in bulk.`,
      `Edit any user profile within your organization.`,
      `Verified Users: Users with all their primary fields approved.`,
      // tslint:disable-next-line: max-line-length
      `Non-Verified Users: Users whose one or more primary fields are yet to be approved. You can help by reviewing and approving their requests.`,
    ]
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html)
  }

  openVideoPopup() {
    this.dialog.open(ReportsVideoComponent, {
      data: {
        videoLink: 'https://www.youtube.com/embed/tgbNymZ7vqY?autoplay=1&mute=1',
      },
      disableClose: true,
      width: '50%',
      height: '60%',
      panelClass: 'overflow-visable',
    })
  }

  filter(filter: string) {
    this.currentFilter = filter
    this.pageIndex = 0
    this.currentOffset = 0
    this.limit = 20
    this.searchQuery = ''
    this.filterData(this.searchQuery)
  }

  public tabTelemetry(label: string, index: number) {
    const data: TelemetryEvents.ITelemetryTabData = {
      label,
      index,
    }
    this.events.handleTabTelemetry(
      TelemetryEvents.EnumInteractSubTypes.USER_TAB,
      data,
    )
  }

  filterData(query: any) {
    if (this.currentFilter === 'allusers') {
      this.getAllUsers(query)
    } else if (this.currentFilter === 'verified') {
      this.getVUsers(query)
    } else if (this.currentFilter === 'nonverified') {
      this.fetchApprovals()
      this.getNVUsers(query)
    } else if (this.currentFilter === 'notmyuser') {
      this.getNMUsers(query)
    }
  }

  showEditUser(roles: any): boolean {
    if (this.isMdoAdmin) {
      if (roles && roles.length > 0) {
        return true
        //   return (roles.includes('PUBLIC') && roles.length === 1)
      }
      // return false
    }
    return true
  }

  // blockedUsers() {
  //   const blockedUsersData: any[] = []
  //   if (this.usersData && this.usersData.content && this.usersData.content.length > 0) {
  //     _.filter(this.usersData.content, { isDeleted: false }).forEach((user: any) => {
  //       blockedUsersData.push({
  //         fullname: user ? `${user.firstName}` : null,
  //         // fullname: user ? `${user.firstName} ${user.lastName}` : null,
  //         email: user.personalDetails && user.personalDetails.primaryEmail ?
  //           this.profileUtilSvc.emailTransform(user.personalDetails.primaryEmail) : this.profileUtilSvc.emailTransform(user.email),
  //         role: user.roles,
  //         userId: user.id,
  //         active: !user.isDeleted,
  //         blocked: user.blocked,
  //         roles: _.join(_.map(user.roleInfo, i => `<li>${i}</li>`), ''),
  //       })
  //     })
  //   }
  //   return blockedUsersData
  // }

  async getAllUsers(query: any) {
    this.loaderService.changeLoad.next(true)
    let reqBody
    const filtreq = {
      rootOrgId: this.rootOrgId,
      'profileDetails.profileStatus': ['VERIFIED', 'NOT-VERIFIED'],
      status: 1,
    }

    if (this.getFilterGroup(query) && this.getFilterGroup(query) !== 'undefind') {
      Object.assign(filtreq, { 'profileDetails.professionalDetails.group': this.getFilterGroup(query) })
    }
    if (this.getFilterDesignation(query) && this.getFilterDesignation(query) !== 'undefind') {
      Object.assign(filtreq, { 'profileDetails.professionalDetails.designation': this.getFilterDesignation(query) })
    }
    if (this.getFilterRoles(query) && this.getFilterRoles(query) !== 'undefind') {
      Object.assign(filtreq, { 'profileDetails.professionalDetails.role': this.getFilterRoles(query) })
    }
    if (this.getFilterTags(query) && this.getFilterTags(query) !== 'undefind') {
      Object.assign(filtreq, { 'profileDetails.professionalDetails.tag': this.getFilterTags(query) })
    }
    reqBody = {
      request: {
        filters: filtreq,
        // facets: [
        //   'profileDetails.professionalDetails.group',
        //   'profileDetails.professionalDetails.designation',
        //   'profileDetails.additionalDetails.tag',
        // ],
        // fields: [
        //   'rootOrgId',
        //   'profileDetails',
        // ],
        limit: this.limit,
        offset: this.pageIndex,
        query: this.getSearchText(query),
        sort_by: this.getSortOrder(query),
      },
    }
    this.usersService.getAllKongUsers(reqBody).subscribe((data: any) => {
      // const allusersData = data.result.response
      // this.activeUsersData = allusersData.content
      // // this.activeUsersData = this.activeUsersData.filter((wf: any) => wf.profileDetails.profileStatus !== 'NOT-MY-USER')
      // this.activeUsersDataCount = allusersData.count
      const allusersData = data && data.result && data.result.response
      const userContent = allusersData.content
      const apiUserCount = data?.result?.response?.count
      const searchText = this.getSearchText(query).toLowerCase()
      if (searchText && searchText.length && searchText.length > 0) {
        const userData: any = []
        if (data && data.result && data.result.response && data.result.response.count &&
          data.result.response.count > 0) {
          if (userContent && userContent.length > 0) {
            // userContent.forEach((element: any) => {
            for (const element of userContent) {
              const userPrimaryEmail = (element && element.profileDetails && element.profileDetails.personalDetails &&
                element.profileDetails.personalDetails.primaryEmail &&
                element.profileDetails.personalDetails.primaryEmail.toLowerCase())

              const userMail = element && element.email && element.email.toLowerCase()

              const userOfficialMail = element && element.profileDetails && element.profileDetails.personalDetails &&
                element.profileDetails.personalDetails.officialEmail &&
                element.profileDetails.personalDetails.officialEmail.toLowerCase()

              const userPersonalMail = element && element.profileDetails && element.profileDetails.personalDetails &&
                element.profileDetails.personalDetails.personalEmail &&
                element.profileDetails.personalDetails.personalEmail.toLowerCase()

              const userName = element && element.firstName && element.firstName.toLowerCase()
              const userFirstName = element && element.profileDetails && element.profileDetails.personalDetails &&
                element.profileDetails.personalDetails.firstname &&
                element.profileDetails.personalDetails.firstname.toLowerCase()

              const userMob = element && element.profileDetails && element.profileDetails.personalDetails &&
                element.profileDetails.personalDetails.mobile

              const userTelePhone = element && element.profileDetails && element.profileDetails.personalDetails &&
                element.profileDetails.personalDetails.telephone

              const userPhone = element && element.phone

              const emailMatch = (userMail && userMail.includes(searchText.toLowerCase())) ||
                (userPrimaryEmail && userPrimaryEmail.includes(searchText.toLowerCase())) ||
                (userOfficialMail && userOfficialMail.includes(searchText.toLowerCase())) ||
                (userPersonalMail && userPersonalMail.includes(searchText.toLowerCase()))

              const firstNameMatch = (userName && userName.includes(searchText.toLowerCase())) ||
                (userFirstName && userFirstName.includes(searchText.toLowerCase()))

              const phoneMatch = (userTelePhone && userTelePhone.includes(searchText)) ||
                (userMob && userMob.toString().includes(searchText)) || (userPhone && userPhone.includes(searchText))
              if (emailMatch || firstNameMatch || phoneMatch) {
                userData.push(element)
                this.activeUsersData = userData
                this.activeUsersDataCount = apiUserCount
                this.updateUserCounts(userData, apiUserCount, 'all_user')
              } else {
                this.activeUsersData = userData
                this.activeUsersDataCount = apiUserCount
                this.updateUserCounts(allusersData, apiUserCount, 'all_user')
              }
            }
          }
        } else {
          const userCount = allusersData?.count
          this.updateUserCounts(allusersData, userCount, 'all_user')
        }

      } else {
        const userCount = allusersData?.count
        this.updateUserCounts(allusersData, userCount, 'all_user')
      }
    })
  }
  updateUserCounts(users: any, userCount: number, clickedTab: string) {
    const userMappings = {
      all_user: { dataKey: 'activeUsersData', countKey: 'activeUsersDataCount', innerCountKey: 'activeUsersDataCountInner' },
      ver_user: { dataKey: 'verifiedUsersData', countKey: 'verifiedUsersDataCount', innerCountKey: 'verifiedUsersDataCountInner' },
      non_ver_user: { dataKey: 'nonverifiedUsersData', countKey: 'nonverifiedUsersDataCount', innerCountKey: 'nonverifiedUsersDataCountInner' },
      default: { dataKey: 'notmyuserUsersData', countKey: 'notmyuserUsersDataCount', innerCountKey: 'notmyuserUsersDataCountInner' }
    }

    // const mapping = userMappings[clickedTab] || userMappings.default;
    const mapping = userMappings[clickedTab as keyof typeof userMappings] ?? userMappings.default;

    // Assign user data
    (this as any)[mapping.dataKey] = users?.content ?? users;
    (this as any)[mapping.countKey] = userCount;

    // Assign count using Math.min() for cleaner logic
    (this as any)[mapping.innerCountKey] = Math.min(userCount, this.totalUserLimit)
    this.isMoreThanLimit = userCount >= this.totalUserLimit
  }

  async getVUsers(query: any) {
    let reqBody
    this.loaderService.changeLoad.next(true)
    const filtreq = {
      rootOrgId: this.rootOrgId,
      'profileDetails.profileStatus': 'VERIFIED',
      status: 1,
    }
    if (this.getFilterGroup(query) && this.getFilterGroup(query) !== 'undefind') {
      Object.assign(filtreq, { 'profileDetails.professionalDetails.group': this.getFilterGroup(query) })
    }
    if (this.getFilterDesignation(query) && this.getFilterDesignation(query) !== 'undefind') {
      Object.assign(filtreq, { 'profileDetails.professionalDetails.designation': this.getFilterDesignation(query) })
    }
    if (this.getFilterRoles(query) && this.getFilterRoles(query) !== 'undefind') {
      Object.assign(filtreq, { 'profileDetails.professionalDetails.role': this.getFilterRoles(query) })
    }
    if (this.getFilterTags(query) && this.getFilterTags(query) !== 'undefind') {
      Object.assign(filtreq, { 'profileDetails.professionalDetails.tag': this.getFilterTags(query) })
    }

    reqBody = {
      request: {
        filters: filtreq,
        // facets: [
        //   'profileDetails.professionalDetails.group',
        //   'profileDetails.professionalDetails.designation',
        //   'profileDetails.additionalDetails.tag',
        // ],
        // fields: [
        //   'rootOrgId',
        //   'profileDetails',
        // ],
        limit: this.limit,
        offset: this.pageIndex,
        query: this.getSearchText(query),
        sort_by: this.getSortOrder(query),
      },
    }
    this.usersService.getAllKongUsers(reqBody).subscribe((data: any) => {
      // const allusersData = data.result.response
      // this.verifiedUsersData = allusersData.content
      // this.verifiedUsersDataCount = data.result.response.count
      // this.verifiedUsersData = allusersData.content
      // this.verifiedUsersDataCount = data.result.response.count
      // this.filterFacets = allusersData.facets ? allusersData.facets : []

      // if (this.currentUserStatus === 'VERIFIED') {
      //   const i = this.verifiedUsersData.findIndex((wf: any) => wf.userId === this.currentUser)
      //   if (i > -1) {
      //     this.verifiedUsersData.splice(i, 1)
      //     this.verifiedUsersDataCount = this.verifiedUsersDataCount ? this.verifiedUsersDataCount - 1 : this.verifiedUsersDataCount
      //   }
      // }
      const apiUserCount = data?.result?.response?.count
      const allusersData = data && data.result && data.result.response
      const userContent = allusersData.content
      const searchText = this.getSearchText(query).toLowerCase()
      if (searchText && searchText.length && searchText.length > 0) {
        const userData: any = []
        if (data && data.result && data.result.response && data.result.response.count &&
          data.result.response.count > 0) {
          for (const element of userContent) {
            // const userMail = element && element.profileDetails && element.profileDetails.personalDetails &&
            //   element.profileDetails.personalDetails.primaryEmail &&
            //   element.profileDetails.personalDetails.primaryEmail.toLowerCase()
            // const userName = element && element.firstName && element.firstName.toLowerCase()
            // const userPhone = element && element.profileDetails && element.profileDetails.personalDetails &&
            //   element.profileDetails.personalDetails.mobile

            const userPrimaryEmail = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.primaryEmail &&
              element.profileDetails.personalDetails.primaryEmail.toLowerCase()

            const userMail = element && element.email && element.email.toLowerCase()

            const userOfficialMail = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.officialEmail &&
              element.profileDetails.personalDetails.officialEmail.toLowerCase()

            const userPersonalMail = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.personalEmail &&
              element.profileDetails.personalDetails.personalEmail.toLowerCase()

            const userName = element && element.firstName && element.firstName.toLowerCase()
            const userFirstName = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.firstname &&
              element.profileDetails.personalDetails.firstname.toLowerCase()

            const userMob = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.mobile

            const userTelePhone = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.telephone

            const userPhone = element && element.phone

            const emailMatch = (userMail && userMail.includes(searchText.toLowerCase())) ||
              (userPrimaryEmail && userPrimaryEmail.includes(searchText.toLowerCase())) ||
              (userOfficialMail && userOfficialMail.includes(searchText.toLowerCase())) ||
              (userPersonalMail && userPersonalMail.includes(searchText.toLowerCase()))

            const firstNameMatch = (userName && userName.includes(searchText.toLowerCase())) ||
              (userFirstName && userFirstName.includes(searchText.toLowerCase()))

            const phoneMatch = (userTelePhone && userTelePhone.includes(searchText)) ||
              (userMob && userMob.toString().includes(searchText)) || (userPhone && userPhone.includes(searchText))

            if (emailMatch || firstNameMatch || phoneMatch) {
              userData.push(element)
              this.verifiedUsersData = userData
              this.verifiedUsersDataCount = apiUserCount
              this.updateUserCounts(userData, apiUserCount, 'ver_user')
            } else {
              this.verifiedUsersData = userData
              this.verifiedUsersDataCount = apiUserCount
              this.updateUserCounts(allusersData, apiUserCount, 'ver_user')
            }
          }
        } else {
          this.updateUserCounts(allusersData, apiUserCount, 'ver_user')
        }

      } else {
        this.updateUserCounts(allusersData, apiUserCount, 'ver_user')
      }
    })
  }

  async getNVUsers(query: any) {
    let reqBody
    this.loaderService.changeLoad.next(true)
    const filtreq = {
      rootOrgId: this.rootOrgId,
      'profileDetails.profileStatus': 'NOT-VERIFIED',
      status: 1,
    }
    if (this.getFilterGroup(query) && this.getFilterGroup(query) !== 'undefind') {
      Object.assign(filtreq, { 'profileDetails.professionalDetails.group': this.getFilterGroup(query) })
    }
    if (this.getFilterDesignation(query) && this.getFilterDesignation(query) !== 'undefind') {
      Object.assign(filtreq, { 'profileDetails.professionalDetails.designation': this.getFilterDesignation(query) })
    }
    if (this.getFilterRoles(query) && this.getFilterRoles(query) !== 'undefind') {
      Object.assign(filtreq, { 'profileDetails.professionalDetails.role': this.getFilterRoles(query) })
    }
    if (this.getFilterTags(query) && this.getFilterTags(query) !== 'undefind') {
      Object.assign(filtreq, { 'profileDetails.professionalDetails.tag': this.getFilterTags(query) })
    }

    reqBody = {
      request: {
        filters: filtreq,
        // facets: [
        //   'profileDetails.professionalDetails.group',
        //   'profileDetails.professionalDetails.designation',
        //   'profileDetails.additionalDetails.tag',
        // ],
        // fields: [
        //   'rootOrgId',
        //   'profileDetails',
        // ],
        limit: this.limit,
        offset: this.pageIndex,
        query: this.getSearchText(query),
        sort_by: this.getSortOrder(query),
      },
    }
    this.usersService.getAllKongUsers(reqBody).subscribe((data: any) => {
      // const allusersData = data.result.response
      // this.nonverifiedUsersData = allusersData.content
      // this.nonverifiedUsersDataCount = data.result.response.count
      const allusersData = data && data.result && data.result.response
      const userContent = allusersData.content
      const apiUserCount = data?.result?.response?.count
      const searchText = this.getSearchText(query).toLowerCase()
      if (searchText && searchText.length && searchText.length > 0) {
        const userData: any = []
        if (data && data.result && data.result.response && data.result.response.count &&
          data.result.response.count > 0) {
          for (const element of userContent) {
            // const userMail = element && element.profileDetails && element.profileDetails.personalDetails &&
            //   element.profileDetails.personalDetails.primaryEmail &&
            //   element.profileDetails.personalDetails.primaryEmail.toLowerCase()
            // const userName = element && element.firstName && element.firstName.toLowerCase()
            // const userPhone = element && element.profileDetails && element.profileDetails.personalDetails &&
            //   element.profileDetails.personalDetails.mobile

            const userPrimaryEmail = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.primaryEmail &&
              element.profileDetails.personalDetails.primaryEmail.toLowerCase()

            const userMail = element && element.email && element.email.toLowerCase()

            const userOfficialMail = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.officialEmail &&
              element.profileDetails.personalDetails.officialEmail.toLowerCase()

            const userPersonalMail = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.personalEmail &&
              element.profileDetails.personalDetails.personalEmail.toLowerCase()

            const userName = element && element.firstName && element.firstName.toLowerCase()
            const userFirstName = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.firstname &&
              element.profileDetails.personalDetails.firstname.toLowerCase()

            const userMob = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.mobile

            const userTelePhone = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.telephone

            const userPhone = element && element.phone

            const emailMatch = (userMail && userMail.includes(searchText.toLowerCase())) ||
              (userPrimaryEmail && userPrimaryEmail.includes(searchText.toLowerCase())) ||
              (userOfficialMail && userOfficialMail.includes(searchText.toLowerCase())) ||
              (userPersonalMail && userPersonalMail.includes(searchText.toLowerCase()))

            const firstNameMatch = (userName && userName.includes(searchText.toLowerCase())) ||
              (userFirstName && userFirstName.includes(searchText.toLowerCase()))

            const phoneMatch = (userTelePhone && userTelePhone.includes(searchText)) ||
              (userMob && userMob.toString().includes(searchText)) || (userPhone && userPhone.includes(searchText))

            if (emailMatch || firstNameMatch || phoneMatch) {
              userData.push(element)
              this.nonverifiedUsersData = userData
              this.nonverifiedUsersDataCount = apiUserCount
              this.updateUserCounts(userData, apiUserCount, 'non_ver_user')
            } else {
              this.nonverifiedUsersData = userData
              this.updateUserCounts(allusersData, apiUserCount, 'non_ver_user')
            }
          }
        } else {
          this.updateUserCounts(allusersData, apiUserCount, 'non_ver_user')
        }

      } else {
        this.updateUserCounts(allusersData, apiUserCount, 'non_ver_user')
      }
    })
  }

  async getNMUsers(query: any) {
    let reqBody
    this.loaderService.changeLoad.next(true)
    const filtreq = {
      rootOrgId: this.rootOrgId,
      'profileDetails.profileStatus': 'NOT-MY-USER',
    }
    if (this.getFilterGroup(query) && this.getFilterGroup(query) !== 'undefind') {
      Object.assign(filtreq, { 'profileDetails.professionalDetails.group': this.getFilterGroup(query) })
    }
    if (this.getFilterDesignation(query) && this.getFilterDesignation(query) !== 'undefind') {
      Object.assign(filtreq, { 'profileDetails.professionalDetails.designation': this.getFilterDesignation(query) })
    }
    if (this.getFilterRoles(query) && this.getFilterRoles(query) !== 'undefind') {
      Object.assign(filtreq, { 'profileDetails.professionalDetails.role': this.getFilterRoles(query) })
    }
    if (this.getFilterTags(query) && this.getFilterTags(query) !== 'undefind') {
      Object.assign(filtreq, { 'profileDetails.professionalDetails.tag': this.getFilterTags(query) })
    }

    reqBody = {
      request: {
        filters: filtreq,
        // facets: [
        //   'profileDetails.professionalDetails.group',
        //   'profileDetails.professionalDetails.designation',
        //   'profileDetails.additionalDetails.tag',
        // ],
        // fields: [
        //   'rootOrgId',
        //   'profileDetails',
        // ],
        limit: this.limit,
        offset: this.pageIndex,
        query: this.getSearchText(query),
        sort_by: this.getSortOrder(query),
      },
    }
    this.usersService.getAllKongUsers(reqBody).subscribe((data: any) => {
      // const allusersData = data.result.response
      // this.notmyuserUsersData = allusersData.content
      // this.notmyuserUsersDataCount = data.result.response.count
      const allusersData = data && data.result && data.result.response
      const apiUserCount = data?.result?.response?.count
      const userContent = allusersData.content
      const searchText = this.getSearchText(query).toLowerCase()
      if (searchText && searchText.length && searchText.length > 0) {
        const userData: any = []
        if (data && data.result && data.result.response && data.result.response.count &&
          data.result.response.count > 0) {
          for (const element of userContent) {
            // const userMail = element && element.profileDetails && element.profileDetails.personalDetails &&
            //   element.profileDetails.personalDetails.primaryEmail &&
            //   element.profileDetails.personalDetails.primaryEmail.toLowerCase()
            // const userName = element && element.firstName && element.firstName.toLowerCase()
            // const userPhone = element && element.profileDetails && element.profileDetails.personalDetails &&
            //   element.profileDetails.personalDetails.mobile

            const userPrimaryEmail = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.primaryEmail &&
              element.profileDetails.personalDetails.primaryEmail.toLowerCase()

            const userMail = element && element.email && element.email.toLowerCase()

            const userOfficialMail = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.officialEmail &&
              element.profileDetails.personalDetails.officialEmail.toLowerCase()

            const userPersonalMail = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.personalEmail &&
              element.profileDetails.personalDetails.personalEmail.toLowerCase()

            const userName = element && element.firstName && element.firstName.toLowerCase()

            const userFirstName = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.firstname &&
              element.profileDetails.personalDetails.firstname.toLowerCase()

            const userMob = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.mobile

            const userTelePhone = element && element.profileDetails && element.profileDetails.personalDetails &&
              element.profileDetails.personalDetails.telephone

            const userPhone = element && element.phone

            const emailMatch = (userMail && userMail.includes(searchText.toLowerCase())) ||
              (userPrimaryEmail && userPrimaryEmail.includes(searchText.toLowerCase())) ||
              (userOfficialMail && userOfficialMail.includes(searchText.toLowerCase())) ||
              (userPersonalMail && userPersonalMail.includes(searchText.toLowerCase()))

            const firstNameMatch = (userName && userName.includes(searchText.toLowerCase())) ||
              (userFirstName && userFirstName.includes(searchText.toLowerCase()))

            const phoneMatch = (userTelePhone && userTelePhone.includes(searchText)) ||
              (userMob && userMob.toString().includes(searchText)) || (userPhone && userPhone.includes(searchText))

            if (emailMatch || firstNameMatch || phoneMatch) {
              userData.push(element)
              this.notmyuserUsersData = userData
              this.notmyuserUsersDataCount = apiUserCount
              this.updateUserCounts(userData, apiUserCount, 'not_my_user')
            } else {
              this.notmyuserUsersData = userData
              this.updateUserCounts(allusersData, apiUserCount, 'not_my_user')
            }
          }
        } else {
          this.updateUserCounts(allusersData, apiUserCount, 'not_my_user')
        }

      } else {
        this.updateUserCounts(allusersData, apiUserCount, 'not_my_user')
      }
    })
  }

  getFilterGroup(query: any) {
    if (query && query.filters && (query.filters.group).length > 0) {
      return query.filters.group
    }
  }
  getFilterDesignation(query: any) {
    if (query && query.filters && (query.filters.designation).length > 0) {
      return query.filters.designation
    }
  }
  getFilterRoles(query: any) {
    if (query && query.filters && (query.filters.roles).length > 0) {
      return query.filters.roles
    }
  }
  getFilterTags(query: any) {
    if (query && query.filters && (query.filters.tags.length > 0)) {
      return query.filters.tags
    }
  }
  getSearchText(query: any) {
    return this.searchText = query && query.searchText ? query.searchText : ''
  }
  getSortOrder(query: any) {
    let sortBy
    if (query && query.sortOrder) {
      sortBy = query.sortOrder
      if (sortBy === 'alphabetical') {
        return { firstName: 'asc' }
      }
      if (sortBy === 'oldest') {
        return { createdDate: 'desc' }
      }
      if (sortBy === 'newest') {
        return { createdDate: 'asc' }
      }
    }
    return { firstName: 'asc' }
  }

  clickHandler(event: any) {
    switch (event.type) {
      case 'createUser':
        this.onCreateClick()
        break
      case 'upload':
        this.onUploadClick()
        break
    }
  }

  onCreateClick() {
    this.router.navigate([`/app/users/create-user`])
    this.events.raiseInteractTelemetry(
      {
        type: TelemetryEvents.EnumInteractTypes.CLICK,
        subType: TelemetryEvents.EnumInteractSubTypes.CREATE_BTN,
        id: 'create-user-btn',
      },
      {}
    )
  }

  onUploadClick() {
    this.filter('upload')
  }

  onRoleClick(user: any) {
    this.router.navigate([`/app/users/${user.userId}/details`])
    this.events.raiseInteractTelemetry(
      {
        type: TelemetryEvents.EnumInteractTypes.CLICK,
        subType: TelemetryEvents.EnumInteractSubTypes.CARD_CONTENT,
        id: TelemetryEvents.EnumIdtype.USER_ROW,
      },
      {
        id: user.userId,
        type: TelemetryEvents.EnumIdtype.USER,
      }
    )
  }

  onEnterkySearch(enterValue: any) {
    this.searchQuery = enterValue
    this.filterData(this.searchQuery)
  }

  onPaginateChange(event: PageEvent) {
    this.pageIndex = event.pageIndex
    this.limit = event.pageSize
    this.filterData(this.searchQuery)
  }

  fetchApprovals() {
    if (this.departName) {
      const req = {
        serviceName: 'profile',
        applicationStatus: 'SEND_FOR_APPROVAL',
        requestType: ['GROUP_CHANGE', 'DESIGNATION_CHANGE'],
        deptName: this.departName,
      }
      this.apprService.getApprovalsList(req).subscribe((res: any) => {
        if (res && res.result) {
          // console.log('res--', res)
          if (res && res.result && res.result.data && res.result.data.length) {
            this.pendingApprovals = res.result.data
          }

        }
      })
    }
  }
}
