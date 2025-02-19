import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core'
import { EventsService } from '../../services/events.service'
import { ActivatedRoute, Router } from '@angular/router'
import * as _ from 'lodash'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { URL_PATRON, material, speaker } from '../../models/events.model'
import { StepperSelectionEvent } from '@angular/cdk/stepper'
import { MatStepper } from '@angular/material/stepper'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { HttpErrorResponse } from '@angular/common/http'
import { DatePipe } from '@angular/common'
import { LoaderService } from '../../../../../../../../../../../src/app/services/loader.service'

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
  updatedEventDetails: any
  eventDetailsForm!: FormGroup
  speakersList: speaker[] = []
  materialsList: material[] = []
  competencies: any = []
  currentStepperIndex = 0
  openMode = 'edit'
  pathUrl = ''
  userProfile: any
  showPreview = false
  selectedStepperLable = 'Basic Details'
  //#endregion

  constructor(
    private eventSvc: EventsService,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private router: Router,
    private matSnackBar: MatSnackBar,
    private datePipe: DatePipe,
    private loaderService: LoaderService,
    private cdr: ChangeDetectorRef
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
      registrationLink: new FormControl('', [Validators.required, Validators.pattern(URL_PATRON)]),
      recoredEventUrl: new FormControl(''),
      appIcon: new FormControl('', [Validators.required]),
    })
  }

  getEventDetailsFromResolver() {
    this.userProfile = _.get(this.activatedRoute, 'snapshot.data.configService.userProfile')
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
    const startDate = _.get(this.eventDetails, 'startDate', '')
    const registrationLink = _.get(this.eventDetails, 'registrationLink', '')
    const isYoutubeVideo = registrationLink.toLowerCase().includes('youtube')
    if (registrationLink && isYoutubeVideo === false) {
      this.eventDetailsForm.controls.registrationLink.clearValidators()
      this.eventDetailsForm.controls.recoredEventUrl.setValidators([Validators.required])
      this.eventDetailsForm.controls.recoredEventUrl.updateValueAndValidity()
      this.eventDetailsForm.controls.registrationLink.updateValueAndValidity()
    }
    const eventBaseDetails = {
      eventName: _.get(this.eventDetails, 'name', ''),
      description: _.get(this.eventDetails, 'description', ''),
      eventCategory: _.get(this.eventDetails, 'resourceType', ''),
      streamType: _.get(this.eventDetails, 'streamType', ''),//new key to add
      startDate: startDate ? new Date(startDate) : startDate,
      startTime: _.get(this.eventDetails, 'startTime', ''),
      endTime: _.get(this.eventDetails, 'endTime', ''),
      registrationLink: '',
      recoredEventUrl: '',
      appIcon: _.get(this.eventDetails, 'appIcon', '')
    }
    if (registrationLink) {
      if (isYoutubeVideo) {
        eventBaseDetails.registrationLink = registrationLink
      } else {
        eventBaseDetails.recoredEventUrl = registrationLink
      }
    }
    this.eventDetailsForm.setValue(eventBaseDetails)
    this.eventDetailsForm.updateValueAndValidity()

    this.speakersList = _.get(this.eventDetails, 'speakers', [])
    this.materialsList = _.get(this.eventDetails, 'eventHandouts', [])
    this.competencies = _.get(this.eventDetails, 'competencies_v6', [])

  }

  ngAfterViewInit() {
    if (this.stepper) {
      this.stepper._getIndicatorType = () => 'number'
      this.cdr.detectChanges()
    }
  }
  //#endregion

  //#region (ui interactions)
  onSelectionChange(event: StepperSelectionEvent) {
    this.currentStepperIndex = event.selectedIndex
    if (this.stepper) {
      const selectedStep = this.stepper.steps.toArray()[this.currentStepperIndex]
      this.selectedStepperLable = selectedStep.label
      this.cdr.detectChanges()
    }
    if (this.selectedStepperLable === 'Preview') {
      this.updatedEventDetails = this.getFormBodyOfEvent(this.eventDetails['status'])
    }
  }

  navigateBack() {
    this.router.navigate([`/app/home/events/${this.pathUrl}`])
  }

  moveToNextForm() {
    this.eventDetailsForm.markAllAsTouched()
    this.eventDetailsForm.updateValueAndValidity()
    if (this.canMoveToNext || this.openMode === 'view') {
      this.currentStepperIndex = this.currentStepperIndex + 1
    }
  }

  preview() {
    if (this.eventDetails && this.eventDetails['status']) {
      this.showPreview = true
      this.updatedEventDetails = this.getFormBodyOfEvent(this.eventDetails['status'])
      setTimeout(() => {
        let foundIndex = -1
        if (this.stepper) {
          const stepersList = this.stepper.steps.toArray()
          if (stepersList) {
            foundIndex = stepersList.findIndex((steper) => steper.label === 'Preview')
          }

          if (foundIndex !== -1) {
            // this.stepper.selectedIndex = foundIndex
            this.currentStepperIndex = foundIndex
          }
        }
      }, 100)
    }
  }

  publish() {
    if (this.canPublish) {
      this.saveAndExit('SentToPublish')
    }
  }

  get canMoveToNext() {
    let currentFormIsValid = false
    if (this.selectedStepperLable === 'Basic Details') {
      if (this.eventDetailsForm.valid) {
        currentFormIsValid = true
      } else {
        this.openSnackBar('Please fill mandatory fields')
      }
    } else if (this.selectedStepperLable === 'Add Speaker') {
      if (this.speakersList && this.speakersList.length) {
        currentFormIsValid = true
      } else {
        this.openSnackBar('Please add atleast one speaker')
      }
    } else if (this.selectedStepperLable === 'Add Material') {
      if (this.materialsList && this.materialsList.length) {
        currentFormIsValid = true
      } else {
        this.openSnackBar('Please add atleast one material')
      }
    }
    return currentFormIsValid
  }

  get canPublish(): boolean {
    if (this.selectedStepperLable === 'Add Competency' || this.selectedStepperLable === 'Preview') {
      if (this.eventDetailsForm.invalid) {
        this.openSnackBar('Please fill mandatory fields in Basic Details')
        return false
      }
      // if (!(this.speakersList && this.speakersList.length)) {
      //   this.openSnackBar('Please add atleast one speaker in add speakers')
      //   return false
      // }
      if (!(this.materialsList && this.materialsList.length)) {
        this.openSnackBar('Please add atleast one material in Add Material')
        return false
      }
      if (!(this.competencies && this.competencies.length)) {
        this.openSnackBar('Please add atleast one competency in Add Competency')
        return false
      }
      return true
    }
    return false
  }

  addCompetencies(competencies: any) {
    this.competencies = competencies
  }

  saveAndExit(status = 'Draft') {
    const formBody = {
      request: {
        event: this.getFormBodyOfEvent(status)
      }
    }
    this.loaderService.changeLoaderState(true)
    this.eventSvc.updateEvent(formBody, this.eventId).subscribe({
      next: res => {
        if (res) {
          const successMessage = status === 'Draft' ? 'Event details saved successfully' : 'Event details sent for approval successfully'
          this.openSnackBar(successMessage)
          setTimeout(() => {
            this.navigateBack()
            this.loaderService.changeLoaderState(false)
          }, 1000)
        } else {
          this.loaderService.changeLoaderState(false)
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loaderService.changeLoaderState(false)
        const errorMessage = _.get(error, 'error.message', 'Something went wrong while updating event, please try again')
        this.openSnackBar(errorMessage)
      }
    })
  }

  getFormBodyOfEvent(status: string) {
    const eventDetails: any = JSON.parse(JSON.stringify(this.eventDetails))
    const eventBaseDetails = this.eventDetailsForm.value
    let startTime = ''
    if (eventBaseDetails.startTime) {
      startTime = this.getFormatedTime(eventBaseDetails.startTime)
    }
    let endTime = ''
    if (eventBaseDetails.endTime) {
      endTime = this.getFormatedTime(eventBaseDetails.endTime)
    }
    eventDetails['name'] = eventBaseDetails.eventName
    eventDetails['description'] = eventBaseDetails.description
    eventDetails['resourceType'] = eventBaseDetails.eventCategory
    eventDetails['streamType'] = eventBaseDetails.streamType
    eventDetails['startDate'] = eventBaseDetails.startDate ? this.datePipe.transform(eventBaseDetails.startDate, 'yyyy-MM-dd') : ''
    eventDetails['endDate'] = eventBaseDetails.startDate ? this.datePipe.transform(eventBaseDetails.startDate, 'yyyy-MM-dd') : ''
    eventDetails['startTime'] = startTime
    eventDetails['endTime'] = endTime
    eventDetails['registrationLink'] = eventBaseDetails.registrationLink ? eventBaseDetails.registrationLink : eventBaseDetails.recoredEventUrl
    eventDetails['appIcon'] = eventBaseDetails.appIcon

    if (status === 'SentToPublish') {
      eventDetails['submitedOn'] = this.datePipe.transform(new Date(), 'dd MMM, yyyy')
    }

    if (this.speakersList) {
      eventDetails['speakers'] = this.speakersList
    }
    if (this.materialsList) {
      eventDetails['eventHandouts'] = this.materialsList
    }
    if (this.competencies) {
      eventDetails['competencies_v6'] = this.competencies
    }

    eventDetails['status'] = status

    return eventDetails
  }

  getFormatedTime(selectedTime: string): string {
    const timeString = selectedTime.trim()
    const timeParts = timeString.split(' ')

    const time = timeParts[0]
    const amPm = timeParts[1]

    const [hours, minutes] = time.split(':').map(num => parseInt(num))

    let hours24 = hours
    if (amPm === 'PM' && hours !== 12) {
      hours24 += 12
    } else if (amPm === 'AM' && hours === 12) {
      hours24 = 0
    }

    const timeFormatted = this.formatTime(hours24, minutes)
    const fixedTimezone = '+05:30'


    return `${timeFormatted}${fixedTimezone}`
  }

  formatTime(hours: number, minutes: number): string {
    const hoursFormatted = hours.toString().padStart(2, '0')
    const minutesFormatted = minutes.toString().padStart(2, '0')
    const seconds = '00'
    return `${hoursFormatted}:${minutesFormatted}:${seconds}`
  }

  //#endregion

  private openSnackBar(message: string) {
    this.matSnackBar.open(message)
  }

}
