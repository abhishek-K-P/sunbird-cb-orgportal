import { Component, ChangeDetectorRef, Input, ElementRef, EventEmitter, OnInit, Output, QueryList, ViewChildren, ChangeDetectionStrategy, AfterContentChecked } from '@angular/core'
import { TrainingPlanService } from './../../services/traininig-plan.service'
import { UntypedFormControl } from '@angular/forms'
import { TrainingPlanDataSharingService } from '../../services/training-plan-data-share.service'
import { ICompentencyKeys } from '../../../home/interface/interfaces'
import { InitService } from '../../../../../../../../../src/app/services/init.service'
import { environment } from '../../../../../../../../../src/environments/environment'
@Component({
  selector: 'ws-app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterComponent implements OnInit, AfterContentChecked {
  @Output() toggleFilter = new EventEmitter()
  // @Output() getFilterData = new EventEmitter()
  @Input() from: any
  designationList: any = []
  providersList: any[] = []
  selectedProviders: any[] = []
  competencyTypeList = [
    { id: 'Behavioural', name: 'Behavioural' },
    { id: 'Functional', name: 'Functional' },
    { id: 'Domain', name: 'Domain' },
  ]
  groupList: any = [
    { id: 'groupA', name: 'Group A' },
    { id: 'groupB', name: 'Group B' },
    { id: 'groupC', name: 'Group C' },
    { id: 'groupD', name: 'Group D' },
    { id: 'contractualStaff', name: 'Contractual Staff' },
    { id: 'others', name: 'Others' },
  ]
  competencyList: any = []
  competencyThemeList: any[] = []
  competencySubThemeList: any[] = []
  filterObj: any
  assigneeFilterObj: any = { group: [], designation: [] }
  searchThemeControl = new UntypedFormControl()
  searchSubThemeControl = new UntypedFormControl()
  searchProviderControl = new UntypedFormControl()
  @ViewChildren('checkboxes') checkboxes!: QueryList<ElementRef>
  compentencyKey!: ICompentencyKeys
  constructor(
    private cdref: ChangeDetectorRef,
    private trainingPlanService: TrainingPlanService,
    private tpdsSvc: TrainingPlanDataSharingService,
    private initService: InitService
  ) { }

  ngOnInit() {
    this.compentencyKey = this.initService.configSvc.competency[environment.compentencyVersionKey]
    this.filterObj = {
      [this.compentencyKey.vCompetencyArea]: [],
      [this.compentencyKey.vCompetencyTheme]: [],
      [this.compentencyKey.vCompetencySubTheme]: [],
      providers: [],

    }
    this.tpdsSvc.filterToggle.subscribe((data: any) => {
      if (data && data.status) {
        if (data.from === 'content') {
          this.getFilterEntity()
          this.getProviders()
        } else {
          // if(this.tpdsSvc.trainingPlanAssigneeData &&
          //   this.tpdsSvc.trainingPlanAssigneeData.category === 'Custom Users') {
          //   this.getDesignation();
          // }
          if (!this.designationList.length) {
            this.getDesignation()
          } else {
            this.designationList.map((pitem: any) => {
              if (pitem && this.assigneeFilterObj['designation'] && this.assigneeFilterObj['designation'].indexOf(pitem.name) > -1) {
                pitem['selected'] = true
              } else {
                pitem['selected'] = false
              }
            })
          }

        }
      }
    })

    this.tpdsSvc.clearFilter.subscribe((result: any) => {
      if (result && result.status) {
        this.from = result.from
        this.clearFilter()
      }
    })

    this.resetFilter()
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges()
  }

  getFilterEntity() {
    const filterObj = {
      search: {
        type: 'Competency Area',
      },
      filter: {
        isDetail: true,
      },
    }
    this.trainingPlanService.getFilterEntity(filterObj).subscribe((res: any) => {

      this.competencyList = res

    })
  }
  getProviders() {
    this.trainingPlanService.getProviders().subscribe((res: any) => {
      this.providersList = res
      this.providersList.forEach((pitem: any) => {
        if (this.filterObj['providers'] && pitem && this.filterObj['providers'].indexOf(pitem.name) > -1) {
          pitem['selected'] = true
        } else {
          pitem['selected'] = false
        }
      })
    })

  }

  hideFilter() {
    // this.toggleFilter.emit(false)
    this.tpdsSvc.filterToggle.next({ from: '', status: false })
  }

  checkedProviders(event: any, item: any) {
    if (event.checked) {
      item['checked'] = true
      this.providersList.forEach((pitem: any) => {
        if (item.name === pitem.name) {
          pitem['selected'] = true
        }

      })
      if (this.filterObj['providers']) {
        this.filterObj['providers'].push(item.name)
      }
    } else {
      item['checked'] = false
      this.providersList.forEach((pitem: any) => {
        if (item.name === pitem.name) {
          pitem['selected'] = false
        }
      })
      if (this.filterObj['providers'].indexOf(item.name) > -1) {
        const index = this.filterObj['providers'].findIndex((x: any) => x === item.name)
        item['selected'] = false
        this.filterObj['providers'].splice(index, 1)
      }
    }
  }

  getCompetencyTheme(event: any, ctype: any) {
    if (event.checked) {
      ctype['selected'] = true
      this.competencyList.map((citem: any) => {
        if (citem.name === ctype.id) {
          citem['selected'] = true
          citem.children.map((themechild: any) => {
            themechild['parent'] = ctype.id
          })
          if (this.filterObj[this.compentencyKey.vCompetencyArea]) {
            this.filterObj[this.compentencyKey.vCompetencyArea].push(citem.name)
          }
          this.competencyThemeList = this.competencyThemeList.concat(citem.children)
        }
      })
    } else {
      ctype['selected'] = false
      this.competencyList.map((citem: any) => {
        if (citem.name === ctype.id) {
          citem['selected'] = false
        }
      })

      if (this.filterObj[this.compentencyKey.vCompetencyArea] &&
        this.filterObj[this.compentencyKey.vCompetencyArea].indexOf(ctype.id) > -1) {
        const index = this.filterObj[this.compentencyKey.vCompetencyArea].findIndex((x: any) => x === ctype.id)
        this.filterObj[this.compentencyKey.vCompetencyArea].splice(index, 1)
      }
      if (this.filterObj[this.compentencyKey.vCompetencyTheme]) {
        this.competencyThemeList.forEach(sitem => {
          if (sitem.parent === ctype.id) {
            if (this.filterObj[this.compentencyKey.vCompetencyTheme].indexOf(sitem.name) > -1) {
              const index = this.filterObj[this.compentencyKey.vCompetencyTheme].findIndex((x: any) => x === sitem.name)
              this.filterObj[this.compentencyKey.vCompetencyTheme].splice(index, 1)
            }
          }
        })
      }
      if (this.filterObj[this.compentencyKey.vCompetencySubTheme]) {
        this.competencySubThemeList.forEach(ssitem => {
          if (ssitem.parentType === ctype.id) {
            if (this.filterObj[this.compentencyKey.vCompetencySubTheme].indexOf(ssitem.name) > -1) {
              const index = this.filterObj[this.compentencyKey.vCompetencySubTheme].findIndex((x: any) => x === ssitem.name)
              this.filterObj[this.compentencyKey.vCompetencySubTheme].splice(index, 1)
            }
          }
        })
      }
      this.competencyThemeList = this.competencyThemeList.filter(sitem => {
        if (sitem.parent === ctype.id) {
          sitem['selected'] = false
        }
        return sitem.parent !== ctype.id
      })
      this.competencySubThemeList = this.competencySubThemeList.filter(pitem => {
        if (pitem.parentType === ctype.id) {
          pitem['selected'] = false
        }
        return pitem.parentType !== ctype.id
      })
      this.searchThemeControl.reset()
      this.searchSubThemeControl.reset()
    }
  }

  getCompetencySubTheme(event: any, cstype: any) {
    if (event.checked) {
      this.competencyThemeList.forEach((csitem: any) => {
        if (csitem.name === cstype.name) {
          csitem['selected'] = true
          csitem.children.map((subthemechild: any) => {
            subthemechild['parentType'] = csitem.parent
            subthemechild['parent'] = csitem.name
          })
          this.competencySubThemeList = this.competencySubThemeList.concat(csitem.children)
          if (this.filterObj[this.compentencyKey.vCompetencyTheme]) {
            this.filterObj[this.compentencyKey.vCompetencyTheme].push(cstype.name)
          }

        }
      })
    } else {
      this.competencyThemeList.forEach((csitem: any) => {
        if (csitem.name === cstype.name) {
          csitem['selected'] = false
        }
      })

      this.competencySubThemeList = this.competencySubThemeList.filter(sitem => {
        return sitem.parent !== cstype.name
      })
      if (this.filterObj[this.compentencyKey.vCompetencyTheme] &&
        this.filterObj[this.compentencyKey.vCompetencyTheme].indexOf(cstype.name) > -1) {
        const index = this.filterObj[this.compentencyKey.vCompetencyTheme].findIndex((x: any) => x === cstype.name)
        this.filterObj[this.compentencyKey.vCompetencyTheme].splice(index, 1)
      }
      this.searchSubThemeControl.reset()
    }
  }

  manageCompetencySubTheme(event: any, csttype: any) {
    if (event.checked) {
      this.competencySubThemeList.forEach((cstlitem: any) => {
        if (csttype.name === cstlitem.name) {
          cstlitem['selected'] = true
        }
      })
      if (this.filterObj[this.compentencyKey.vCompetencySubTheme]) {
        this.filterObj[this.compentencyKey.vCompetencySubTheme].push(csttype.name)
      }

    } else {
      this.competencySubThemeList.forEach((cstlitem: any) => {
        if (csttype.name === cstlitem.name) {
          cstlitem['selected'] = false
        }
      })
      if (this.filterObj[this.compentencyKey.vCompetencySubTheme] &&
        this.filterObj[this.compentencyKey.vCompetencySubTheme].indexOf(csttype.name) > -1) {
        const index = this.filterObj[this.compentencyKey.vCompetencySubTheme].findIndex((x: any) => x === csttype.name)
        this.filterObj[this.compentencyKey.vCompetencySubTheme].splice(index, 1)
      }
    }

  }

  applyFilter() {
    if (this.from === 'content') {
      // this.getFilterData.emit(this.filterObj)
      this.tpdsSvc.getFilterDataObject.next(this.filterObj)
    } else {
      this.tpdsSvc.getFilterDataObject.next(this.assigneeFilterObj)
      // this.getFilterData.emit(this.assigneeFilterObj)
    }
    this.tpdsSvc.filterToggle.next({ from: '', status: false })
  }

  clearFilter() {
    if (this.from === 'content') {
      this.filterObj = {
        [this.compentencyKey.vCompetencyArea]: [],
        [this.compentencyKey.vCompetencyTheme]: [],
        [this.compentencyKey.vCompetencySubTheme]: [],
        providers: [],
      }
      this.selectedProviders = []
      this.competencyThemeList = []
      this.competencySubThemeList = []
      this.searchThemeControl.reset()
      this.searchSubThemeControl.reset()
      this.searchProviderControl.reset()
      this.resetFilter()
    } else {
      this.assigneeFilterObj = { group: [], designation: [] }
      this.resetAssigneeFilter()
    }

    if (this.from === 'content') {
      // this.getFilterData.emit(this.filterObj)
      // this.tpdsSvc.getFilterDataObject.next(this.filterObj)
    } else {
      // this.getFilterData.emit(this.assigneeFilterObj)
      // this.tpdsSvc.getFilterDataObject.next(this.assigneeFilterObj)
    }

    if (this.checkboxes) {
      this.checkboxes.forEach((element: any) => {
        element['checked'] = false
      })
    }
  }

  clearFilterWhileSearch() {
    if (this.checkboxes) {
      this.checkboxes.forEach((element: any) => {
        element['checked'] = false
      })
    }
  }

  getDesignation() {
    this.trainingPlanService.getDesignations().subscribe((res: any) => {
      if (res && res.result && res.result.response) {
        this.designationList = res.result.response.content
      }

    })
  }

  manageSelectedGroup(event: any, group: any) {
    if (event.checked) {
      this.groupList.map((grp: any, index: any) => {
        if (grp && grp.name === group.name) {
          this.groupList[index]['selected'] = true
        }
      })
      if (group) {
        group['selected'] = true
      }
      this.assigneeFilterObj['group'].push(group.name)
    } else {
      if (this.assigneeFilterObj['group'] &&
        this.assigneeFilterObj['group'].indexOf(group.name) > -1) {
        const index = this.assigneeFilterObj['group'].findIndex((x: any) => x === group.name)
        this.assigneeFilterObj['group'].splice(index, 1)
      }
      this.groupList.map((grp: any, index: any) => {
        if (grp && grp.name === group.name) {
          this.groupList[index]['selected'] = false
        }
      })
      if (group) {
        group['selected'] = false
      }
    }
  }

  manageSelectedDesignation(event: any, designation: any) {
    if (event.checked) {
      this.designationList.map((ditem: any) => {
        if (ditem && ditem['name'] === designation.name) {
          ditem['selected'] = true
        }
      })

      this.assigneeFilterObj['designation'].push(designation.name)
    } else {
      this.designationList.map((ditem: any) => {
        if (ditem && ditem['name'] === designation.name) {
          ditem['selected'] = false
        }
      })
      if (this.assigneeFilterObj['designation'] &&
        this.assigneeFilterObj['designation'].indexOf(designation.name) > -1) {
        const index = this.assigneeFilterObj['designation'].findIndex((x: any) => x === designation.name)
        this.assigneeFilterObj['designation'].splice(index, 1)
      }
    }
  }

  resetFilter() {
    if (this.competencyTypeList) {
      this.competencyTypeList.forEach((citem: any) => {
        if (citem && citem['selected']) {
          citem['selected'] = false
        }
      })
    }
    if (this.competencyThemeList) {
      this.competencyThemeList.forEach((titem: any) => {
        if (titem && titem['selected']) {
          titem['selected'] = false
        }
      })
    }
    if (this.competencySubThemeList) {
      this.competencySubThemeList.forEach((sitem: any) => {
        if (sitem && sitem['selected']) {
          sitem['selected'] = false
        }
      })
    }
    if (this.providersList) {
      this.providersList.forEach((pitem: any) => {
        if (pitem && pitem['selected']) {
          pitem['selected'] = false
        }
      })
    }

  }

  resetAssigneeFilter() {
    if (this.groupList) {
      this.groupList.map((pitem: any) => {
        if (pitem && pitem['selected']) {
          pitem['selected'] = false
        }
      })
    }

    if (this.designationList) {
      this.designationList.map((pitem: any) => {
        if (pitem && pitem['selected']) {
          pitem['selected'] = false
        }
      })
    }
  }
}
