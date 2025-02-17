import { Component, Input, OnChanges, OnInit } from '@angular/core'
import { ICompentencyKeys } from '../../../home/interface/interfaces'
import { environment } from '../../../../../../../../../src/environments/environment'
import { InitService } from '../../../../../../../../../src/app/services/init.service'

@Component({
  selector: 'ws-app-competency-summary',
  templateUrl: './competency-summary.component.html',
  styleUrls: ['./competency-summary.component.scss'],
})
export class CompetencySummaryComponent implements OnInit, OnChanges {
  @Input() contentData: any
  @Input() selectContentCount: any
  selectedCardData: any[] = []
  competencySummaryObj: any = [{
    title: 'behavioural',
    behavioural: {
      listData: [],
      count: 0,
    },
  }, {
    title: 'functional',
    functional: {
      listData: [],
      count: 0,
    },
  }, {
    title: 'domain',
    domain: {
      listData: [],
      count: 0,
    },
  },
  ]
  selectedIndex = 0
  compentencyKey!: ICompentencyKeys

  constructor(private initService: InitService) { }

  ngOnInit() {
    this.compentencyKey = this.initService.configSvc.competency[environment.compentencyVersionKey]
  }

  ngOnChanges() {
    this.selectedCardData = []
    this.competencySummaryObj = [{
      title: 'behavioural',
      behavioural: {
        listData: [],
        count: 0,
      },
    }, {
      title: 'functional',
      functional: {
        listData: [],
        count: 0,
      },
    }, {
      title: 'domain',
      domain: {
        listData: [],
        count: 0,
      },
    },
    ]
    if (this.contentData) {
      this.contentData.map((item: any) => {
        if (item && item.selected) {
          this.selectedCardData.push(item)
        }
      })
    }
    // let competencyThemeObj = {};

    if (this.selectedCardData && this.compentencyKey && this.compentencyKey.vKey) {
      let fObj = { competencyTheme: '', count: 0 }
      this.selectedCardData.forEach((sitem: any) => {
        if (sitem && sitem[this.compentencyKey.vKey]) {
          sitem[this.compentencyKey.vKey].map((fitem: any) => {
            if (fitem[this.compentencyKey.vCompetencyArea].toLowerCase() === 'behavioural') {
              const result = this.checkIfThemeNameExists(this.competencySummaryObj[0]['behavioural']['listData'], fitem)
              fObj = { competencyTheme: fitem[this.compentencyKey.vCompetencyTheme], count: 1 }
              if (result) {
                this.competencySummaryObj[0]['behavioural']['count'] = this.competencySummaryObj[0]['behavioural']['count'] + 1
                this.competencySummaryObj[0]['behavioural']['listData'].push(fObj)
              }
              this.selectedIndex = 0
            }
            if (fitem[this.compentencyKey.vCompetencyArea].toLowerCase() === 'functional') {
              const result = this.checkIfThemeNameExists(this.competencySummaryObj[1]['functional']['listData'], fitem)
              fObj = { competencyTheme: fitem[this.compentencyKey.vCompetencyTheme], count: 1 }
              if (result) {
                this.competencySummaryObj[1]['functional']['count'] = this.competencySummaryObj[1]['functional']['count'] + 1
                this.competencySummaryObj[1]['functional']['listData'].push(fObj)
              }
              this.selectedIndex = 1
            }
            if (fitem[this.compentencyKey.vCompetencyArea].toLowerCase() === 'domain') {
              const result = this.checkIfThemeNameExists(this.competencySummaryObj[2]['domain']['listData'], fitem)
              fObj = { competencyTheme: fitem[this.compentencyKey.vCompetencyTheme], count: 1 }
              if (result) {
                this.competencySummaryObj[2]['domain']['count'] = this.competencySummaryObj[2]['domain']['count'] + 1
                this.competencySummaryObj[2]['domain']['listData'].push(fObj)
              }
              this.selectedIndex = 2
            }
          })
        }

      })
    }
  }

  checkIfThemeNameExists(arr: any, fitem: any): boolean {
    let flag = true
    arr.map((sitem: any) => {
      if (sitem.competencyTheme === fitem[this.compentencyKey.vCompetencyTheme]) {
        sitem['count'] = sitem['count'] + 1
        flag = false
      }
    })
    return flag
  }

}
