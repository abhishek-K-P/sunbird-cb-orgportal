import { Component, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { HttpErrorResponse } from '@angular/common/http'
import { forkJoin, of } from 'rxjs'
import { mergeMap } from 'rxjs/operators'
import * as _ from 'lodash'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { comprehensiveAssessment, noSpecialCharAssessment } from '../../models/comprehensive-assessment.model'
import { ComprehensiveAssessmentService } from '../../services/comprehensive-assessment.service'
import { LoaderService } from '../../../../../../../../../../../src/app/services/loader.service'

interface IImageFormat {
  types: string[]
  extensions: RegExp
  message: string
}

/** Both the assessment image and the logo take PNG, JPG and JPEG. */
const IMAGE_FORMAT: IImageFormat = {
  types: ['image/png', 'image/jpeg'],
  extensions: /\.(png|jpe?g)$/i,
  message: 'Only PNG and JPEG files are supported',
}

@Component({
  selector: 'ws-app-comprehensive-assessment-basic-info',
  templateUrl: './basic-info.component.html',
  styleUrls: ['./basic-info.component.scss'],
  standalone: false,
})
export class BasicInfoComponent implements OnInit {

  assessmentForm!: FormGroup
  imgURL: string | ArrayBuffer | null = null
  imagePath: any
  logoURL: string | ArrayBuffer | null = null
  logoPath: any
  userProfile: any
  userEmail = ''
  orgData: any
  nameMaxLength = comprehensiveAssessment.NAME_MAX_LENGTH
  nameMinLength = comprehensiveAssessment.NAME_MIN_LENGTH
  /** `create` builds a new collection, `edit` only hands the updated values back. */
  mode = 'create'
  appIcon = ''
  creatorLogo = ''
  existingName = ''

  constructor(
    public dialogRef: MatDialogRef<BasicInfoComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
    private formBuilder: FormBuilder,
    private matSnackBar: MatSnackBar,
    private assessmentSvc: ComprehensiveAssessmentService,
    private loaderService: LoaderService,
    private configSvc: ConfigurationsService
  ) {
    this.userProfile = _.get(data, 'userProfile')
    this.userEmail = _.get(data, 'userEmail', '')
    this.mode = _.get(data, 'mode', 'create')
    this.appIcon = _.get(data, 'appIcon', '')
    this.creatorLogo = _.get(data, 'creatorLogo', '')
    this.existingName = _.get(data, 'assessmentName', '')
  }

  ngOnInit(): void {
    this.createForm()
    this.orgData = _.get(this.configSvc, 'orgReadData', {})
    if (this.isEditMode) {
      this.assessmentForm.patchValue({ assessmentName: this.existingName })
      this.imgURL = this.appIcon
    }
    this.creatorLogo = this.creatorLogo || _.get(this.orgData, 'logo', '')
    this.logoURL = this.creatorLogo
  }

  get isEditMode(): boolean {
    return this.mode === 'edit'
  }

  /** The image is mandatory, the logo is not. */
  get hasImage(): boolean {
    return !!this.imgURL
  }

  createForm() {
    this.assessmentForm = this.formBuilder.group({
      assessmentName: new FormControl('', [
        Validators.required,
        Validators.minLength(this.nameMinLength),
        Validators.maxLength(this.nameMaxLength),
        Validators.pattern(noSpecialCharAssessment),
      ]),
    })
  }

  onFileSelected(files: any) {
    const file = this.readImage(files, IMAGE_FORMAT, (url: string | ArrayBuffer | null) => this.imgURL = url)
    if (file) {
      this.imagePath = file
    }
  }

  onLogoSelected(files: any) {
    const file = this.readImage(files, IMAGE_FORMAT, (url: string | ArrayBuffer | null) => this.logoURL = url)
    if (file) {
      this.logoPath = file
    }
  }

  /** Validates the picked image and previews it, returns the file or null when it is refused. */
  private readImage(files: any, format: IImageFormat, onPreview: (url: string | ArrayBuffer | null) => void): File | null {
    if (!files || files.length === 0) {
      return null
    }
    const file = files[0]
    if (!format.types.includes(file.type) || !format.extensions.test(file.name || '')) {
      this.openSnackBar(format.message)
      return null
    }
    if (file.size > comprehensiveAssessment.IMAGE_MAX_SIZE) {
      this.openSnackBar('Please select an image with a size of less than 500KB.')
      return null
    }
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      onPreview(reader.result)
    }
    return file
  }

  /** Uploads whichever of the image and logo was newly picked, '' for the one that was not. */
  private uploadImages() {
    return forkJoin({
      appIcon: this.imagePath ? this.assessmentSvc.uploadImageAsset(this.imagePath, this.userProfile) : of(''),
      creatorLogo: this.logoPath ? this.assessmentSvc.uploadImageAsset(this.logoPath, this.userProfile) : of(''),
    })
  }

  onSave() {
    if (!this.assessmentForm.valid || !this.hasImage) {
      this.assessmentForm.markAllAsTouched()
      if (!this.hasImage) {
        this.openSnackBar('Please upload an image for the assessment')
      }
      return
    }
    if (this.isEditMode) {
      this.updateBasicInfo()
      return
    }
    this.createAssessment()
  }

  /**
   * Edit mode never touches the content api, it returns the updated name, appIcon and
   * creatorLogo so the caller can patch its form and persist them along with the rest of the
   * basic details. A newly picked image or logo still has to be uploaded here, both must be
   * artifact urls.
   */
  updateBasicInfo() {
    const assessmentName = _.get(this.assessmentForm, 'controls.assessmentName.value', '').trim()
    if (!this.imagePath && !this.logoPath) {
      this.dialogRef.close({ assessmentName, appIcon: this.appIcon, creatorLogo: this.creatorLogo })
      return
    }
    this.loaderService.changeLoaderState(true)
    this.uploadImages().subscribe({
      next: ({ appIcon, creatorLogo }) => {
        this.loaderService.changeLoaderState(false)
        this.dialogRef.close({
          assessmentName,
          appIcon: appIcon || this.appIcon,
          creatorLogo: creatorLogo || this.creatorLogo,
        })
      },
      error: (error: HttpErrorResponse) => {
        this.loaderService.changeLoaderState(false)
        this.openSnackBar(_.get(error, 'error.message', 'Something went wrong please try again'))
      },
    })
  }

  /**
   * Creates an image asset for each picked file, uploads it and then creates the assessment
   * collection with the image as appIcon / posterImage and the logo as creatorLogo.
   * The logo is optional, an assessment with none is created without one.
   */
  createAssessment() {
    this.loaderService.changeLoaderState(true)
    this.uploadImages().pipe(
      mergeMap(({ appIcon, creatorLogo }) => this.assessmentSvc.createAssessmentCollection(
        _.get(this.assessmentForm, 'controls.assessmentName.value', '').trim(),
        appIcon,
        creatorLogo || this.creatorLogo,
        this.userProfile,
        this.userEmail
      ))
    ).subscribe({
      next: (res: any) => {
        this.loaderService.changeLoaderState(false)
        const identifier = _.get(res, 'result.identifier', '')
        if (identifier) {
          this.openSnackBar('Comprehensive assessment created successfully')
          this.dialogRef.close(identifier)
        } else {
          this.openSnackBar('Something went wrong please try again')
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loaderService.changeLoaderState(false)
        const errorMessage = _.get(error, 'error.message',
          'Something went wrong while creating the assessment, please try again')
        this.openSnackBar(errorMessage)
      },
    })
  }

  get assessmentName() {
    return this.assessmentForm.get('assessmentName')
  }

  get assessmentNameLength(): number {
    return _.get(this.assessmentForm, 'controls.assessmentName.value.length', 0)
  }

  private openSnackBar(message: string) {
    this.matSnackBar.open(message)
  }

}
