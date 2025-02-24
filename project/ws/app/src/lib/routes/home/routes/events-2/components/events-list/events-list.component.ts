import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { Subscription } from 'rxjs'
import { events } from '../../models/events.model'
import { EventsService } from '../../services/events.service'
import * as _ from 'lodash'
import { MatLegacyDialog } from '@angular/material/legacy-dialog'
import { RejectionReasonComponent } from '../../dialogs/rejection-reason/rejection-reason.component'
import { DatePipe } from '@angular/common'
import { ConfirmDialogComponent } from '../../../../../workallocation-v2/components/confirm-dialog/confirm-dialog.component'

@Component({
  selector: 'ws-app-events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.scss']
})
export class EventsListComponent implements OnInit, OnDestroy {
  //#region (global variables)
  tableData!: events.tableData
  paginationDetails!: events.pagination
  menuItems!: events.menuItems[]
  eventsList: any[] = []
  getEventSubscription!: Subscription
  showEventsLoader = false
  searchKey = ''
  pathUrl = ''
  userProfile: any
  //#endregion

  //#region (constructor)
  constructor(
    private eventSvc: EventsService,
    private matSnackBar: MatSnackBar,
    private activatedRoute: ActivatedRoute,
    private route: Router,
    private dialog: MatLegacyDialog,
    private datePipe: DatePipe
  ) { }
  //#endregion

  //#region (onInint)
  ngOnInit(): void {
    this.initialization()
  }

  initialization() {
    this.pathUrl = _.get(this.activatedRoute, 'snapshot.url[0].path', 'pending-approval')
    this.userProfile = _.get(this.activatedRoute, 'snapshot.data.configService.userProfile')
    switch (this.pathUrl) {
      case 'upcoming':
        this.tableData = {
          columns: [
            { displayName: 'Event Name', key: 'name', cellType: 'textImage', imageKey: 'appIcon', cellClass: 'text-overflow-elipse' },
            { displayName: 'Start Date', key: 'startDate', cellType: 'date' },
            { displayName: 'Created By', key: 'createdByName', cellType: 'text' },
            { displayName: 'Published On', key: 'publishedOn', cellType: 'date' }
            // { displayName: 'Enrollments', key: 'enrollments', cellType: 'number' },
            // { displayName: 'Certificates', key: 'certificates', cellType: 'number' },
          ],
          showSearchBox: true,
          showPagination: true,
          noDataMessage: 'There are no upcoming events.'
        }

        this.menuItems = [
          {
            btnText: 'View',
            action: 'view',
          },
          // {
          //   btnText: 'Start Broadcast',
          //   action: 'broadcast',
          // },
          {
            btnText: 'Cancel',
            action: 'cancel',
          },
        ]
        break
      case 'draft':
        this.tableData = {
          columns: [
            { displayName: 'Event Name', key: 'name', cellType: 'textImage', imageKey: 'appIcon', cellClass: 'text-overflow-elipse' },
            { displayName: 'Start Date', key: 'startDate', cellType: 'date' },
            { displayName: 'Created By', key: 'createdByName', cellType: 'text' },
            { displayName: 'Created On', key: 'createdOn', cellType: 'date' },
          ],
          showSearchBox: true,
          showPagination: true,
          noDataMessage: 'There are no draft events.'
        }

        this.menuItems = [
          {
            btnText: 'View',
            action: 'view',
          },
          {
            btnText: 'Edit',
            action: 'edit',
          },
          {
            btnText: 'Cancel',
            action: 'cancel',
          },
        ]
        break
      case 'pending-approval':
        this.tableData = {
          columns: [
            { displayName: 'Event Name', key: 'name', cellType: 'textImage', imageKey: 'appIcon', cellClass: 'text-overflow-elipse' },
            { displayName: 'Start Date', key: 'startDate', cellType: 'date' },
            { displayName: 'Created By', key: 'createrEmail', cellType: 'text' },
            { displayName: 'Created On', key: 'createdOn', cellType: 'date' },
            { displayName: 'Submitted On', key: 'submitedOn', cellType: 'date' },
          ],
          showSearchBox: true,
          showPagination: true,
          noDataMessage: 'There are no pending events.'
        }

        this.menuItems = [
          {
            btnText: 'View',
            action: 'view',
          },
          // {
          //   btnText: 'Edit',
          //   action: 'edit',
          // },
          {
            btnText: 'Cancel',
            action: 'cancel',
          },
        ]

        break
      case 'past':
        this.tableData = {
          columns: [
            { displayName: 'Event Name', key: 'name', cellType: 'textImage', imageKey: 'appIcon', cellClass: 'text-overflow-elipse' },
            { displayName: 'Start Date', key: 'startDate', cellType: 'date' },
            { displayName: 'Created By', key: 'createdByName', cellType: 'text' },
            { displayName: 'Published On', key: 'publishedOn', cellType: 'date' }
            // { displayName: 'Enrollments', key: 'enrollments', cellType: 'text' },
            // { displayName: 'Certificates', key: 'certificates', cellType: 'text' },
          ],
          showSearchBox: true,
          showPagination: true,
          noDataMessage: 'There are no past events.'
        }

        this.menuItems = [
          {
            btnText: 'View',
            action: 'view',
          }
        ]
        break
      case 'canceled':
        this.tableData = {
          columns: [
            { displayName: 'Event Name', key: 'name', cellType: 'textImage', imageKey: 'appIcon', cellClass: 'text-overflow-elipse' },
            { displayName: 'Start Date', key: 'startDate', cellType: 'date' },
            { displayName: 'Created By', key: 'createdByName', cellType: 'text' },
            { displayName: 'Created On', key: 'createdOn', cellType: 'date' },
            { displayName: 'Cancelled On', key: 'cancelledOn', cellType: 'date' },
            { displayName: 'Cancelled By', key: 'cancelledByName', cellType: 'text' },
          ],
          showSearchBox: true,
          showPagination: true,
          noDataMessage: 'There are no rejected events.'
        }

        this.menuItems = [
          {
            btnText: 'View',
            action: 'view',
          }
        ]
        break
      case 'rejected':
        this.tableData = {
          columns: [
            { displayName: 'Event Name', key: 'name', cellType: 'textImage', imageKey: 'appIcon', cellClass: 'text-overflow-elipse' },
            { displayName: 'Start Date', key: 'startDate', cellType: 'date' },
            { displayName: 'Created By', key: 'createdByName', cellType: 'text' },
            { displayName: 'Created On', key: 'createdOn', cellType: 'date' },
            { displayName: 'Rejected On', key: 'rejectedOn', cellType: 'date' },
          ],
          showSearchBox: true,
          showPagination: true,
          noDataMessage: 'There are no rejected events.'
        }

        this.menuItems = [
          {
            btnText: 'Edit',
            action: 'edit',
          },
          {
            btnText: 'View Remarks',
            action: 'remarks',
          },
        ]
        break
    }

    this.paginationDetails = {
      startIndex: 0,
      lastIndex: 20,
      pageSize: 20,
      pageIndex: 0,
      totalCount: 20,
    }
    this.getEvents()
  }

  getEvents() {
    const requestObj: any = {
      locale: [
        'en',
      ],
      request: {
        query: this.searchKey,
        limit: _.get(this.paginationDetails, 'pageSize', 20),
        offset: _.get(this.paginationDetails, 'pageIndex', 0),
        filters: {
          status: ['Live'],
          contentType: 'Event',
          createdFor: _.get(this.userProfile, 'rootOrgId', '')

        },
        sort_by: {
          lastUpdatedOn: 'desc',
        },
      },
    }

    const today = new Date()
    const year = today.getFullYear()
    const month = (today.getMonth() + 1).toString().padStart(2, '0') // Months are 0-indexed
    const day = today.getDate().toString().padStart(2, '0')

    switch (this.pathUrl) {
      case 'upcoming':
        requestObj.request.filters.status = ['Live']
        requestObj.request.filters['startDate'] = {
          '>=': `${year}-${month}-${day}`
        }
        requestObj.request.filters['endTime'] = {
          '>=': this.formattedCurrentTime
        }
        break
      case 'draft':
        requestObj.request.filters.status = ['Draft']
        break
      case 'pending-approval':
        requestObj.request.filters.status = ['SentToPublish']
        break
      case 'past':
        requestObj.request.filters.status = ['Live']
        requestObj.request.filters['endDate'] = {
          '<=': `${year}-${month}-${day}`
        }
        requestObj.request.filters['endTime'] = {
          '<': this.formattedCurrentTime
        }
        break
      case 'canceled':
        requestObj.request.filters.status = ['Cancelled']
        break
      case 'rejected':
        requestObj.request.filters.status = ['Rejected']
        break
    }

    if (this.getEventSubscription) {
      this.getEventSubscription.unsubscribe()
    }
    this.showEventsLoader = true
    this.getEventSubscription = this.eventSvc.getEvents(requestObj).subscribe(
      {
        next: (res: any) => {
          this.showEventsLoader = false
          this.eventsList = _.get(res, 'Event', [])
          this.paginationDetails['totalCount'] = _.get(res, 'count', 0)
        },
        error: (error: HttpErrorResponse) => {
          this.showEventsLoader = false
          const errorMessage = _.get(error, 'error.message', 'Some thing went wrong')
          this.openSnackBar(errorMessage)
        }
      }
    )
  }

  get formattedCurrentTime(): string {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const seconds = now.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}+05:30`
  }
  //#endregion

  //#region (ui interactions like click)
  searchEvents(searchKey: string) {
    this.searchKey = searchKey
    this.getEvents()
  }

  onPageChange(paginationDetails: events.pagination) {
    this.paginationDetails = paginationDetails
    this.getEvents()
  }

  contentEvents(events: any) {
    if (events && events.action && events.rows) {
      switch (events.action) {
        case 'view':
          this.navigateToEditEvent(_.get(events, 'rows.identifier'), 'view')
          break
        case 'edit':
          this.navigateToEditEvent(_.get(events, 'rows.identifier'), 'edit')
          break
        case 'cancel':
          this.openConforamtionPopup(events.rows)
          break
        case 'remarks':
          this.openRejectionPopup(events.rows)
          break
        case 'broadcast':
          break
      }
    }
  }

  navigateToEditEvent(eventId: string, openMode: string) {
    this.route.navigate([`/app/home/events/edit-event`, eventId], {
      queryParams: {
        mode: openMode,
        pathUrl: this.pathUrl
      }
    })
  }

  openConforamtionPopup(rowData: any) {
    const dialgData = {
      dialogType: 'warning',
      icon: {
        iconName: 'error_outline',
        iconClass: 'warning-icon'
      },
      message: 'Are you sure that you want to cancel this event?',
      buttonsList: [
        {
          btnAction: false,
          displayText: 'No',
          btnClass: 'btn-outline-primary'
        },
        {
          btnAction: true,
          displayText: 'Yes',
          btnClass: 'successBtn'
        },
      ]
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      height: '210px',
      data: dialgData,
      autoFocus: false
    })

    dialogRef.afterClosed().subscribe((btnAction: any) => {
      if (btnAction) {
        this.cancelEvent(rowData)
      }
    })
  }

  cancelEvent(rowData: any) {
    const requestBody = {
      request: {
        event: {
          identifier: rowData.identifier,
          versionKey: rowData.versionKey,
          status: 'Cancelled',
          cancelledOn: this.datePipe.transform(new Date(), 'dd MMM,yyyy'),
          cancelledByName: _.get(this.userProfile, 'givenName', _.get(this.userProfile, 'firstName', '')),
          cancelledBy: _.get(this.userProfile, 'userId', '')
        }
      }
    }
    this.eventSvc.updateEvent(requestBody, rowData.identifier).subscribe({
      next: res => {
        if (res) {
          this.openSnackBar('event is cancelled successfully')
          this.getEvents()
        }
      },
      error: (error: HttpErrorResponse) => {
        const errorMessage = _.get(error, 'error.message', 'Something went wrong please try again')
        this.openSnackBar(errorMessage)
      }
    })
  }

  openRejectionPopup(rowData: any) {
    const remarks = _.get(rowData, 'rejectComment')
    if (remarks) {
      this.dialog.open(RejectionReasonComponent, {
        minHeight: '200px',
        minWidth: '400px',
        data: remarks
      })
    }
  }

  //#endregion

  private openSnackBar(message: string) {
    this.matSnackBar.open(message)
  }

  ngOnDestroy(): void {
    if (this.getEventSubscription) {
      this.getEventSubscription.unsubscribe()
    }
  }
}
