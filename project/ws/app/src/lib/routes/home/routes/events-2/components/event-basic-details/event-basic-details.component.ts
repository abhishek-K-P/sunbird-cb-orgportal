import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { FormGroup, Validators } from '@angular/forms'
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar'
import * as _ from 'lodash'
import { events } from '../../models/events.model'
import { EventsService } from '../../services/events.service'
import { map, mergeMap } from 'rxjs/operators'
import { environment } from '../../../../../../../../../../../src/environments/environment'
import { HttpErrorResponse } from '@angular/common/http'
import moment from 'moment'
import { LoaderService } from '../../../../../../../../../../../src/app/services/loader.service'

@Component({
  selector: 'ws-app-event-basic-details',
  templateUrl: './event-basic-details.component.html',
  styleUrls: ['./event-basic-details.component.scss']
})
export class EventBasicDetailsComponent implements OnInit, OnChanges {

  //#region (global variables)
  @Input() eventDetails!: FormGroup
  @Input() openMode = 'edit'
  @Input() userProfile: any

  evntCategorysList = ['Webinar', 'Karmayogi Talks', 'Karmayogi Saptah']
  todayDate = new Date()

  maxTimeToStart = '11:30 pm'
  minTimeToEnd = '12:30 am'
  timeGap = 15

  //#endregion

  constructor(
    private matSnackBar: MatLegacySnackBar,
    private eventSvc: EventsService,
    private loaderService: LoaderService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.eventDetails) {
      const startTime = _.get(this.eventDetails, 'value.startTime')
      if (startTime) {
        this.eventDetails.controls.startTime.patchValue(this.convertTo12HourFormat(startTime))
      }

      const endTime = _.get(this.eventDetails, 'value.endTime')
      if (endTime) {
        this.eventDetails.controls.endTime.patchValue(this.convertTo12HourFormat(endTime))
      }
    }
  }

  convertTo12HourFormat(timeWithTimezone: string): string {
    const time = timeWithTimezone.split('+')[0]
    const [hours, minutes] = time.split(':')
    let hour = parseInt(hours)
    let period = 'AM'
    if (hour >= 12) {
      period = 'PM'
      if (hour > 12) {
        hour -= 12
      }
    } else if (hour === 0) {
      hour = 12
    }
    const formattedTime = `${hour}:${minutes} ${period}`
    return formattedTime
  }

  ngOnInit(): void {
    if (this.eventDetails.controls.startTime) {
      this.eventDetails.controls.startTime.valueChanges.subscribe((time) => {
        this.generatMinTimeToEnd(time)
      })
    }
    if (this.eventDetails.controls.registrationLink) {
      this.eventDetails.controls.registrationLink.valueChanges.subscribe((url) => {
        if (url && url !== '') {
          this.eventDetails.controls.recordedLinks.patchValue([])
          this.eventDetails.controls.recordedLinks.clearValidators()
          this.eventDetails.controls.registrationLink.setValidators([Validators.required])
          this.eventDetails.controls.recordedLinks.updateValueAndValidity()
          this.eventDetails.controls.registrationLink.updateValueAndValidity()
        }
      })
    }
  }


  generatMinTimeToEnd(time: string) {
    let [timePart, period] = time.split(' ')
    let [hours, minutes] = timePart.split(':').map(Number)
    minutes += this.timeGap
    if (minutes >= 60) {
      minutes -= 60
      hours += 1
    }
    if (hours > 12) {
      hours -= 12
      if (period === 'AM') {
        period = 'PM'
      } else {
        period = 'AM'
      }
    }
    if (hours === 12 && minutes === 0) {
      period = period === 'AM' ? 'PM' : 'AM'
    }
    const formattedTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${period}`
    this.minTimeToEnd = formattedTime
    if (this.eventDetails.controls.startTime) {
      this.eventDetails.controls.endTime.patchValue('')
    }
  }

  get appIconName(): string {
    let name = ''
    const appiconurl = _.get(this.eventDetails, 'value.appIcon', '')
    if (appiconurl) {
      const urlSplit = appiconurl.split('_')
      if (urlSplit.length > 0) {
        name = urlSplit[urlSplit.length - 1]
      }
    }
    return name
  }

  get uploadedVideoName(): string {
    let name = ''
    const uploadedVideoUrl = _.get(this.eventDetails, 'value.recordedLinks', [])
    if (uploadedVideoUrl.length > 0) {
      const urlSplit = uploadedVideoUrl[0].split('_')
      if (urlSplit.length > 0) {
        name = urlSplit[urlSplit.length - 1]
      }
    }
    return name
  }

  removeFile(item = 'appIcon') {
    if (item === 'appIcon' && this.eventDetails.controls.appIcon) {
      this.eventDetails.controls.appIcon.patchValue('')
      this.eventDetails.controls.appIcon.updateValueAndValidity()
    } else if (item === 'uploadedVideo' && this.eventDetails.controls.recordedLinks) {
      this.eventDetails.controls.recordedLinks.patchValue([])
      this.eventDetails.controls.recordedLinks.updateValueAndValidity()
      this.eventDetails.controls.registrationLink.setValidators([Validators.required])
      this.eventDetails.controls.registrationLink.updateValueAndValidity()
    }
  }

  onFileSelected(files: any) {
    let imagePath: any = ''
    if (files.length === 0) {
      return
    }
    const mimeType = files[0].type
    if (!mimeType.startsWith('image/')) {
      this.openSnackBar('Only images are supported')
      return
    }
    const reader = new FileReader()
    imagePath = files[0]
    if (imagePath && imagePath.size > events.IMAGE_MAX_SIZE) {
      this.openSnackBar('Selected image size is more')
      imagePath = ''
      return
    }
    reader.readAsDataURL(files[0])
    this.saveImage(imagePath)
  }

  saveImage(imagePath: any, mediaType = 'image') {
    if (imagePath) {
      const org = []
      const createdforarray: any[] = []
      createdforarray.push(_.get(this.userProfile, 'rootOrgId', ''))
      org.push(_.get(this.userProfile, 'departmentName', ''))

      const request = {
        request: {
          content: {
            name: 'image asset',
            creator: _.get(this.userProfile, 'userName', ''),
            createdBy: _.get(this.userProfile, 'userId', ''),
            code: 'image asset',
            mimeType: imagePath.type,
            mediaType: 'image',
            contentType: 'Asset',
            primaryCategory: 'Asset',
            organisation: org,
            createdFor: createdforarray,
          },
        },
      }
      this.loaderService.changeLoaderState(true)
      this.eventSvc.createContent(request).pipe(mergeMap((res: any) => {
        const contentID = _.get(res, 'result.identifier')
        const formData: FormData = new FormData()
        formData.append('data', imagePath)
        if (contentID) {
          return this.eventSvc.uploadContent(contentID, formData).pipe(map((fdata: any) => {
            return _.get(fdata, 'result.artifactUrl', '')
          }))
        } else {
          throw new Error('Something went wrong please try again')
        }
      })).subscribe({
        next: res => {
          this.loaderService.changeLoaderState(false)
          if (res) {
            const createdUrl = res
            const urlToReplace = 'https://storage.googleapis.com/igot'//https://portal.dev.karmayogibharat.net
            let appIcon = createdUrl
            if (createdUrl.startsWith(urlToReplace)) {
              const urlSplice = createdUrl.slice(urlToReplace.length).split('/')
              appIcon = `${environment.domainName}assets/public/${urlSplice.slice(1).join('/')}`
            }
            if (mediaType === 'image') {
              if (this.eventDetails.controls.appIcon) {
                this.eventDetails.controls.appIcon.patchValue(appIcon)
                this.eventDetails.controls.appIcon.updateValueAndValidity()
              }
            } else {
              if (this.eventDetails.controls.recordedLinks) {
                this.eventDetails.controls.recordedLinks.patchValue([appIcon])
                this.eventDetails.controls.recordedLinks.setValidators([Validators.required])
                this.eventDetails.controls.registrationLink.patchValue('')
                this.eventDetails.controls.registrationLink.clearValidators()
                this.eventDetails.controls.recordedLinks.updateValueAndValidity()
                this.eventDetails.controls.registrationLink.updateValueAndValidity()
              }
            }
          }
        },
        error: (error: HttpErrorResponse) => {
          this.loaderService.changeLoaderState(false)
          const errorMessage = _.get(error, 'error.message', 'Something went wrong please try again')
          this.openSnackBar(errorMessage)
        }
      })
    }
  }

  preventDefaultCDK(event: DragEvent, isEneter = ''): void {
    event.preventDefault()
    event.stopPropagation()
    if (isEneter) {
      const dropArea = event.target as HTMLElement
      dropArea.style.opacity = isEneter === 'enter' ? '0.5' : '1'
    }
  }

  onDrop(event: DragEvent): void {
    this.preventDefaultCDK(event, 'leave')

    const files = event.dataTransfer?.files
    if (files) {
      this.onVideoSelected(files)
    }
  }

  onVideoSelected(files: any) {
    let videoPath: any = ''
    if (files.length === 0) {
      return
    }
    const mimeType = files[0].type
    if (!mimeType.startsWith('video/')) {
      this.openSnackBar('Only video files are supported')
      return
    }
    videoPath = files[0]

    const MAX_VIDEO_SIZE = 400 * 1024 * 1024

    if (videoPath.size > MAX_VIDEO_SIZE) {
      this.openSnackBar('Selected video size exceeds the 400MB limit')
      videoPath = ''
      return
    }
    const mediaType = 'video'
    this.saveImage(videoPath, mediaType)
  }

  showValidationMsg(controlName: string, validationType: string): Boolean {
    let showMsg = false
    const control = _.get(this.eventDetails, `controls.${controlName}`)
    if (control && control.touched && control.invalid && control.hasError(validationType)) {
      showMsg = true
    }
    return showMsg
  }

  onStartTimeChange(event: any) {
    const startTime = event ? event.formatted : ''
    if (startTime) {
      const minEndTime = this.calculateMinEndTime(startTime)
      this.minTimeToEnd = minEndTime
      if (this.eventDetails) {
        const endTimeControl = this.eventDetails.get('endTime')
        if (endTimeControl) {
          endTimeControl.setValue('')
        }
      }
    }
  }

  calculateMinEndTime(startTime: string): string {
    const startMoment = moment(startTime, 'HH:mm')
    const minEndTimeMoment = startMoment.add(30, 'minutes')
    return minEndTimeMoment.format('HH:mm')
  }

  private openSnackBar(message: string) {
    this.matSnackBar.open(message)
  }

}
