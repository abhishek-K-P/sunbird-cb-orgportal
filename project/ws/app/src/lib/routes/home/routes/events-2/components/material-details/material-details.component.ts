import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
import { material } from '../../models/events.model'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import * as _ from 'lodash'

@Component({
  selector: 'ws-app-material-details',
  templateUrl: './material-details.component.html',
  styleUrls: ['./material-details.component.scss']
})
export class MaterialDetailsComponent implements OnChanges {
  @Input() materialDetails: material | undefined
  @Input() openMaterial: boolean = false
  @Output() updatedMaterialDetails = new EventEmitter<material>()
  @Output() canCloseOrOpenMaterial = new EventEmitter<boolean>()
  @Output() currentMaterialSaveUpdate = new EventEmitter<boolean>()
  @Output() deleteMaterial = new EventEmitter<boolean>()

  currentMaterialSaved = true

  eventForm!: FormGroup
  fileUrl = ''

  constructor(
    private formBuilder: FormBuilder
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.materialDetails) {
      this.buildForm()
    }
  }

  buildForm() {
    if (this.materialDetails) {
      if (this.eventForm) {
        this.eventForm.setValue(this.materialDetails)
      } else {
        this.eventForm = this.formBuilder.group({
          fullName: new FormControl(_.get(this.materialDetails, 'fullName', ''), [Validators.required]),
          fileUrl: new FormControl(_.get(this.materialDetails, 'fileUrl', '')),
        })

        this.eventForm.controls.fullName.valueChanges.subscribe((value: string) => {
          if (value && _.get(this.materialDetails, 'fullName') !== value && this.currentMaterialSaved) {
            this.currentMaterialSaved = false
            this.currentMaterialSaveUpdate.emit(this.currentMaterialSaved)
          }
        })
      }
    }
  }

  openStatus(status: boolean) {
    this.canCloseOrOpenMaterial.emit(status)
  }

  deleteMaterialFromList() {
    this.deleteMaterial.emit(true)
  }

  saveDetails() {
    if (this.eventForm.valid) {
      this.updatedMaterialDetails.emit(this.eventForm.value)
    }
  }
}
