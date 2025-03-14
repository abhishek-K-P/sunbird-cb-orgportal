import { Component, OnInit, OnChanges, ViewChild, SimpleChanges, Input } from '@angular/core'
import { SelectionModel } from '@angular/cdk/collections'
import { MatTableDataSource } from '@angular/material/table'
import { MatPaginator, MatDialogConfig, MatDialog, MatSnackBar } from '@angular/material'
import { MatSort } from '@angular/material/sort'
import { IColums, ITableData } from '../../interface/interfaces'
import * as _ from 'lodash'
import { AdduserpopupComponent } from '../adduserpopup/adduserpopup.component'
import { MdoInfoService } from '../../services/mdoinfo.service'
// import { ConfigurationsService } from '@sunbird-cb/utils'
import { Router } from '@angular/router'
import { ProfileV2UtillService } from '../../services/home-utill.service'

@Component({
  selector: 'ws-app-admintable',
  templateUrl: './admintable.component.html',
  styleUrls: ['./admintable.component.scss'],
})
export class AdmintableComponent implements OnInit, OnChanges {
  tableData: ITableData = {
    actions: [],
    columns: [
      { displayName: 'Sr. no.', key: 'srnumber' },
      { displayName: 'Full name', key: 'fullname' },
      { displayName: 'Position', key: 'position', isList: true },
      { displayName: 'Email', key: 'email' },
    ],
    needCheckBox: false,
    needHash: false,
    sortColumn: 'fullname',
    sortState: 'asc',
    needUserMenus: true,
  }
  data: any = []
  dataSource!: any
  widgetData: any
  length!: number
  pageSize = 20
  pageSizeOptions = [20, 40, 60, 80, 100]
  displayedColumns: IColums[] | undefined
  selection = new SelectionModel<any>(true, [])
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator
  usersData: any = []
  usersData1: any
  @Input() deptID: any
  // tslint:disable-next-line:max-line-length
  @ViewChild(MatSort, { static: false }) set matSort(sort: MatSort) {
    if (!this.dataSource.sort) {
      this.dataSource.sort = sort
    }
  }

  constructor(public dialog: MatDialog, private snackBar: MatSnackBar,
              private mdoinfoSrvc: MdoInfoService, private router: Router,
              private profileUtilSvc: ProfileV2UtillService) {
    this.dataSource = new MatTableDataSource<any>()
    this.dataSource.paginator = this.paginator

    // if (this.configSvc.userProfile) {
    //   this.deptID = this.configSvc.userProfile.rootOrgId
    // this.getUsers('MDO_ADMIN')
    // } else if (_.get(this.activeRoute, 'snapshot.data.configService.userProfile.rootOrgId')) {
    // this.deptID = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.rootOrgId')
    // this.getUsers('MDO_ADMIN')
    // }
  }

  ngOnInit() {
    if (this.tableData) {
      this.displayedColumns = this.tableData.columns
    }
    // if (this.deptID) {
    this.getUsers('MDO_ADMIN')
    // }
  }

  ngOnChanges(data: SimpleChanges) {
    this.dataSource.data = _.get(data, 'data.currentValue')
    this.length = this.dataSource.data && this.dataSource.data.length > 0 ? this.dataSource.data.length : 0
    this.paginator.firstPage()
  }

  getAllUsers(orgID: any) {
    const filterObj = {
      request: {
        query: '',
        filters: {
          rootOrgId: orgID,
        },
      },
    }
    this.mdoinfoSrvc.getAllUsers(filterObj).subscribe(
      (res: any) => {
        // this.usersData = res.content
        this.filterAllUsers(res.content)
      })
  }

  filterAllUsers(allusers: any) {
    if (this.data && this.data.length > 0) {
      allusers.forEach((usr: any) => {
        if (this.data.indexOf(usr.id) === -1) {
          this.usersData.push(usr)
        }
      })
    } else {
      this.usersData = allusers
    }
  }

  getUsers(role: any) {
    if (role) {
      this.data = []
      const req = {
        request: {
          filters: {
            rootOrgId: this.deptID,
            'roles.role': [
              role,
            ],
          },
        },
      }
      this.mdoinfoSrvc.getTeamUsers(req).subscribe(
        (res: any) => {
          if (res.result.response.content.length > 0) {
            res.result.response.content.sort((a: any, b: any) => {
              const textA = a.firstName.toUpperCase()
              const textB = b.firstName.toUpperCase()
              return (textA < textB) ? -1 : (textA > textB) ? 1 : 0
            })
            const result = res.result.response.content
            this.usersData1 = result
          }
          this.data = []
          if (this.usersData1.length > 0) {
            let pos = ''
            this.usersData1.forEach((user: any, index: any) => {
              if (user.profileDetails && user.profileDetails.professionalDetails && user.profileDetails.professionalDetails.length > 0) {
                pos = user.profileDetails.professionalDetails[0].designation
              }
              const obj = {
                srnumber: index + 1,
                fullname: `${user.firstName}`,
                // fullname: `${user.firstName} ${user.lastName}`,
                email: this.profileUtilSvc.emailTransform(user.email),
                position: pos,
                id: user.id,
              }
              this.data.push(obj)
            })

            if (this.data) {
              this.dataSource.data = this.data
              this.dataSource.paginator = this.paginator
              this.getAllUsers(this.deptID)
            }
          } else {
            this.getAllUsers(this.deptID)
          }
        },
        (_err: any) => {
        })
    }
  }

  // buttonClick(action: string, row: any) {
  //   if (this.tableData) {
  //     const isDisabled = _.get(_.find(this.tableData.actions, ac => ac.name === action), 'disabled') || false
  //     if (!isDisabled && this.actionsClick) {
  //       this.actionsClick.emit({ action, row })
  //     }
  //   }
  // }

  getFinalColumns() {
    if (this.tableData !== undefined) {
      const columns = _.map(this.tableData.columns, c => c.key)
      if (this.tableData.needCheckBox) {
        columns.splice(0, 0, 'select')
      }
      if (this.tableData.needHash) {
        columns.splice(0, 0, 'SR')
      }
      if (this.tableData.needUserMenus) {
        columns.push('Menu')
      }
      return columns
    }
    return ''
  }

  // onRowClick(e: any) {
  // }

  adduser() {
    const dialogConfig = new MatDialogConfig()
    dialogConfig.disableClose = true
    dialogConfig.autoFocus = true
    dialogConfig.width = '76%'
    dialogConfig.height = '72%'
    dialogConfig.maxHeight = 'auto'
    dialogConfig.data = {
      data: this.usersData,
    }
    const dialogRef = this.dialog.open(AdduserpopupComponent, dialogConfig)
    dialogRef.afterClosed().subscribe((response: any) => {
      if (response && response.data && response.data.length > 0) {
        response.data.forEach((seluser: any) => {
          this.usersData.forEach((user: any) => {
            if (seluser.id === user.id) {
              this.assignRole(user)
            }
          })
        })
      }
    })
  }

  assignRole(user: any) {
    let nroles: any = []
    nroles = user.organisations[0].roles
    nroles.push('MDO_ADMIN')
    const obj = {
      request: {
        organisationId: this.deptID,
        userId: user.id,
        roles: nroles,
      },
    }
    this.mdoinfoSrvc.assignTeamRole(obj).subscribe(
      () => {
        this.openSnackbar('User is added successfully!')
        this.getUsers('MDO_ADMIN')
      })
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

  applyFilter(filterValue: any) {
    if (filterValue) {
      let fValue = filterValue.trim()
      fValue = filterValue.toLowerCase()
      this.dataSource.filter = fValue
    } else {
      this.dataSource.filter = ''
    }
  }

  updateData(rowdata: any) {
    this.router.navigate([`/app/users/${rowdata.id}/details`], { queryParams: { param: 'MDOinfo', path: 'Leadership' } })
  }
}
