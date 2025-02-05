import { Component, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { MatLegacyDialogRef, MAT_LEGACY_DIALOG_DATA } from '@angular/material/legacy-dialog'
import * as _ from 'lodash'

@Component({
  selector: 'ws-app-add-speakers',
  templateUrl: './add-speakers.component.html',
  styleUrls: ['./add-speakers.component.scss']
})
export class AddSpeakersComponent implements OnInit {

  speakerDetails: any
  speakerForm: FormGroup | undefined

  constructor(
    private dialogRef: MatLegacyDialogRef<AddSpeakersComponent>,
    @Inject(MAT_LEGACY_DIALOG_DATA) data: any,
    private formBuilder: FormBuilder
  ) {
    this.speakerDetails = data
  }

  ngOnInit(): void {
    this.speakerForm = this.formBuilder.group({
      email: new FormControl(_.get(this.speakerDetails, 'email', ''), [Validators.required]),
      name: new FormControl(_.get(this.speakerDetails, 'name', '')),
      description: new FormControl(_.get(this.speakerDetails, 'description', ''))
    })
  }

  addSpeaker() {
    if (this.speakerForm && this.speakerForm.valid) {
      this.dialogRef.close(this.speakerForm.value)
    }
  }

}
