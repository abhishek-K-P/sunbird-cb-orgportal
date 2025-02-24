import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
import { material } from '../../models/events.model'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import * as _ from 'lodash'
import { environment } from '../../../../../../../../../../../src/environments/environment'
import { HttpErrorResponse } from '@angular/common/http'
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar'
import { map, mergeMap } from 'rxjs/operators'
import { LoaderService } from '../../../../../../../../../../../src/app/services/loader.service'
import { EventsService } from '../../services/events.service'

@Component({
  selector: 'ws-app-material-details',
  templateUrl: './material-details.component.html',
  styleUrls: ['./material-details.component.scss']
})
export class MaterialDetailsComponent implements OnChanges {
  @Input() materialDetails: material | undefined
  @Input() openMaterial: boolean = false
  @Input() openMode = 'edit'
  @Input() userProfile: any
  @Output() updatedMaterialDetails = new EventEmitter<material>()
  @Output() canCloseOrOpenMaterial = new EventEmitter<boolean>()
  @Output() currentMaterialSaveUpdate = new EventEmitter<boolean>()
  @Output() deleteMaterial = new EventEmitter<boolean>()

  currentMaterialSaved = true

  eventForm!: FormGroup
  content = ''
  uploadedDocTypeImg = '/assets/icons/pdf.svg'
  materialName = ''
  materialType = 'pdf'

  constructor(
    private formBuilder: FormBuilder,
    private matSnackBar: MatLegacySnackBar,
    private eventSvc: EventsService,
    private loaderService: LoaderService
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
          title: new FormControl(_.get(this.materialDetails, 'title', ''), [Validators.required]),
          content: new FormControl(_.get(this.materialDetails, 'content', ''), [Validators.required]),
        })
        this.genrateMaterialName()

        this.eventForm.controls.title.valueChanges.subscribe((value: string) => {
          if (value && _.get(this.materialDetails, 'title') !== value && this.currentMaterialSaved) {
            this.currentMaterialSaved = false
            this.currentMaterialSaveUpdate.emit(this.currentMaterialSaved)
          }
        })

        if (this.openMode === 'view') {
          this.eventForm.disable()
        }
      }
    }
  }

  genrateMaterialName() {
    let name = ''
    const appiconurl = _.get(this.eventForm, 'value.content', '')
    if (appiconurl) {
      const urlSplit = appiconurl.split('_')
      if (urlSplit.length > 0) {
        name = urlSplit[urlSplit.length - 1]
      }
    }
    this.materialName = name
    this.genrateUploadedDocTypeImg()
  }

  genrateUploadedDocTypeImg() {
    const materialName = this.materialName
    if (materialName.includes('.pdf')) {
      this.uploadedDocTypeImg = '/assets/icons/pdf.svg'
      this.materialType = '1 pdf'
    } else if (materialName.includes('.ppt')) {
      this.uploadedDocTypeImg = '/assets/icons/ppt.svg'
      this.materialType = '1 ppt'
    } else if (materialName.includes('.doc')) {
      this.uploadedDocTypeImg = '/assets/icons/doc.svg'
      this.materialType = '1 doc'
    }
  }

  removeMaterial() {
    if (this.eventForm && this.eventForm.controls && this.eventForm.controls.content) {
      this.eventForm.controls.content.patchValue('')
      this.eventForm.controls.content.updateValueAndValidity()
      this.materialName = ''
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
    this.eventForm.markAllAsTouched()
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
      this.onMaterialSelect(files)
    }
  }

  onMaterialSelect(files: any) {
    if (files.length === 0) {
      return
    }
    const mimeType = files[0].type
    if (mimeType.match(/application\/(pdf|vnd.ms-powerpoint|msword)/) == null) {
      this.openSnackBar('Invalid file type. Please upload a PDF, PPT, or DOC file.')
      return
    }
    const reader = new FileReader()
    reader.readAsDataURL(files[0])
    this.loaderService.changeLoaderState(true)
    reader.onload = _event => {
      this.loaderService.changeLoaderState(false)
      this.saveFile(files[0])
    }
  }

  saveFile(filePath: any) {
    if (filePath) {
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
            mimeType: filePath.type,
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
        formData.append('data', filePath)
        if (contentID) {
          return this.eventSvc.uploadContent(contentID, formData).pipe(map((fdata: any) => {
            return _.get(fdata, 'result.artifactUrl', '')
          }))
        } else {
          throw new Error('Something went wrong please try again')
        }
      })).subscribe({
        next: (res: any) => {
          this.loaderService.changeLoaderState(false)
          if (res) {
            const createdUrl = res
            const urlToReplace = 'https://storage.googleapis.com/igot'
            let fileUrl = createdUrl
            if (createdUrl.startsWith(urlToReplace)) {
              const urlSplice = createdUrl.slice(urlToReplace.length).split('/')
              fileUrl = `${environment.domainName}/assets/public/${urlSplice.slice(1).join('/')}`
            }
            if (this.eventForm && this.eventForm.controls && this.eventForm.controls.content) {
              this.eventForm.controls.content.patchValue(fileUrl)
              this.eventForm.controls.content.updateValueAndValidity()
              this.genrateMaterialName()
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

  private openSnackBar(message: string) {
    this.matSnackBar.open(message)
  }
}
