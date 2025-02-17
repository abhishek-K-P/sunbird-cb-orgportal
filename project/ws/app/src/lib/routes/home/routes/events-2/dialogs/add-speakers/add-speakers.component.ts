import { Component, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { MatLegacyDialogRef, MAT_LEGACY_DIALOG_DATA } from '@angular/material/legacy-dialog'
import * as _ from 'lodash'
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'
import { EventsService } from '../../services/events.service'
import { speaker } from '../../models/events.model'
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar'

const EMAIL_PATTERN = /^[a-zA-Z0-9*]+([a-zA-Z0-9._-]*[a-zA-Z0-9*]+)*@[a-zA-Z0-9]+([-a-zA-Z0-9]*[a-zA-Z0-9]+)?(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,10}$/

@Component({
  selector: 'ws-app-add-speakers',
  templateUrl: './add-speakers.component.html',
  styleUrls: ['./add-speakers.component.scss']
})
export class AddSpeakersComponent implements OnInit {

  speakerDetails: any
  speakerForm: FormGroup | undefined
  filteredUsers: any[] = []
  rootOrgId = ''
  allUsers: any[] = []
  speakersList: speaker[] = []
  speakerIndex = -1

  constructor(
    private dialogRef: MatLegacyDialogRef<AddSpeakersComponent>,
    @Inject(MAT_LEGACY_DIALOG_DATA) data: any,
    private formBuilder: FormBuilder,
    private eventsService: EventsService,
    private matSnackBar: MatLegacySnackBar,
  ) {
    this.speakersList = data.speakersList ? data.speakersList : []
    this.speakerIndex = data.speakerIndex
    this.speakerDetails = (data.speakerIndex || data.speakerIndex === 0) && this.speakersList[data.speakerIndex] ? this.speakersList[data.speakerIndex] : null
    this.rootOrgId = data.rootOrgId
  }

  ngOnInit(): void {
    this.speakerForm = this.formBuilder.group({
      email: new FormControl(_.get(this.speakerDetails, 'email', ''), [Validators.required, Validators.pattern(EMAIL_PATTERN)]),
      name: new FormControl(_.get(this.speakerDetails, 'name', ''), [Validators.required]),
      description: new FormControl(_.get(this.speakerDetails, 'description', ''))
    })

    this.speakerForm.controls.email.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe((res: any) => {
      this.filteredUsers = []
      if (res) {
        this.getUsersToShare(res)
      }
    })
  }

  getUsersToShare(queryStr: string) {
    this.eventsService.searchUser(queryStr, this.rootOrgId).subscribe(data => {
      if (data.result && data.result.response) {
        const apiResponse = data.result.response.content
        let name = ''
        let pEmail = ''
        apiResponse.forEach((apiData: any) => {
          apiData.firstName.split(' ').forEach((d: any) => {
            name = name + d.substr(0, 1).toUpperCase()
          })
          if (apiData.profileDetails && apiData.profileDetails.personalDetails) {
            pEmail = apiData.profileDetails.personalDetails.primaryEmail
            if (!this.allUsers.filter(user => user.email.toLowerCase().includes(pEmail.toLowerCase())).length) {
              this.allUsers.push(
                {
                  maskedEmail: apiData.maskedEmail,
                  id: apiData.identifier,
                  name: apiData.firstName,
                  iconText: name,
                  email: pEmail,
                }
              )
            }
          }
        })
      }
      if (this.allUsers.length === 0) {
        this.filteredUsers = []
      }
      this.filteredUsers = this.filterSharedUsers(queryStr)
    })
  }

  selected(user: any): void {
    if (user && this.speakerForm && this.speakerForm?.controls.name) {
      this.speakerForm.controls.name.patchValue(user.name)
    }
  }

  filterSharedUsers(value: string): string[] {
    if (value) {
      const filterValue = value.toLowerCase()
      return this.allUsers.filter(user => user.name.toLowerCase().includes(filterValue))
    }
    return []
  }

  addSpeaker() {
    if (this.speakerForm) {
      if (this.speakerForm.valid) {
        const updatedSpeakerDetails = this.speakerForm.value
        if (this.speakerDetails === null) {
          if (this.speakersList.find((addedSpeaker: any) => addedSpeaker.email.toLowerCase() === updatedSpeakerDetails.email.toLocaleLowerCase())) {
            this.openSnackBar('There is already a speaker with the same email. Please add the speaker with a different email.')
          } else {
            this.speakersList.push(updatedSpeakerDetails)
            this.dialogRef.close(this.speakerForm.value)
          }
        } else {
          const index = this.speakersList.findIndex((addedSpeaker: any) => addedSpeaker.email.toLowerCase() === updatedSpeakerDetails.email.toLocaleLowerCase())
          if (index === this.speakerIndex || index < 0) {
            this.speakersList[this.speakerIndex] = updatedSpeakerDetails
            this.dialogRef.close(this.speakerForm.value)
          } else {
            this.openSnackBar('There is already a speaker with the same email. Please update speaker with a different email.')
          }
        }
      }
      this.speakerForm.markAllAsTouched()
    }
  }

  private openSnackBar(message: string) {
    this.matSnackBar.open(message)
  }

}
