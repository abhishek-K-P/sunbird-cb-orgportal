import { Component, Input } from '@angular/core'
import { material } from '../../models/events.model'

@Component({
  selector: 'ws-app-event-materials',
  templateUrl: './event-materials.component.html',
  styleUrls: ['./event-materials.component.scss']
})
export class EventMaterialsComponent {

  @Input() materialsList: material[] = []

  constructor() { }

}
