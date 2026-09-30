import { Component, OnInit, ViewChild } from '@angular/core'
import { MatTableDataSource } from '@angular/material/table'
/* tslint:disable */
import * as _ from 'lodash'
import { AICBPRequestService } from '../../../services/ai-cbp-request.service'
import { ViewNonMappingDesignationComponent } from '../view-non-mapping-designation/view-non-mapping-designation.component'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { MatPaginator } from '@angular/material/paginator'
import {
  ConfigurationsService
} from '@sunbird-cb/utils-v2'

/* tslint:enable */
export enum statusValue {
  Assigned = 'Assigned',
  Unassigned = 'Unassigned',
  Inprogress = 'InProgress',
  invalid = 'Invalid',
  fullfill = 'Fulfill',
}
@Component({
  selector: 'ws-ai-cbp-request-list',
  templateUrl: './ai-cbp-request-list.component.html',
  styleUrls: ['./ai-cbp-request-list.component.scss'],
  standalone: false
})
export class AICBPRequestListComponent implements OnInit {
  searchText = '';
  selectedStatus = '';
  selectedAssignee = '';
  selectedTime = '';

  statusList: string[] = [];
  assigneeList: string[] = [];

  originalData: any[] = [];
  pageNo = 1
  pageSize = 5

  defaultPageSizeOptions = [5, 10, 20, 25, 50, 100]
  showRejectPopupFlag = false
  rejectionDetail: any = {}
  @ViewChild(MatPaginator) paginator!: MatPaginator
  constructor(public aicbpRequestSvc: AICBPRequestService, public dialog: MatDialog,
    private router: Router,
    private configSvc: ConfigurationsService
  ) {

  }

  displayedColumns: string[] = [
    'RequestId',
    'title',
    'requestor',
    'department_name',
    'requestStatus',
    'requestedOn',
    'interests',
    'action',
  ]

  staticRequestList: any[] = [

  ]
  dataSource!: MatTableDataSource<any>
  requestCount: number = 0



  ngOnInit() {
    this.loadStaticTableData()
  }
  getDateRange(): { from_date: string | undefined, to_date: string | undefined } {
    const now = new Date()
    const toDate = now.toISOString().split('T')[0]

    switch (this.selectedTime) {
      case 'today': {
        return { from_date: toDate, to_date: toDate }
      }
      case '7days': {
        const fromDate = new Date(now)
        fromDate.setDate(now.getDate() - 7)
        return { from_date: fromDate.toISOString().split('T')[0], to_date: toDate }
      }
      case '30days': {
        const fromDate = new Date(now)
        fromDate.setDate(now.getDate() - 30)
        return { from_date: fromDate.toISOString().split('T')[0], to_date: toDate }
      }
      default:
        return { from_date: undefined, to_date: undefined }
    }
  }

  loadStaticTableData() {
    this.staticRequestList = []
    if (this.searchText) {
      this.pageNo = 1
    }


    const { from_date, to_date } = this.getDateRange()

    this.aicbpRequestSvc.getApprovalRequests(this.pageNo,
      this.pageSize, this.searchText, this.selectedStatus, from_date, to_date).subscribe((requests: any) => {

        console.log('API Response:', requests)

        requests?.items?.forEach((request: any) => {
          this.staticRequestList.push({
            demand_id: request.id,
            title: request.request_name,
            ownerName: (request.user && request.user.email) ? request.user.email : 'N/A',
            department_name: request.department_name || 'N/A',
            requestType: 'N/A',
            status: request.status || 'N/A',
            assignedProvider: request.assignedProvider || 'Unassigned',
            createdOn: new Date(request.created_at),
            interestCount: request.designation_count || 0,
            reviewer_comments: request.reviewer_comments || 'No Reason Found',
          })
        })

        // IMPORTANT
        this.originalData = [...this.staticRequestList]

        this.prepareFilters(this.originalData)

        this.dataSource = new MatTableDataSource(this.originalData)

        this.requestCount = requests?.pagination?.total_items || 0

        console.log({
          pageNo: this.pageNo,
          pageSize: this.pageSize,
          requestCount: this.requestCount,
          itemsLength: requests?.items?.length,
          paginatorIndex: this.paginator?.pageIndex
        })
        this.dataSource =
          new MatTableDataSource(this.staticRequestList)

        if (this.paginator) {
          const maxPage = Math.max(
            0,
            Math.ceil(this.requestCount / this.pageSize) - 1
          )

          if (this.paginator.pageIndex > maxPage) {
            this.paginator.firstPage()
            this.pageNo = 1
          }
        }
      })
  }

  viewNonMatchingDesignation() {
    const dialogRef = this.dialog.open(ViewNonMappingDesignationComponent, {
      maxHeight: 'auto',
      height: '65%',
      width: '80%',
      panelClass: 'remove-pad',
    })
    dialogRef.afterClosed().subscribe((response: any) => {
      console.log('Dialog closed with response:', response)

    })
  }

  viewACBPRoleMapping(element: any) {
    console.log('this.configSvc', this.configSvc)
    this.router.navigateByUrl('app/home/ai-cbp-requests/acbp-list/review-request/' + element.demand_id + '?source=mdo', {
      state: {
        configData: {
          userData: this.configSvc.unMappedUser,
          configData: this.configSvc.globalConfig,
          requestRowData: element,
          fromPortal: 'mdo'
        },
      },
    })
  }

  prepareFilters(data: any[]) {

    this.statusList = [

      "Approved", "Rejected", "Pending"
    ]

    this.assigneeList = [
      ...new Set(
        data
          .map(item => item?.assignedProvider)
          .filter(Boolean)
      )
    ]
  }

  applyFilters() {
    this.loadStaticTableData()
  }

  clearSearch() {
    this.searchText = ''
    this.loadStaticTableData()
  }

  onChangePage(event: any) {
    this.pageNo = event.pageIndex + 1
    this.pageSize = event.pageSize

    this.loadStaticTableData()
  }

  showRejectionSummary(element: any) {
    this.showRejectPopupFlag = true
    this.rejectionDetail = element
    console.log('Rejection Detail =>', this.rejectionDetail)
  }

  closeRejectPopup() {
    this.showRejectPopupFlag = false
  }

  clearAllFilters() {
    this.searchText = ''
    this.selectedStatus = ''
    this.selectedTime = ''
    this.pageNo = 1
    if (this.paginator) {
      this.paginator.firstPage()
    }
    this.loadStaticTableData()
  }





}
