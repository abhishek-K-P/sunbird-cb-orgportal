import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { FormGroup } from '@angular/forms'
import * as _ from 'lodash'

@Component({
  selector: 'ws-app-event-basic-details',
  templateUrl: './event-basic-details.component.html',
  styleUrls: ['./event-basic-details.component.scss']
})
export class EventBasicDetailsComponent implements OnInit, OnChanges {

  //#region (global variables)
  @Input() eventDetails!: FormGroup

  evntCategorysList = ['Webinar', 'Karmayogi Talks', 'Karmayogi Saptah']
  todayDate = new Date()
  //#endregion

  constructor() { }

  ngOnInit(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes) { }
  }

  showValidationMsg(controlName: string, validationType: string): Boolean {
    let showMsg = false
    const control = _.get(this.eventDetails, `controls.${controlName}`)
    if (control && control.touched && control.invalid && control.hasError(validationType)) {
      showMsg = true
    }
    return showMsg
  }

}
