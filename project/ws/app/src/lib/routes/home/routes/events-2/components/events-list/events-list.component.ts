import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { ActivatedRoute } from '@angular/router'
import _ from 'lodash'
import { Subscription } from 'rxjs'
import { events } from '../../models/events.model'
import { EventsService } from '../../services/events.service'

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
  //#endregion

  //#region (constructor)
  constructor(
    private eventSvc: EventsService,
    private matSnackBar: MatSnackBar,
    private activatedRoute: ActivatedRoute
  ) { }
  //#endregion

  //#region (onInint)
  ngOnInit(): void {
    this.initialization()
  }

  initialization() {
    this.pathUrl = _.get(this.activatedRoute, 'snapshot.url[0].path', 'pending-approval')
    switch (this.pathUrl) {
      case 'upcoming':
        this.tableData = {
          columns: [
            { displayName: 'Event Name', key: 'name', cellType: 'text', imageKey: 'appIcon', cellClass: 'text-overflow-elipse' },
            { displayName: 'Start Date', key: 'startDate', cellType: 'date' },
            { displayName: 'Created By', key: 'createdByName', cellType: 'text' },
            { displayName: 'Published On', key: 'publishedOn', cellType: 'date' },
            { displayName: 'Enrollments', key: 'enrollments', cellType: 'number' },
            { displayName: 'Certificates', key: 'certificates', cellType: 'number' },
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
          {
            btnText: 'Start Broadcast',
            action: 'broadcast',
          },
          {
            btnText: 'Cancel',
            action: 'cancel',
          },
        ]
        break
      case 'draft':
        this.tableData = {
          columns: [
            { displayName: 'Event Name', key: 'name', cellType: 'text', imageKey: 'appIcon', cellClass: 'text-overflow-elipse' },
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
          }
        ]
        break
      case 'pending-approval':
        this.tableData = {
          columns: [
            { displayName: 'Event Name', key: 'name', cellType: 'text', imageKey: 'appIcon', cellClass: 'text-overflow-elipse' },
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
      case 'past':
        this.tableData = {
          columns: [
            { displayName: 'Event Name', key: 'name', cellType: 'text', imageKey: 'appIcon', cellClass: 'text-overflow-elipse' },
            { displayName: 'Start Date', key: 'startDate', cellType: 'date' },
            { displayName: 'Created By', key: 'createdByName', cellType: 'text' },
            { displayName: 'Published On', key: 'publishedOn', cellType: 'date' },
            { displayName: 'Enrollments', key: 'enrollments', cellType: 'text' },
            { displayName: 'Certificates', key: 'certificates', cellType: 'text' },
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
            { displayName: 'Event Name', key: 'name', cellType: 'text', imageKey: 'appIcon', cellClass: 'text-overflow-elipse' },
            { displayName: 'Start Date', key: 'startDate', cellType: 'date' },
            { displayName: 'Created By', key: 'createdByName', cellType: 'text' },
            { displayName: 'Created On', key: 'createdOn', cellType: 'date' },
            { displayName: 'Cancelled On', key: 'rejectedOn', cellType: 'date' },
            { displayName: 'Cancelled By', key: 'createdByName', cellType: 'text' },
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
      case 'rejected':
        this.tableData = {
          columns: [
            { displayName: 'Event Name', key: 'name', cellType: 'text', imageKey: 'appIcon', cellClass: 'text-overflow-elipse' },
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
        requestObj.request.filters['endDate'] = {
          '>=': `${year}-${month}-${day}`
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
          '<': `${year}-${month}-${day}`
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
    console.log(events)
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
