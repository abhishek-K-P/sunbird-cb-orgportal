import { Component, Input, OnInit } from '@angular/core'
import { material } from '../../models/events.model'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { EventsService } from '../../services/events.service'
import { map, mergeMap } from 'rxjs/operators'
import * as _ from 'lodash'
import { ActivatedRoute } from '@angular/router'
import { environment } from '../../../../../../../../../../../src/environments/environment'
import { HttpErrorResponse } from '@angular/common/http'


@Component({
  selector: 'ws-app-event-materials',
  templateUrl: './event-materials.component.html',
  styleUrls: ['./event-materials.component.scss']
})
export class EventMaterialsComponent implements OnInit {

  @Input() materialsList: material[] = []
  @Input() openMode = 'edit'

  userProfile: any
  filePath: any
  fileURL: any
  currentIndex = -1
  currentMaterialSaved = true

  constructor(
    private matSnackBar: MatSnackBar,
    private eventSvc: EventsService,
    private activeRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    if (_.get(this.activeRoute, 'snapshot.data.configService.userProfile')) {
      this.userProfile = _.get(this.activeRoute, 'snapshot.data.configService.userProfile')
    }
  }

  onFileSelected(files: any) {
    if (files.length === 0) {
      return
    }
    const mimeType = files[0].type
    if (mimeType.match(/application\/(pdf|vnd.ms-powerpoint|msword)/) == null) {
      this.openSnackBar('Invalid file type. Please upload a PDF, PPT, or DOC file.')
      return
    }
    const reader = new FileReader()
    this.filePath = files[0]
    // if (this.filePath && this.filePath.size > events.IMAGE_MAX_SIZE) {
    //   this.openSnackBar('Selected image size is more')
    //   this.filePath = ''
    //   return
    // }
    reader.readAsDataURL(files[0])
    reader.onload = _event => {
      this.fileURL = reader.result
      this.saveFile()
    }
  }

  saveFile() {
    if (this.filePath) {
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
            mimeType: this.filePath.type,
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
        formData.append('data', this.filePath)
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
            const urlToReplace = 'https://storage.googleapis.com/igot'
            let fileUrl = createdUrl
            if (createdUrl.startsWith(urlToReplace)) {
              const urlSplice = createdUrl.slice(urlToReplace.length).split('/')
              fileUrl = `${environment.domainName}/assets/public/${urlSplice.slice(1).join('/')}`
            }
            this.addNewFileToList(fileUrl)
          }
        },
        error: (error: HttpErrorResponse) => {
          const errorMessage = _.get(error, 'error.message', 'Something went wrong please try again')
          this.openSnackBar(errorMessage)
        }
      })
    }
  }

  addNewFileToList(fileUrl: string) {
    const fileDetails: material = {
      title: '',
      content: fileUrl
    }
    this.materialsList.unshift(fileDetails)
    this.currentIndex = 0
    this.currentMaterialSaved = false
  }

  updateMaterial(materialDetails: material, index: number) {
    this.materialsList[index] = materialDetails
    this.currentMaterialSaved = true
  }

  closeOrOpenMaterial(openStatus: boolean, index: number) {
    if (openStatus) {
      if (this.currentMaterialSaved) {
        this.currentIndex = index
      } else {
        this.openSnackBar('please save the details before')
      }
    } else if (openStatus === false) {
      this.currentIndex = -1
    }
  }

  currentMaterialSaveUpdate(event: boolean) {
    this.currentMaterialSaved = event
  }

  deleteMaterialFromList(event: boolean, index: number) {
    if (event) {
      this.materialsList.splice(index, 1)
    }
  }

  private openSnackBar(message: string) {
    this.matSnackBar.open(message)
  }

}
