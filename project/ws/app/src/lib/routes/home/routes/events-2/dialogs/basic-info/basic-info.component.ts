import { Component, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { events } from '../../models/events.model'
import * as _ from 'lodash'
import { EventsService } from '../../services/events.service'
import { map, mergeMap } from 'rxjs/operators'
import { HttpErrorResponse } from '@angular/common/http'
import { environment } from '../../../../../../../../../../../src/environments/environment'

@Component({
  selector: 'ws-app-basic-info',
  templateUrl: './basic-info.component.html',
  styleUrls: ['./basic-info.component.scss']
})
export class BasicInfoComponent implements OnInit {

  eventForm!: FormGroup
  imgURL: string | ArrayBuffer | null = null
  imagePath: any
  userProfile: any
  userEmail = ''

  constructor(
    private dialogRef: MatDialogRef<BasicInfoComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
    private formBuilder: FormBuilder,
    private matSnackBar: MatSnackBar,
    private eventSvc: EventsService
  ) {
    this.userProfile = data.userProfile
    this.userEmail = data.userEmail
  }

  ngOnInit(): void {
    this.createForm()
  }

  createForm() {
    const noSpecialChar = new RegExp(
      /^[\u0900-\u097F\u0980-\u09FF\u0C00-\u0C7F\u0B80-\u0BFF\u0C80-\u0CFF\u0D00-\u0D7F\u0A80-\u0AFF\u0B00-\u0B7F\u0A00-\u0A7Fa-zA-Z0-9\(\)\$\[\]\.\-,:!' _\/]*$/ // NOSONAR
    )
    this.eventForm = this.formBuilder.group({
      eventName: new FormControl('', [Validators.required, Validators.pattern(noSpecialChar)]),
      eventType: new FormControl('recorded', [Validators.required]),
    })
  }

  onFileSelected(files: any) {
    if (files.length === 0) {
      return
    }
    const mimeType = files[0].type
    if (mimeType.match(/image\/*/) == null) {
      this.openSnackBar('Only JPG and PNG files are supported')
      return
    }
    const reader = new FileReader()
    this.imagePath = files[0]
    if (this.imagePath && this.imagePath.size > events.IMAGE_MAX_SIZE) {
      this.openSnackBar('Selected image size is more')
      this.imagePath = ''
      return
    }
    reader.readAsDataURL(files[0])
    reader.onload = _event => {
      this.imgURL = reader.result
    }
  }

  onSave() {
    if (this.eventForm.valid && this.imgURL) {
      this.saveImage()
    }
  }

  saveImage() {
    if (this.imagePath) {
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
            mimeType: this.imagePath.type,
            mediaType: 'image',
            contentType: 'Asset',
            primaryCategory: 'Asset',
            organisation: org,
            createdFor: createdforarray,
          },
        },
      }
      this.eventSvc.createContent(request).pipe(mergeMap((res: any) => {
        const contentID = _.get(res, 'result.identifier')
        const formData: FormData = new FormData()
        formData.append('data', this.imagePath)
        if (contentID) {
          return this.eventSvc.uploadContent(contentID, formData).pipe(map((fdata: any) => {
            return _.get(fdata, 'result.artifactUrl', '')
          }))
        } else {
          throw new Error('Something went wrong please try again')
        }
      })).subscribe({
        next: res => {
          if (res) {
            const createdUrl = res
            const urlToReplace = 'https://storage.googleapis.com/igot'//https://portal.dev.karmayogibharat.net
            let appIcon = createdUrl
            if (createdUrl.startsWith(urlToReplace)) {
              const urlSplice = createdUrl.slice(urlToReplace.length).split('/')
              appIcon = `${environment.domainName}/assets/public/${urlSplice.slice(1).join('/')}`
            }
            this.createEvent(appIcon)
          }
        },
        error: (error: HttpErrorResponse) => {
          const errorMessage = _.get(error, 'error.message', 'Something went wrong please try again')
          this.openSnackBar(errorMessage)
        }
      })
    }
  }

  createEvent(appIcon: string) {
    if (this.eventForm.valid && this.imgURL) {
      const createdforarray: any[] = []
      createdforarray.push(_.get(this.userProfile, 'rootOrgId', ''))
      const requestBody = {
        request: {
          event: {
            mimeType: 'application/html',
            locale: 'en',
            isExternal: true,
            name: _.get(this.eventForm, 'controls.eventName.value', ''),
            description: '',
            appIcon: appIcon,
            category: 'Event',
            createdBy: _.get(this.userProfile, 'userId', ''),
            createdByName: _.get(this.userProfile, 'userName', ''),
            createrEmail: this.userEmail ? this.userEmail : _.get(this.userProfile, 'email', ''),
            authoringDisabled: false,
            isContentEditingDisabled: false,
            isMetaEditingDisabled: false,
            learningObjective: '',
            expiryDate: '',
            duration: 0,
            registrationLink: '',
            resourceType: '',
            categoryType: 'Article',
            creatorDetails: '',
            sourceName: _.get(this.userProfile, 'departmentName', ''),
            startDate: '',
            endDate: '',
            startTime: '',
            endTime: '',
            code: '', // what is this
            eventType: 'Online',
            registrationEndDate: '',
            owner: _.get(this.userProfile, 'departmentName', ''),
            createdFor: createdforarray
          }
        }
      }
      this.eventSvc.createEvent(requestBody).subscribe({
        next: res => {
          if (res) {
            this.dialogRef.close(_.get(res, 'result.identifier', ''))
          }
        },
        error: (error: HttpErrorResponse) => {
          const errorMessage = _.get(error, 'error.message', 'Something went wrong while creating event, please try again')
          this.openSnackBar(errorMessage)
        }
      })
      // this.dialogRef.close()
    }
  }

  private openSnackBar(message: string) {
    this.matSnackBar.open(message)
  }

}
