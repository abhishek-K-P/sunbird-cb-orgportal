import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, Subject } from 'rxjs'
import * as _ from 'lodash'
import { map } from 'rxjs/operators'
import { Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
const API_END_POINTS = {
  NOTIFICATIONS_COUNT: `apis/proxies/v8/v1/notifications/unread/count`,
  CONTENT_READ: (contentId: any) => `/apis/proxies/v8/action/content/v3/read/${contentId}`,
  RESET_NOTIFICATIONS_COUNT: `apis/proxies/v8/v1/notifications/reset/unread/count`,
  WORKFLOW_SEARCH: `apis/protected/v8/workflowhandler/profileApprovalSearch`,
  CONNECTION_REQUEST: (pageNo: any, pageSize: any) => `apis/protected/v8/connections/v2/connections/requests/received?pageNo=${pageNo}&pageSize=${pageSize}`,
}

@Injectable({
  providedIn: 'root',
})

export class NotificationsService {
  closeDialogPop = new Subject()
  nofificationsCount = new Subject()
  orgName = ''
  constructor(private http: HttpClient,
    private configService: ConfigurationsService,
    private router: Router,
  ) {
    if (this.configService && this.configService.unMappedUser
      && this.configService.unMappedUser.profileDetails
      && this.configService.unMappedUser.profileDetails.employmentDetails
      && this.configService.unMappedUser.profileDetails.employmentDetails.departmentName) {
      this.orgName = this.configService.unMappedUser.profileDetails.employmentDetails.departmentName
    }
  }

  getNotificationsData(): Observable<any> {
    return this.http.get(API_END_POINTS.NOTIFICATIONS_COUNT)
  }

  getContentData(contentId: string): Observable<any> {
    return this.http.get<any>(`${API_END_POINTS.CONTENT_READ(contentId)}`).pipe(
      map((data: any) => {
        return data.result.content
      }))
  }

  searchWorkflowSearch(req: any): Observable<any> {
    return this.http.post(API_END_POINTS.WORKFLOW_SEARCH, req)
  }

  getMyRequests(): Observable<any> {
    return this.http.get<any>(`${API_END_POINTS.CONNECTION_REQUEST(0, 100)}`).pipe(
      map((data: any) => {
        return data.result.data
      }))
  }

  resetNotificationsCount(): Observable<any> {
    return this.http.get(API_END_POINTS.RESET_NOTIFICATIONS_COUNT, {})
  }

  handleNetworkRedirection(notification: any, snackBar: any, environment: any): void {
    if (notification.sub_category === 'REJECTED_CONNECTION_REQUEST') {
      snackBar.open('This request has been resolved or is no longer available.')
    } else if (notification.sub_category === 'SEND_CONNECTION_REQUEST') {
      this.getMyRequests().subscribe((res: any) => {
        if (res && res.length) {
          const connection = res.find((item: any) => item.userId === notification.message.data.id)
          if (connection) {
            let url = `${environment.portalsForNotifications.learner}/app/network-v2/connections`
            window.open(url, '_blank')
          } else {
            snackBar.open('This request has been resolved or is no longer available.')
          }
        } else {
          snackBar.open('This request has been resolved or is no longer available.')
        }
      })
    } else {
      let url = `${environment.portalsForNotifications.learner}/app/network-v2/connections`
      window.open(url, '_blank')
    }
  }

  handleReviewStatus(res: any, notification: any, isStandaloneResource: boolean, roles: string[], environment: any, snackBar: any): void {
    switch (res.reviewStatus) {
      case 'InReview': {
        if (roles.includes('CONTENT_REVIEWER')) {
          window.open(`${environment.portalsForNotifications.cbp}/author/editor/${notification.message.data.id}/collectionV2?isStandaloneResource=${isStandaloneResource}&preview=true&editMode=true&status=Review&reviewStatus=${res.reviewStatus}`, '_blank')
        } else {
          snackBar.open("You are not authorized to view this content.")
        }
        break
      } case 'Reviewed': {
        if (roles.includes('CONTENT_PUBLISHER')) {
          window.open(`${environment.portalsForNotifications.cbp}/author/editor/${notification.message.data.id}/collectionV2?isStandaloneResource=${isStandaloneResource}`, '_blank')
        } else {
          snackBar.open("You are not authorized to view this content.")
        }
        break
      }
    }
  }

  constrctPayload(notification: any): any {
    let req: any = {
      applicationStatus: 'SEND_FOR_APPROVAL',
      deptName: this.orgName,
      limit: 50,
      serviceName: 'profile'
    }
    if (notification.sub_category === 'PROFILE_VERIFICATION') {
      req["requestType"] = ['GROUP_CHANGE', 'DESIGNATION_CHANGE']
    } else if (notification.sub_category === 'USER_TRANSFER') {
      req["requestType"] = ['ORG_TRANSFER']
    }
    return req
  }

  handleProfileCategory(notification: any, environment: any, snackBar: any): void {
    if (notification.sub_category === 'PROFILE_VERIFICATION' || notification.sub_category === 'USER_TRANSFER') {
      let payload = this.constrctPayload(notification)
      this.searchWorkflowSearch(payload).subscribe((res: any) => {
        let data = _.get(res, 'result.data', [])
        let pendingUser = data.find((item: any) => {
          return item.wfInfo[0] && item.wfInfo[0].userId === notification.message.data.id
        })
        if (pendingUser) {
          this.router.navigate([`app/home/approvals/approval`])
        } else if (notification.sub_category === 'PROFILE_VERIFICATION') {
          snackBar.open('This request has been resolved or is no longer available.')
        } else if (notification.sub_category === 'USER_TRANSFER') {
          snackBar.open('This request has been resolved or is no longer available.')
        }
      }, error => {
        console.error('Error while fetching workflow search data', error)
        snackBar.open('Error while fetching approval data')
      })
    } else if (['TRANSFER_UPDATE', 'PROFILE_UPDATE'].includes(notification.sub_category)) {
      let url = `${environment.portalsForNotifications.learner}/app/person-profile/me`
      window.open(url, '_blank')
    }
  }

  handleDiscussionCategory(notification: any, environment: any, roles: any): void {
    if (notification.sub_category === 'LEARN_DISCUSSION_POST_COMMENT' || notification.sub_category === 'LEARN_DISCUSSION_POST_REPLY') {
      if (roles.includes('CONTENT_CREATOR')) {
        let url = `${environment.portalsForNotifications.cbp}/author/content-detail/${notification.message.data.id}/overview-v2?preview=true&editMode=true&commentId=${notification.message.data.id}`
        window.open(url, '_blank')
      } else {
        let url = `${environment.portalsForNotifications.learner}/app/toc/${notification.message.data.id}?commentId=${notification.message.data.courseId}`
        window.open(url, '_blank')
      }
    } else {
      let url = `${environment.portalsForNotifications.learner}/app/discussion-forum-v2/community/${notification.message.data.communityId}/${notification.message.data.discussionId}`
      window.open(url, '_blank')
    }
  }

  handleEventCategory(notification: any, environment: any): void {
    if (notification.sub_category === 'EVENT_PUBLISHED') {
      let url = `${environment.portalsForNotifications.learner}/app/event-hub/home/${notification.message.data.id}`
      window.open(url, '_blank')
    } else if (notification.sub_category === 'EVENT_ENROLLED') {
      this.router.navigate([`/app/home/events`])
    }
  }

  handleRedirection(notification: any, environment: any, roles: any[], snackBar: any): void {
    if (notification.category === 'PROFILE') {
      this.handleProfileCategory(notification, environment, snackBar)
    } else if (notification.category === 'LEARN') {
      let url = `${environment.portalsForNotifications.learner}/app/toc/${notification.message.data.id}`
      if (notification.sub_category === 'EXTERNAL_TRAINING') {
        url = `${environment.portalsForNotifications.learner}/page/competency-passbook/list`
      }
      window.open(url, '_blank')
    } else if (notification.category === 'NETWORK') {
      this.handleNetworkRedirection(notification, snackBar, environment)
    } else if (notification.category === 'EVENT') {
      this.handleEventCategory(notification, environment)
      let url = `${environment.portalsForNotifications.learner}/app/event-hub/home/${notification.message.data.id}`
      window.open(url, '_blank')
    } else if (notification.category === 'DISCUSSION') {
      this.handleDiscussionCategory(notification, environment, roles)
    } else if (notification?.category?.includes('CONTENT')) {
      this.getContentData(notification.message.data.id).subscribe((res: any) => {
        let isStandaloneResource = false
        if (res.primaryCategory === 'Learning Resource' &&
          res.resourceCategory !== 'Learning Resource') {
          localStorage.setItem('isStandaloneResource', 'true')
          isStandaloneResource = true
        } else {
          localStorage.setItem('isStandaloneResource', 'false')
        }
        if (res.status === 'Live') {
          if (notification.sub_category === 'CONTENT_PUBLISHED' && res?.courseCategory === 'Comprehensive Assessment') {
            this.router.navigate([`/app/home/comprehensive-assessment/edit/${notification.message.data.id}`], {
              queryParams: { mode: 'view', preview: true, editMode: true, pathUrl: 'live', step: 'preview' },
            })
          } else {
            window.open(`${environment.portalsForNotifications.cbp}/author/content-detail/${notification.message.data.id}/overview-v2?isStandaloneResource=${isStandaloneResource}`, '_blank')
          }
        } else if (res.status === 'Draft') {
          if (roles.includes('CONTENT_CREATOR')) {
            window.open(`${environment.portalsForNotifications.cbp}/author/editor/${notification.message.data.id}/collectionV2?isStandaloneResource=${isStandaloneResource}`, '_blank')
          } else {
            snackBar.open('You are not authorized to view this content.')
          }
        } else if (res.status === 'Review') {
          this.handleReviewStatus(res, notification, isStandaloneResource, roles, environment, snackBar)
        } else if (res.status === 'Retired') {
          snackBar.open('This content is retired.')
        }
      })
    } else {
      this.router.navigate(['/app/home/notifications'])
    }
  }
}
