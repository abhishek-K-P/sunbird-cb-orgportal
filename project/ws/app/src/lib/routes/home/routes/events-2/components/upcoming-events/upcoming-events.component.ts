//#region (imports)
import { Component, OnDestroy, OnInit } from '@angular/core'
import { events } from '../../models/events.model'
import { EventsService } from '../../services/events.service'
import { Subscription } from 'rxjs'
import * as _ from 'lodash'
import { HttpErrorResponse } from '@angular/common/http'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
//#endregion

@Component({
  selector: 'ws-app-upcoming-events',
  templateUrl: './upcoming-events.component.html',
  styleUrls: ['./upcoming-events.component.scss']
})
export class UpcomingEventsComponent implements OnInit, OnDestroy {
  //#region (global variables)
  tableData!: events.tableData
  paginationDetails!: events.pagination
  menuItems!: events.menuItems[]
  eventsList: any[] = []
  getEventSubscription!: Subscription
  showEventsLoader = false
  searchKey = ''
  //#endregion

  //#region (constructor)
  constructor(
    private eventSvc: EventsService,
    private matSnackBar: MatSnackBar
  ) { }
  //#endregion

  //#region (onInint)
  ngOnInit(): void {
    this.initialization()
    this.getEvents()
  }

  initialization() {
    this.tableData = {
      columns: [
        { displayName: 'Event Name', key: 'name', cellType: 'text', imageKey: 'appIcon', cellClass: 'text-overflow-elipse' },
        { displayName: 'Start Date', key: 'startDate', cellType: 'date' },
        { displayName: 'Created On', key: 'createdOn', cellType: 'date' },
        { displayName: 'Created By', key: 'createdByName', cellType: 'text' },
        { displayName: 'Submitted On', key: 'submitedOn', cellType: 'date' },
      ],
      showSearchBox: true,
      showPagination: true,
      noDataMessage: 'There are no upcoming events.'
    }

    this.paginationDetails = {
      startIndex: 0,
      lastIndex: 20,
      pageSize: 20,
      pageIndex: 0,
      totalCount: 20,
    }

    this.menuItems = [
      {
        btnText: 'Edit',
        action: 'edit',
      },
    ]
  }

  getEvents() {
    const requestObj = {
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
          startDate: 'desc',
        },
      },
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
