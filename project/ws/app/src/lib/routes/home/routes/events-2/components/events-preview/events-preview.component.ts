import { Component, ElementRef, HostListener, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core'
// import { MatLegacyDialog } from '@angular/material/legacy-dialog'
import { NsWidgetResolver } from '@sunbird-cb/resolver'
import { environment } from '../../../../../../../../../../../src/environments/environment'
// import { YoutubePlayerComponent } from '../../dialogs/youtube-player/youtube-player.component'

@Component({
  selector: 'ws-app-events-preview',
  templateUrl: './events-preview.component.html',
  styleUrls: ['./events-preview.component.scss']
})
export class EventsPreviewComponent implements OnInit, OnChanges {
  @Input() event: any
  eventId: any
  @ViewChild('rightContainer') rcElement!: ElementRef
  @ViewChild('bannerDetails', { static: true }) bannerElem!: ElementRef
  @ViewChild('contentSource') contentSource!: ElementRef
  sourceEllipsis = false
  scrollLimit = 0
  rcElem = {
    offSetTop: 0,
    BottomPos: 0,
  }
  scrolled = false
  elementPosition: any
  sticky = false
  competencies_v6: any = []
  competenciesObject: any = []
  compentencyKey: any
  competencySelected = ''
  widgets?: NsWidgetResolver.IRenderConfigWithAnyData[]

  strip: any = {
    key: 'blendedPrograms',
    logo: '',
    title: 'Blended Program',
    stripTitleLink: {
      link: '',
      icon: '',
    },
    sliderConfig: {
      showNavs: true,
      showDots: false,
    },
    loader: true,
    stripBackground: '',
    titleDescription: 'Blended Program',
    stripConfig: {
      cardSubType: 'standard',
    },
    viewMoreUrl: {
      path: '',
      viewMoreText: 'Show all',
      queryParams: '',
    },
    tabs: [],
    filters: [],
  }

  @HostListener('window:scroll', ['$event'])
  handleScroll() {
    const windowScroll = window.pageYOffset
    if (windowScroll >= this.elementPosition - 100) {
      this.sticky = true
    } else {
      this.sticky = false
    }

    if (this.scrollLimit) {
      if ((window.scrollY + this.rcElem.BottomPos) >= this.scrollLimit) {
        this.rcElement.nativeElement.style.position = 'sticky'
      } else {
        this.rcElement.nativeElement.style.position = 'fixed'
      }
    }

    // 236... (OffsetTop of right container + 104)
    if (window.scrollY > (this.rcElem.offSetTop + 104)) {
      this.scrolled = true
    } else {
      this.scrolled = false
    }
  }

  constructor(
    // private dialog: MatLegacyDialog,
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.event) {
      this.compentencyKey = {
        vKey: environment.compentencyVersionKey, vCompetencyArea: 'competencyAreaName', vCompetencyTheme: 'competencyThemeName',
        vCompetencySubTheme: 'competencySubThemeName',
      }
      this.eventId = this.event.identifier
      this.loadCompetencies()
    }
  }

  loadCompetencies(): void {
    if (this.event && this.compentencyKey && this.event[this.compentencyKey.vKey] && this.event[this.compentencyKey.vKey].length) {
      const competenciesObject: any = {}
      if (typeof this.event[this.compentencyKey.vKey] === 'string'
        && this.checkValidJSON(this.event[this.compentencyKey.vKey])) {
        this.event[this.compentencyKey.vKey] = JSON.parse(this.event[this.compentencyKey.vKey])
      }
      this.event[this.compentencyKey.vKey].forEach((_obj: any) => {
        if (competenciesObject[_obj[this.compentencyKey.vCompetencyArea]]) {
          if (competenciesObject[_obj[this.compentencyKey.vCompetencyArea]]
          [_obj[this.compentencyKey.vCompetencyTheme]]) {
            const competencyTheme = competenciesObject[_obj[this.compentencyKey.vCompetencyArea]]
            [_obj[this.compentencyKey.vCompetencyTheme]]
            if (competencyTheme.indexOf(_obj[this.compentencyKey.vCompetencySubTheme]) === -1) {
              competencyTheme.push(_obj[this.compentencyKey.vCompetencySubTheme])
            }
          } else {
            competenciesObject[_obj[this.compentencyKey.vCompetencyArea]]
            [_obj[this.compentencyKey.vCompetencyTheme]] = []
            competenciesObject[_obj[this.compentencyKey.vCompetencyArea]]
            [_obj[this.compentencyKey.vCompetencyTheme]]
              .push(_obj[this.compentencyKey.vCompetencySubTheme])
          }
        } else {
          competenciesObject[_obj[this.compentencyKey.vCompetencyArea]] = {}
          competenciesObject[_obj[this.compentencyKey.vCompetencyArea]][_obj[this.compentencyKey.vCompetencyTheme]] = []
          competenciesObject[_obj[this.compentencyKey.vCompetencyArea]][_obj[this.compentencyKey.vCompetencyTheme]]
            .push(_obj[this.compentencyKey.vCompetencySubTheme])
        }
      })

      for (const key in competenciesObject) {
        if (competenciesObject.hasOwnProperty(key)) {
          const _temp: any = {}
          _temp['key'] = key
          _temp['value'] = competenciesObject[key]
          this.competenciesObject.push(_temp)
        }
      }
      this.handleShowCompetencies(this.competenciesObject[0])
    }
  }

  handleShowCompetencies(item: any): void {
    this.competencySelected = item.key
    const valueObj = item.value
    const competencyArray = []
    for (const key in valueObj) {
      if (valueObj.hasOwnProperty(key)) {
        const _tempObj: any = {}
        _tempObj['key'] = key
        _tempObj['value'] = valueObj[key]
        competencyArray.push(_tempObj)
      }
    }

    this.strip['loaderWidgets'] = this.transformCompetenciesToWidget(this.competencySelected, competencyArray, this.strip)
  }

  private transformCompetenciesToWidget(
    competencyArea: string,
    competencyArrObject: any,
    strip: any) {
    return (competencyArrObject || []).map((content: any, idx: number) => (
      content ? {
        widgetType: 'card',
        widgetSubType: 'competencyCard',
        widgetHostClass: 'mr-4',
        widgetData: {
          content,
          competencyArea,
          cardCustomeClass: strip.customeClass ? strip.customeClass : '',
          context: { pageSection: strip.key, position: idx },
        },
      } : {
        widgetType: 'card',
        widgetSubType: 'competencyCard',
        widgetHostClass: 'mr-4',
        widgetData: {},
      }
    ))
  }

  checkValidJSON(str: any) {
    try {
      JSON.parse(str)
      return true
    } catch (e) {
      return false
    }
  }

  handleCapitalize(str: string, type?: string): string {
    let returnValue = ''
    if (str) {
      if (type === 'name') {
        returnValue = str.split(' ').map(_str => {
          return _str.charAt(0).toUpperCase() + _str.slice(1)
        }).join(' ')
      } else {

        returnValue = str && (str.charAt(0).toUpperCase() + str.slice(1))
      }
    }
    return returnValue
  }

  getHoursAndMinites(dateTime: any) {
    if (dateTime) {
      const [hours, minutes] = dateTime.split(":")
      return `${hours}:${minutes}`
    }
    return ''
  }

  viewPlayer() {
    // this.dialog.open(YoutubePlayerComponent, {
    //   width: '900px',
    //   disableClose: false,
    //   data: { event: this.event }
    // })
  }
}
