import { Component, ElementRef, HostListener, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core'
import { MatLegacyDialog } from '@angular/material/legacy-dialog'
import { NsWidgetResolver } from '@sunbird-cb/resolver'
import { environment } from '../../../../../../../../../../../src/environments/environment'
import { OwlOptions } from 'ngx-owl-carousel-o'
import { EventsService } from '../../services/events.service'
import { YoutubePlayerComponent } from '../../dialogs/youtube-player/youtube-player.component'
import * as _ from 'lodash'

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
  selectedCompetecy: any
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
  customOptions: OwlOptions = {
    loop: false,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: false,
    dots: false,
    navSpeed: 200,
    navText: [
      '<',
      '>'
    ],
    responsive: {
      0: {
        items: 2
      },
      660: {
        items: 2
      }
    },
    nav: true
  };

  constructor(
    private eventsService: EventsService,
    private dialog: MatLegacyDialog
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
      this.selectedCompetecy = []
      this.competenciesObject = this.eventsService.convertToTreeView(this.event[this.compentencyKey.vKey])
      setTimeout(() => {
        this.selectedCompetecy = this.competenciesObject[0]
      }, 100)
    }
  }

  getSelectedCompetecyThemes(competencyArea: any) {
    this.selectedCompetecy = competencyArea
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
    this.dialog.open(YoutubePlayerComponent, {
      width: '900px',
      disableClose: false,
      data: { event: this.event }
    })
  }

  fileImage(name: string) {
    return name.includes('.ppt') ? '/assets/icons/ppt.svg' :
      (name.includes('.doc') ? '/assets/icons/doc.svg' : '/assets/icons/pdf.svg')
  }

  getMaterialName(content: string) {
    let name = ''
    if (content) {
      const urlSplit = content.split('_')
      if (urlSplit.length > 0) {
        name = urlSplit[urlSplit.length - 1]
      }
    }
    return name
  }
}
