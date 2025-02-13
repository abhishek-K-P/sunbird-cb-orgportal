import { Component, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { MatLegacyDialogRef, MAT_LEGACY_DIALOG_DATA } from '@angular/material/legacy-dialog'
import * as _ from 'lodash'
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'
import { EventsService } from '../../services/events.service'

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

  constructor(
    private dialogRef: MatLegacyDialogRef<AddSpeakersComponent>,
    @Inject(MAT_LEGACY_DIALOG_DATA) data: any,
    private formBuilder: FormBuilder,
    private eventsService: EventsService
  ) {
    this.speakerDetails = data.speaker
    this.rootOrgId = data.rootOrgId
  }

  ngOnInit(): void {
    this.speakerForm = this.formBuilder.group({
      email: new FormControl(_.get(this.speakerDetails, 'email', ''), [Validators.required, Validators.pattern(EMAIL_PATTERN)]),
      name: new FormControl(_.get(this.speakerDetails, 'name', '')),
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
    if (this.speakerForm && this.speakerForm.valid) {
      this.dialogRef.close(this.speakerForm.value)
    }
  }

}
