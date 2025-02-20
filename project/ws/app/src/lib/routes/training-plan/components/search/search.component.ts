import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { TrainingPlanService } from './../../services/traininig-plan.service'
import { TrainingPlanDataSharingService } from './../../services/training-plan-data-share.service'
/* tslint:disable */
import _ from 'lodash'
/* tslint:enable */
import { LoaderService } from '../../../../../../../../../src/app/services/loader.service'
import { InitService } from '../../../../../../../../../src/app/services/init.service'
import { ICompentencyKeys } from '../../../home/interface/interfaces'
import { environment } from '../../../../../../../../../src/environments/environment'
@Component({
  selector: 'ws-app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  @Input() categoryData: any = []
  @Input() from: any = ''
  @Output() handleApiData = new EventEmitter()
  searchText = ''
  filterVisibilityFlag = false
  clearFilter = false
  selectedDropDownValue: any
  designationList: any[] = []
  pageIndex = 0
  pageSize = 20
  isContentLive = false
  compentencyKey!: ICompentencyKeys

  constructor(
    private trainingPlanService: TrainingPlanService,
    private route: ActivatedRoute,
    public tpdsSvc: TrainingPlanDataSharingService,
    private loadingService: LoaderService,
    private initService: InitService
  ) { }

  ngOnInit() {
    this.compentencyKey = this.initService.configSvc.competency[environment.compentencyVersionKey]
    this.tpdsSvc.handleContentPageChange.subscribe((pageData: any) => {
      if (pageData) {
        this.pageIndex = pageData.pageIndex
        this.pageSize = pageData.pageSize
        this.getContent(this.selectedDropDownValue)
      }

    })

    this.tpdsSvc.getFilterDataObject.subscribe(event => {
      if (this.selectedDropDownValue === 'Course' ||
        this.selectedDropDownValue === 'Standalone Assessment' ||
        this.selectedDropDownValue === 'Program' ||
        this.selectedDropDownValue === 'Blended program' ||
        this.selectedDropDownValue === 'Curated program' ||
        this.selectedDropDownValue === 'Moderated Course'
      ) {
        this.getContent(this.selectedDropDownValue, event)
      }
      if (this.selectedDropDownValue === 'CustomUser') {
        this.getCustomUsers(this.selectedDropDownValue, event)
      }

    })
    if (this.tpdsSvc.trainingPlanStepperData.status && this.tpdsSvc.trainingPlanStepperData.status.toLowerCase() === 'live') {
      this.isContentLive = true
    }
  }

  openFilter() {
    this.filterVisibilityFlag = true
    this.tpdsSvc.filterToggle.next({ from: this.from, status: true })
    // if (this.document.getElementById('top-nav-bar')) {
    //   const ele: any = this.document.getElementById('top-nav-bar')
    //   ele.style.zIndex = '1'
    // }

  }

  hideFilter(event: any) {
    this.filterVisibilityFlag = event
    this.tpdsSvc.filterToggle.next({ from: '', status: false })
    // if (this.document.getElementById('top-nav-bar')) {
    //   const ele: any = this.document.getElementById('top-nav-bar')
    //   ele.style.zIndex = '1000'
    // }
  }

  handleCategorySelection(event: any) {
    this.selectedDropDownValue = event
    switch (this.from) {
      case 'content':
        // if(this.tpdsSvc.trainingPlanContentData && this.tpdsSvc.trainingPlanContentData.data) {
        //   this.tpdsSvc.trainingPlanContentData.data = []
        // }
        /* tslint:disable */
        event = !event ? 'Course' : event
        /* tslint:enable */
        this.searchText = ''
        this.tpdsSvc.clearFilter.next({ from: 'content', status: true })
        this.resetPageIndex()
        this.getContent(event)
        break
      case 'assignee':
        // if(this.tpdsSvc.trainingPlanAssigneeData && this.tpdsSvc.trainingPlanAssigneeData.data) {
        //   this.tpdsSvc.trainingPlanAssigneeData.data = []
        //   this.tpdsSvc.trainingPlanStepperData['assignmentTypeInfo']=[]
        // }
        /* tslint:disable */
        this.tpdsSvc.clearFilter.next({ from: 'assignee', status: true })
        this.resetPageIndex()
        this.searchText = ''
        event = !event ? 'Designation' : event
        /* tslint:enable */
        if (event === 'Designation') {
          this.getDesignations(event)
        } else if (event === 'CustomUser') {
          this.getCustomUsers(event)
        } else if (event === 'AllUser') {
          this.getAllUsers(event)
        }
        break
    }
  }

  getContent(contentType: any, applyFilterObj?: any) {
    this.loadingService.changeLoaderState(true)
    if (contentType) {
      if (contentType === 'Moderated Course') {
        this.tpdsSvc.moderatedCourseSelectStatus.next(true)
      }
      if (applyFilterObj && Object.keys(applyFilterObj).length) {
        this.searchText = ''
      }
      if (this.searchText) {
        this.tpdsSvc.clearFilter.next({ from: 'content', status: true })
        /* tslint:disable */
        applyFilterObj = {}
        /* tslint:enable */
      }
      const filterObj = {
        request: {
          secureSettings: contentType === 'Moderated Course' ? true : false, // for moderated course
          filters: {
            primaryCategory: [contentType === 'Moderated Course' ? 'Course' : contentType],
            /* tslint:disable */
            organisation: applyFilterObj && applyFilterObj['providers'] && applyFilterObj['providers'].length ? applyFilterObj['providers'] : [],
            [`${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyArea}`]: applyFilterObj && applyFilterObj[this.compentencyKey.vCompetencyArea] && applyFilterObj[this.compentencyKey.vCompetencyArea].length ? applyFilterObj[this.compentencyKey.vCompetencyArea] : [],
            [`${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencyTheme}`]: applyFilterObj && applyFilterObj[this.compentencyKey.vCompetencyTheme] && applyFilterObj[this.compentencyKey.vCompetencyTheme].length ? applyFilterObj[this.compentencyKey.vCompetencyTheme] : [],
            [`${this.compentencyKey.vKey}.${this.compentencyKey.vCompetencySubTheme}`]: applyFilterObj && applyFilterObj[this.compentencyKey.vCompetencySubTheme] && applyFilterObj[this.compentencyKey.vCompetencySubTheme].length ? applyFilterObj[this.compentencyKey.vCompetencySubTheme] : [],
            /* tslint:enable */
          },
          offset: this.pageIndex,
          limit: this.pageSize,
          query: (this.searchText) ? this.searchText : '',
          sort_by: { lastUpdatedOn: 'desc' },
          fields: ['name', 'appIcon', 'instructions', 'description', 'purpose', 'mimeType',
            'gradeLevel', 'identifier', 'medium', 'resourceType',
            'primaryCategory', 'contentType', 'channel', 'organisation', 'trackable', 'posterImage',
            'idealScreenSize', 'learningMode', 'creatorLogo', 'duration', 'programDuration',
            'version', 'avgRating', `${this.compentencyKey.vKey}`, 'secureSettings'],
        },
      }
      this.trainingPlanService.getAllContent(filterObj).subscribe((res: any) => {
        let finResult = []
        if (this.tpdsSvc.trainingPlanContentData.data && this.tpdsSvc.trainingPlanContentData.data.content) {
          finResult = this.tpdsSvc.trainingPlanContentData.data.content.filter((sitem: any) => {
            if (sitem) {
              return sitem.selected
            }
          })
        }
        if (res && res.content) {
          const result = { count: res.count, content: _.uniqBy(_.concat(finResult, res.content), 'identifier') }
          this.tpdsSvc.trainingPlanContentData = { category: contentType, data: result, count: res.count }

        } else {
          const result = { count: res.count, content: _.uniqBy(_.concat(finResult, []), 'identifier') }
          this.tpdsSvc.trainingPlanContentData = { category: contentType, data: result, count: res.count }
        }
        this.handleApiData.emit(true)
        this.loadingService.changeLoaderState(false)
      })
    }

  }

  getCustomUsers(event: any, applyFilterObj?: any) {
    this.loadingService.changeLoaderState(true)
    const rootOrgId = _.get(this.route.snapshot.parent, 'data.configService.unMappedUser.rootOrg.rootOrgId')
    if (applyFilterObj && Object.keys(applyFilterObj).length) {
      this.searchText = ''
    }
    if (this.searchText) {
      this.tpdsSvc.clearFilter.next({ from: 'assignee', status: true })
      /* tslint:disable */
      applyFilterObj = {}
      /* tslint:enable */
    }
    const filterObj = {
      request: {
        query: (this.searchText) ? this.searchText : '',
        filters: {
          rootOrgId,
          status: 1,
          /* tslint:disable */
          'profileDetails.professionalDetails.designation': applyFilterObj && applyFilterObj.designation && applyFilterObj.designation.length ? applyFilterObj.designation : [],
          'profileDetails.professionalDetails.group': applyFilterObj && applyFilterObj.group && applyFilterObj.group.length ? applyFilterObj.group : [],
          /* tslint:disable */
        },
        fields: [
          'userId',
          'firstName',
          'rootOrgName',
          'profileDetails',
          'organisations',
        ],
        limit: 10000,
        offset: 0,
      },
    }
    this.trainingPlanService.getCustomUsers(filterObj).subscribe((res: any) => {
      if (this.tpdsSvc.trainingPlanAssigneeData.data && this.tpdsSvc.trainingPlanAssigneeData.data.content) {
        const finArr = this.tpdsSvc.trainingPlanAssigneeData.data.content.filter((sitem: any) => {
          if (sitem && sitem.selected) {
            return sitem
          }
        })
        this.tpdsSvc.trainingPlanAssigneeData = { category: event, data: _.uniqBy(_.concat(finArr, res.content), 'userId') }
      } else if (this.tpdsSvc.trainingPlanAssigneeData.data) {
        const finArr = this.tpdsSvc.trainingPlanAssigneeData.data.filter((sitem: any) => {
          if (sitem && sitem.selected) {
            return sitem
          }
        })
        this.tpdsSvc.trainingPlanAssigneeData = { category: event, data: _.uniqBy(_.concat(finArr, res.content), 'userId') }
      } else {
        this.tpdsSvc.trainingPlanAssigneeData = { category: event, data: res.content }
      }
      this.handleApiData.emit(true)
      this.loadingService.changeLoaderState(false)
    }, (_error: any) => {
    })
  }

  getAllUsers(_event: any) {
    this.tpdsSvc.trainingPlanAssigneeData = { category: _event, data: [_event] }
    this.tpdsSvc.trainingPlanStepperData.assignmentTypeInfo = [
      'AllUser',
    ]
    this.handleApiData.emit(true)
  }

  getDesignations(event: any) {
    this.loadingService.changeLoaderState(true)
    this.trainingPlanService.getDesignations().subscribe((res: any) => {
      if (this.searchText) {
        const resArr = res.result.response.content.filter((ditem: any) => {
          if (ditem.name.toLowerCase().includes(this.searchText.toLowerCase())) {
            return ditem
          }
        })
        if (this.tpdsSvc.trainingPlanAssigneeData.data) {
          const finArr = this.tpdsSvc.trainingPlanAssigneeData.data.filter((sitem: any) => {
            if (sitem && sitem.selected) {
              return sitem
            }
          })
          this.tpdsSvc.trainingPlanAssigneeData = { category: event, data: _.concat(finArr, resArr) }
        } else {
          this.tpdsSvc.trainingPlanAssigneeData = { category: event, data: resArr }
        }

      } else {
        this.tpdsSvc.trainingPlanAssigneeData = { category: event, data: res.result.response.content }
        this.designationList = res.result.response.content
      }

      this.handleApiData.emit(true)
      this.loadingService.changeLoaderState(false)
    })
  }

  searchData() {
    switch (this.selectedDropDownValue) {
      case 'Course':
      case 'Standalone Assessment':
      case 'Program':
      case 'Blended program':
      case 'Curated program':
      case 'Moderated Course':
        this.getContent(this.selectedDropDownValue)
        break
      case 'Designation':
        this.getDesignations(this.selectedDropDownValue)
        break
      case 'CustomUser':
        this.getCustomUsers(this.selectedDropDownValue)
        break
      case 'AllUser':
        this.getAllUsers(this.selectedDropDownValue)
        break
    }
  }

  // getFilterData(event: any) {
  //   if (this.from === 'content') {
  //     this.getContent(this.selectedDropDownValue, event)
  //   } else {
  //     this.getCustomUsers(this.selectedDropDownValue, event)
  //   }
  // }

  resetPageIndex() {
    this.pageIndex = 0
    this.pageSize = 20
  }

}
