import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core'
import { Router } from '@angular/router'
import { ConfigurationsService, NsPage } from '@sunbird-cb/utils'
import { mapFilePath, dashboardEmptyData } from '../../../../../../../../../src/mdo-assets/data/data'
import { HttpClient } from '@angular/common/http'
import { map } from 'rxjs/internal/operators/map'
/* tslint:disable */
import _ from 'lodash'
/* tslint:enable */
import { CreateMDOService } from '../../../../head/work-allocation-table/create-mdo.services'
const endpoint = {
  profilePid: '/apis/proxies/v8/api/user/v2/read',
  orgRead: '/apis/proxies/v8/org/v1/read',
  lookerProDashboard: 'apis/proxies/v8/looker/dashboard',
}
@Component({
  selector: 'ws-app-my-dashboard-home',
  templateUrl: './my-dashboard-home.component.html',
  styleUrls: ['./my-dashboard-home.component.scss', 'bootstrap-rain.scss'],
  /* tslint:disable-next-line */
  encapsulation: ViewEncapsulation.None,
  /* tslint:enable */
})
export class MyDashboardHomeComponent implements OnInit {

  constructor(private router: Router, private configSvc: ConfigurationsService, private http: HttpClient,
    private mdoService: CreateMDOService) { }
  pageNavbar: Partial<NsPage.INavBackground> = this.configSvc.pageNavBar
  getDashboardForKM =
    '/apis/proxies/v8/dashboard/analytics/getDashboardConfig/Karmayogi'
  getDashboardForProfile =
    '/apis/proxies/v8/dashboard/analytics/getDashboardsForProfile/Karmayogi?realm=mdo'
  getChartV2 =
    '/apis/proxies/v8/dashboard/analytics/getChartV2/Karmayogi'

  selectedDashboardId = ''

  mapPath = mapFilePath

  currentDashboard: any = []

  dashboardEmpty = dashboardEmptyData
  token = ''
  lookerDashboardDetail: any
  userData: any
  showLookerProDashboard = false
  @ViewChild('lookerIframe', { static: false }) lookerIframe!: ElementRef
  ngOnInit() {
    // if (this.router.url.includes('/app/my-dashboard-temp/temp')) {
    //   // this.showLookerProDashboard = true
    //   // this.getUserProfileDetail()
    // } else if (this.selectedDashboardId === '') {

    // }
    this.getUserProfileDetail()
  }

  getDashboardId(value: string) {
    if (value && value !== null) {
      this.selectedDashboardId = value
    } else {
      this.currentDashboard = []
      this.currentDashboard.push(this.dashboardEmpty)
    }
  }

  backToHome() {
    this.router.navigate(['page', 'home'])
  }

  async getUserProfileDetail() {
    this.userData = await this.http
      .get<any>(endpoint.profilePid)
      .pipe(map((res: any) => {
        return _.get(res, 'result.response')
      }))
      .toPromise()
    if (this.userData) {
      // if (this.userData && this.userData.roles &&
      //   (this.userData.roles.indexOf('MDO_LEADER') > -1) ||
      //   (this.userData.roles.indexOf('mdo_leader') > -1)
      // ) {
      //   this.showLookerProDashboard = true
      //   this.showDashboard()
      // } else {
      //   this.showLookerProDashboard = false
      //   this.currentDashboard = []
      //   this.currentDashboard.push(this.dashboardEmpty)
      // }
      this.showLookerProDashboard = true
      this.showDashboard()
      /* tslint:disable */
      console.log('userData', "rootOrgId", this.userData.rootOrgId, "userId", this.userData.userId)
      /* tslint:enable */
    }
  }

  async getUserProfileTempDetail() {
    this.userData = await this.http
      .get<any>(endpoint.profilePid)
      .pipe(map((res: any) => {
        return _.get(res, 'result.response')
      }))
      .toPromise()
    if (this.userData) {
      this.showTempDashboard()
      /* tslint:disable */
      console.log('userData', "rootOrgId", this.userData.rootOrgId, "userId", this.userData.userId)
      /* tslint:enable */
    }
  }

  showTempDashboard() {
    this.lookerDashboardDetail = ''
    let userId = this.userData.userId
    if (this.userData && this.userData.rootOrgId === '01359132123730739281') {
      userId = 'c32ced54-14bc-4750-bed0-b335e4d0bc0e'
    } else if (this.userData && this.userData.rootOrgId === '01376822290813747263') {
      userId = '91d6d08a-8c23-4cc4-9e59-652fd292d426'
    }
    /* tslint:disable */
    const requestPayload = {
      request: {
        embedUrl: '/embed/dashboards/7',
        sessionLengthInSec: 900,
        userAttributes: {
          roles: this.userData.roles,
          orgId: this.userData.rootOrgId,
          userId,
        },
      },
    }
    const url = `${endpoint.lookerProDashboard}`
    this.mdoService.getDashboardData(url, requestPayload).subscribe(data => {
      if (data && data.signedUrl) {
        this.lookerDashboardDetail = data.signedUrl
        this.reloadIframeWithNewUser()
      }
    })
    /* tslint:enable */

  }

  showDashboard() {
    this.lookerDashboardDetail = ''
    const userId = this.userData.userId
    // if (this.userData && this.userData.rootOrgId === '01359132123730739281') {
    //   userId = 'c32ced54-14bc-4750-bed0-b335e4d0bc0e'
    // } else if (this.userData && this.userData.rootOrgId === '01376822290813747263') {
    //   userId = '91d6d08a-8c23-4cc4-9e59-652fd292d426'
    // }
    /* tslint:disable */
    const requestPayload = {
      request: {
        embedUrl: '/embed/dashboards/7',
        userAttributes: {
          roles: this.userData.roles,
          orgId: this.userData.rootOrgId,
          userId,
          firstName: this.userData && this.userData.firstName ? this.userData.firstName : userId
        },
      },
    }
    const url = `${endpoint.lookerProDashboard}`
    this.mdoService.getDashboardData(url, requestPayload).subscribe(data => {
      if (data && data.signedUrl) {
        this.lookerDashboardDetail = data.signedUrl
        this.reloadIframeWithNewUser()
      }
    })
    /* tslint:enable */

  }

  // Function to reload the iframe with a new URL for a new user
  reloadIframeWithNewUser() {
    if (this.lookerIframe) {
      const iframe: HTMLIFrameElement = this.lookerIframe.nativeElement
      iframe.src = this.lookerDashboardDetail
    }

  }

}
