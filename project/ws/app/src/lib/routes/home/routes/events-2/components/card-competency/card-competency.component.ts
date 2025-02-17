import { Component, OnInit, Input } from '@angular/core'
import { trigger, state, style, animate, transition } from '@angular/animations'

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

  @Input() theme: any[] = []
  @Input() competencyArea = ''
  isExpanded = false

  constructor() {
  }

  ngOnInit() {
  }

  handleToggleSize(_viewMore: any): void {
    this.isExpanded = !this.isExpanded
  }
}