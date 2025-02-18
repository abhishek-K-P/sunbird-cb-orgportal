import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core'
import { FormControl } from '@angular/forms'
import { PageEvent } from '@angular/material/paginator'
import { MatTableDataSource } from '@angular/material/table'
import _ from 'lodash'
import { debounceTime } from 'rxjs/operators'
import { events } from '../../models/events.model'
import { MatSort } from '@angular/material/sort'

@Component({
  selector: 'ws-app-events-table',
  templateUrl: './events-table.component.html',
  styleUrls: ['./events-table.component.scss']
})
export class EventsTableComponent implements OnInit, OnChanges {
  @ViewChild(MatSort, { static: false }) sort!: MatSort
  @Input() tableData!: events.tableData
  @Input() data?: []
  @Input() paginationDetails: events.pagination = {
    startIndex: 0,
    lastIndex: 20,
    pageSize: 20,
    pageIndex: 0,
    totalCount: 20,
  }
  @Input() menuItems: events.menuItems[] = []
  @Input() showLoader = false
  @Output() actionsClick = new EventEmitter<any>()
  @Output() searchKey = new EventEmitter<string>()
  @Output() pageChange = new EventEmitter<any>()

  searchControl = new FormControl()
  showSearchBox = true
  displayedColumns: any
  dataSource!: any
  pageSizeOptions = [20, 30, 40]
  columnsList: any = []
  tableColumns = []
  noDataMessage = 'No data found'
  showPagination = true

  constructor() {
    this.dataSource = new MatTableDataSource<any>()
  }

  ngOnInit() {
    if (this.tableData) {
      this.displayedColumns = this.tableData.columns
      this.showSearchBox = _.get(this.tableData, 'showSearchBox', true)
      this.noDataMessage = _.get(this.tableData, 'noDataMessage', 'No data found')
      this.showPagination = _.get(this.tableData, 'showPagination', true)
    }

    this.searchControl.valueChanges
      .pipe(debounceTime(500)) // Adjust the debounce time as needed
      .subscribe(value => this.searchKey.emit(value))
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.tableData) {
      this.getFinalColumns()
    }
    if (changes.data && this.dataSource) {
      this.dataSource.data = this.data
      setTimeout(() => {
        this.dataSource.sort = this.sort
      }, 10)
    }
  }

  getFinalColumns() {
    this.columnsList = []
    const columns = JSON.parse(JSON.stringify(this.tableData.columns))
    if (this.menuItems.length > 0) {
      const selectColumn = { displayName: 'Actions', key: 'menu', cellType: 'menu' }
      columns.push(selectColumn)
    }
    this.tableColumns = columns
    this.columnsList = _.map(columns, c => c.key)
  }

  buttonClick(action: string, rows: any) {
    if (this.tableData) {
      this.actionsClick.emit({ action, rows })
    }
  }

  onChangePage(pe: PageEvent) {
    this.paginationDetails.startIndex = pe.pageIndex * pe.pageSize
    this.paginationDetails.lastIndex = (pe.pageIndex + 1) * pe.pageSize
    this.paginationDetails.pageSize = pe.pageSize
    this.paginationDetails.pageIndex = pe.pageIndex

    this.pageChange.emit(this.paginationDetails)
  }
}
