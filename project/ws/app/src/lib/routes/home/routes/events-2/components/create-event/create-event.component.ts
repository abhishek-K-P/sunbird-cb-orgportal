import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { EventsService } from '../../services/events.service'
import { ActivatedRoute } from '@angular/router'
import * as _ from 'lodash'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { material, speaker } from '../../models/events.model'
import { StepperSelectionEvent } from '@angular/cdk/stepper'
import { MatStepper } from '@angular/material/stepper'

@Component({
  selector: 'ws-app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.scss']
})
export class CreateEventComponent implements OnInit, AfterViewInit, OnDestroy {
  //#region (global varialbles)
  @ViewChild(MatStepper) stepper: MatStepper | undefined
  eventId = ''
  eventIconUrl = ''
  eventDetails!: FormGroup
  speakersList: speaker[] = [
    {
      name: 'Puran',
      email: 'puran123[at]yopmail[dot]com',
      description: 'Praesent in mauris eu tortor porttitor accumsan. Mauris suscipit, ligula sit amet pharetra semper,'
    },
    {
      name: 'Puran',
      email: 'puran123[at]yopmail[dot]com',
      description: 'Praesent in mauris eu tortor porttitor accumsan. Mauris suscipit, ligula sit amet pharetra semper,'
    },
    {
      name: 'Puran',
      email: 'puran123[at]yopmail[dot]com',
      description: 'Praesent in mauris eu tortor porttitor accumsan. Mauris suscipit, ligula sit amet pharetra semper,'
    },
  ]
  materialsList: material[] = [
    {
      fullName: 'event name 1',
      fileUrl: 'its url'
    },
    {
      fullName: 'event name 2',
      fileUrl: 'its url'
    }
  ]
  competencies: any
  currentStepperIndex = 0
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

  ngAfterViewInit() {
    if (this.stepper) {
      this.stepper._getIndicatorType = () => 'number'
    }
  }

  initializeFormAndParams() {
    this.eventDetails = this.formBuilder.group({
      eventName: new FormControl('', [Validators.required]),
      description: new FormControl('', [Validators.required, Validators.maxLength(250)]),
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

  //#region (ui interactions)
  onChange(event: StepperSelectionEvent) {
    this.currentStepperIndex = event.selectedIndex
  }

  saveAndExit() { }

  //#endregion

  ngOnDestroy(): void {
  }

}
