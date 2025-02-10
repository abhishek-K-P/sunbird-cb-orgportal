import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core'
import { EventsService } from '../../services/events.service'
import { ActivatedRoute, Router } from '@angular/router'
import * as _ from 'lodash'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { material, speaker } from '../../models/events.model'
import { StepperSelectionEvent } from '@angular/cdk/stepper'
import { MatStepper } from '@angular/material/stepper'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { HttpErrorResponse } from '@angular/common/http'

@Component({
  selector: 'ws-app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.scss']
})
export class CreateEventComponent implements OnInit, AfterViewInit {
  //#region (global varialbles)
  @ViewChild(MatStepper) stepper: MatStepper | undefined
  eventId = ''
  eventIconUrl = ''
  eventDetails: any
  eventDetailsForm!: FormGroup
  speakersList: speaker[] = []
  materialsList: material[] = []
  competencies: any
  currentStepperIndex = 3
  openMode = 'edit'
  pathUrl = ''
  //#endregion

  constructor(
    private eventSvc: EventsService,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private router: Router,
    private matSnackBar: MatSnackBar,
  ) { }

  //#region (onInit)
  ngOnInit(): void {
    this.initializeFormAndParams()
    this.getEventDetailsFromResolver()
  }


  initializeFormAndParams() {
    this.eventDetailsForm = this.formBuilder.group({
      eventName: new FormControl('', [Validators.required]),
      description: new FormControl('', [Validators.required, Validators.maxLength(250)]),
      eventCategory: new FormControl('', [Validators.required]),
      streamType: new FormControl(''),
      startDate: new FormControl('', [Validators.required]),
      startTime: new FormControl('', [Validators.required]),
      endTime: new FormControl('', [Validators.required]),
      resourceUrl: new FormControl('')
    })
  }

  getEventDetailsFromResolver() {
    if (_.get(this.activatedRoute, 'snapshot.data.eventDetails')) {
      this.eventDetails = _.get(this.activatedRoute, 'snapshot.data.eventDetails.data')
      this.patchEventDetails()
    }
    this.activatedRoute.queryParams.subscribe((params: any) => {
      this.openMode = params['mode']
      this.pathUrl = params['pathUrl']
      if (this.openMode === 'view') {
        this.eventDetailsForm.disable()
      }
    })
  }

  patchEventDetails() {
    this.eventId = _.get(this.eventDetails, 'identifier')
    const eventBaseDetails = {
      eventName: _.get(this.eventDetails, 'name', ''),
      description: _.get(this.eventDetails, 'description', ''),
      eventCategory: _.get(this.eventDetails, 'resourceType', ''),
      streamType: _.get(this.eventDetails, 'streamType', ''),//new key to add
      startDate: new Date(_.get(this.eventDetails, 'startDate', '')),
      startTime: _.get(this.eventDetails, 'startTime', ''),
      endTime: _.get(this.eventDetails, 'endTime', ''),
      resourceUrl: _.get(this.eventDetails, 'resourceUrl', '')
    }
    this.eventDetailsForm.setValue(eventBaseDetails)
    this.eventDetailsForm.updateValueAndValidity()

    this.speakersList = _.get(this.eventDetails, 'speakers', [])
    this.materialsList = _.get(this.eventDetails, 'eventHandouts', [])
  }

  ngAfterViewInit() {
    if (this.stepper) {
      this.stepper._getIndicatorType = () => 'number'
    }
  }
  //#endregion

  //#region (ui interactions)
  onSelectionChange(event: StepperSelectionEvent) {
    this.currentStepperIndex = event.selectedIndex
  }

  navigateBack() {
    this.router.navigate([`/app/home/events/${this.pathUrl}`])
  }

  moveToNextForm() {
    if (this.canMoveToNext || this.openMode === 'view') {
      this.currentStepperIndex = this.currentStepperIndex + 1
    }
  }

  get canMoveToNext() {
    let currentFormIsValid = false
    if (this.currentStepperIndex === 0) {
      if (this.eventDetailsForm.valid) {
        currentFormIsValid = true
      }
    } else if (this.currentStepperIndex === 1) {
      if (this.speakersList && this.speakersList.length) {
        currentFormIsValid = true
      }
    } else if (this.currentStepperIndex === 2) {
      if (this.materialsList && this.materialsList.length) {
        currentFormIsValid = true
      }
    }
    return currentFormIsValid
  }

  saveAndExit(navigateBack = true) {
    const formBody = {
      request: {
        event: this.getFormBodyOfEvent()
      }
    }
    this.eventSvc.updateEvent(formBody, this.eventId).subscribe({
      next: res => {
        if (res) {
          this.openSnackBar('Event details saved successfully')
          if (navigateBack) {
            this.navigateBack()
          }
        }
      },
      error: (error: HttpErrorResponse) => {
        const errorMessage = _.get(error, 'error.message', 'Something went wrong while creating event, please try again')
        this.openSnackBar(errorMessage)
      }
    })
  }

  getFormBodyOfEvent() {
    const eventDetails: any = JSON.parse(JSON.stringify(this.eventDetails))

    const eventBaseDetails = this.eventDetailsForm.value
    eventDetails['name'] = eventBaseDetails.eventName
    eventDetails['description'] = eventBaseDetails.description
    eventDetails['resourceType'] = eventBaseDetails.eventCategory
    eventDetails['streamType'] = eventBaseDetails.streamType
    eventDetails['startDate'] = eventBaseDetails.startDate
    eventDetails['startTime'] = eventBaseDetails.startTime
    eventDetails['endTime'] = eventBaseDetails.endTime
    eventDetails['resourceUrl'] = eventBaseDetails.resourceUrl

    if (this.speakersList) {
      eventDetails['speakers'] = this.speakersList
    }
    if (this.materialsList) {
      eventDetails['eventHandouts'] = this.materialsList
    }

    return eventDetails
  }

  //#endregion

  private openSnackBar(message: string) {
    this.matSnackBar.open(message)
  }

}
