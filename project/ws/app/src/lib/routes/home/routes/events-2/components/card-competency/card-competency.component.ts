import { Component, OnInit, Input } from '@angular/core'
import { trigger, state, style, animate, transition } from '@angular/animations'
// import { NsWidgetResolver, WidgetBaseComponent } from '@sunbird-cb/resolver'
// import { NsCardContent } from '@sunbird-cb/utils/lib/services/card-content.model'
// import { NsCardContent } from '../card-content-v2/card-content-v2.model'
// import { NsWidgetResolver, WidgetBaseComponent } from '@ws-widget/resolver'

@Component({
  selector: 'ws-widget-card-competency',
  templateUrl: './card-competency.component.html',
  styleUrls: ['./card-competency.component.scss'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '104px',
        width: '320px',
      })),
      state('expanded', style({
        minHeight: '120px',
        width: '372px',
        height: 'auto',
      })),
      transition('collapsed <=> expanded', [
        animate('0.5s'),
      ]),
    ]),
  ],
})

export class CardCompetencyComponent implements OnInit {

  @Input() widgetData!: any
  @Input() competencyArea = ''
  isExpanded = false

  constructor() {
    // super()
  }

  ngOnInit() {
  }

  handleToggleSize(_viewMore: any): void {
    this.isExpanded = !this.isExpanded
  }
}