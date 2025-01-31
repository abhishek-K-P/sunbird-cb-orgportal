import { Component, OnDestroy, OnInit } from '@angular/core'
import { EventsService } from '../../services/events.service'
import { ActivatedRoute } from '@angular/router'
import * as _ from 'lodash'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { material, speaker } from '../../models/events.model'

@Component({
  selector: 'ws-app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.scss']
})
export class CreateEventComponent implements OnInit, OnDestroy {
  //#region (global varialbles)
  eventId = ''
  eventIconUrl = ''
  eventDetails!: FormGroup
  speakersList: speaker[] = []
  materialsList: material[] = []
  competencies: any
  //#endregion

  constructor(
    private eventSvc: EventsService,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder
  ) { }

  //#region (onInit)
  ngOnInit(): void {
    this.initializeFormAndParams()
    // this.getEventId()
  }

  initializeFormAndParams() {
    this.eventDetails = this.formBuilder.group({
      eventName: new FormControl('', [Validators.required]),
      description: new FormControl('', [Validators.required]),
      eventCategory: new FormControl('', [Validators.required]),
      streamType: new FormControl('', [Validators.required]),
      startDate: new FormControl('', [Validators.required]),
      startTime: new FormControl('', [Validators.required]),
      endTime: new FormControl('', [Validators.required])
    })
  }

  getEventId() {
    this.eventId = _.get(this.activatedRoute, 'snapshot.paramMap.params.eventId')
    if (this.eventId) {
      this.getEventDetails()
    }
  }

  getEventDetails() {
    this.eventSvc.getEventDetailsByid(this.eventId).subscribe({
      next: res => {
        if (res) {
          this.patchEventDetails(res)
        }
      }
    })
  }

  patchEventDetails(res: any) {
    console.log('event details: ', res)
  }

  //#endregion

  ngOnDestroy(): void {
  }

}
