import { Component, OnInit } from '@angular/core'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { ICustomRegistrationQRCodeResponse, IOnBoardingConfig, IRegisteredLinksList } from '../interface/onboarding.interface'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { Clipboard } from '@angular/cdk/clipboard'
import { LoadingPopupComponent } from '../loading-popup/loading-popup.component'
import { OnboardingService } from '../../../services/onboarding.service'
import { DesignationsService } from '../../designation/services/designations.service'
import _ from 'lodash'
import { EventService } from '@sunbird-cb/utils'

@Component({
  selector: 'ws-app-custom-self-registration',
  templateUrl: './custom-self-registration.component.html',
  styleUrls: ['./custom-self-registration.component.scss'],
})
export class CustomSelfRegistrationComponent implements OnInit {
  configSvc: any
  onboardingConfig: IOnBoardingConfig | undefined
  selfRegistrationForm!: FormGroup
  customRegistrationLinks: ICustomRegistrationQRCodeResponse | any
  rootOrdId = ''
  framewordId = ''
  todayDate = new Date()
  registeredLinksList: IRegisteredLinksList[] = []
  numberOfUsersOnboarded = 0
  latestRegisteredData: IRegisteredLinksList | any = {}
  designationsList: any[] = []
  isLoading = false
  dialogRef: any
  constructor(
    public dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private snackbar: MatSnackBar,
    private clipboard: Clipboard,
    private onboardingService: OnboardingService,
    private designationsService: DesignationsService,
    private eventService: EventService

  ) { }

  ngOnInit(): void {
    this.configSvc = this.activatedRoute.parent && this.activatedRoute.parent.snapshot.data.configService
    this.onboardingConfig = this.activatedRoute.parent && this.activatedRoute.parent.snapshot.data.pageData.data
    this.rootOrdId = this.configSvc.userProfile.rootOrgId
    this.framewordId = this.configSvc.orgReadData.frameworkid
    this.initializeForm()

    if (this.framewordId && this.configSvc.orgReadData) {
      this.getFrameworkInfo(this.framewordId)
    }
  }

  getlistOfRegisterationLinks() {
    this.onboardingService.getListOfRegisteedLinks({ orgId: this.rootOrdId }).subscribe({
      next: (response: any) => {
        if (response.result && Array.isArray(response.result?.qrCodeDataForOrg) && response.result?.qrCodeDataForOrg.length > 0) {
          this.registeredLinksList = response.result.qrCodeDataForOrg
          this.latestRegisteredData = this.registeredLinksList[this.registeredLinksList.length - 1]
          this.selfRegistrationForm.get('startDate')?.setValue(new Date(this.latestRegisteredData.startDate))
          this.selfRegistrationForm.get('endDate')?.setValue(new Date(this.latestRegisteredData.endDate))
          this.customRegistrationLinks = {
            registrationLink: this.latestRegisteredData.url,
            qrRegistrationLink: this.latestRegisteredData.qrCodeImagePath?.replace('portal', 'mdo'),
            qrRegistrationLogoPath: this.getQRCodePath(this.latestRegisteredData),
          }
          this.numberOfUsersOnboarded = this.latestRegisteredData.numberOfUsersOnboarded
        } else {
          this.customRegistrationLinks = undefined
        }
        this.isLoading = false
      },
      error: () => {

      },
    })
  }

  navigateTo(route: string): void {
    this.router.navigate([route])
  }

  initializeForm(): void {
    this.selfRegistrationForm = this.formBuilder.group({
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
    })
  }

  copyLinkToClipboard(link: string): void {
    this.clipboard.copy(link)
    this.snackbar.open('Copied!', '', { panelClass: ['success'] })
  }

  downloadQRCode(qrLink: string) {
    this.raiseInteractTelementry('download-qr')
    fetch(qrLink)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.blob()
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'QRCode.png'
        anchor.click()
        window.URL.revokeObjectURL(url)
      })
      .catch(() => {
        window.open(qrLink, '_blank')
      })
  }

  sendViaEmail(link: string): void {
    this.raiseInteractTelementry('share-on-mail')
    if (!link) { return }
    const message = `Register for ${this.configSvc.orgReadData.orgName} by clicking the link below:\n\n${link}\n\n\n\n`
    const subject = encodeURIComponent('Self Registration Link')
    const body = encodeURIComponent(message)
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`
    window.open(mailtoLink, '_self')
  }

  sendViaWhatsApp(link: string): void {
    this.raiseInteractTelementry('share-on-whatsapp')
    const message = `Register for ${this.configSvc.orgReadData.orgName} by clicking the link below:\n\n${link}\n\n`

    const encodedLink = encodeURIComponent(message)
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedLink} `
    window.open(whatsappUrl, '_blank')
  }

  generateRegistrationLink(): void {
    const dialogRef = this.dialog.open(LoadingPopupComponent, {
      autoFocus: false,
      width: '365px',
      height: '201px',
      maxWidth: '80vw',
      maxHeight: '90vh',
      disableClose: true,
      data: { type: 'generate-link-loader' }
    })

    const payload = {
      registrationStartDate: (Math.floor(this.selfRegistrationForm.controls['startDate'].value.getTime())),
      registrationEndDate: (Math.floor(this.selfRegistrationForm.controls['endDate'].value.getTime())),
      orgId: this.rootOrdId,
    }
    this.onboardingService.generateSelfRegistrationQRCode(payload).subscribe({
      next: (response: any) => {
        if (response.result && Object.keys(response.result).length > 0 && response.responseCode === 'OK') {
          this.customRegistrationLinks = {
            registrationLink: response.result.registrationLink,
            qrRegistrationLink: response.result?.qrRegistrationLink.replace('portal', 'mdo'),
            qrRegistrationLogoPath: response.result?.qrCodeLogoPath.replace('portal', 'mdo'),
          }
          this.latestRegisteredData.endDate = new Date(this.selfRegistrationForm.controls['endDate'].value)
          this.latestRegisteredData.startDate = new Date(this.selfRegistrationForm.controls['startDate'].value)
          this.latestRegisteredData.status = 'active'
          dialogRef.close()

        } else if (response?.params?.errmsg) {
          this.snackbar.open(response?.params?.errmsg, 'X', { duration: 3000, panelClass: ['error'] })
          dialogRef.close()

        } else {
          this.snackbar.open('Oops! We couldn\'t generate the link or QR code.Please try again', 'X', { duration: 3000, panelClass: ['error'] })
          dialogRef.close()
        }
      },
      error: () => {
        dialogRef.close()
      },
    })
  }

  getQRCodePath(response: any) {
    if (response && response?.qrLogoPath) {
      return response.qrLogoPath.replace('portal', 'mdo')
    }
    else if (response && response?.qrCodeLogoPath) {
      return response.qrCodeLogoPath.replace('portal', 'mdo')
    }
    else if (response && response?.qrCodeImagePath) {
      return response.qrCodeImagePath.replace('portal', 'mdo')
    }
    else if (response && response?.qrRegistrationLink) {
      return response.qrRegistrationLink.replace('portal', 'mdo')
    }
  }

  checkRegistrationStatus(endDateRegistration: string): boolean {
    if (!endDateRegistration) { return false }

    const endDate = new Date(endDateRegistration)
    const today = new Date()
    return today <= endDate
  }

  getFrameworkInfo(frameworkid: string) {
    this.isLoading = true
    this.designationsService.getFrameworkInfo(frameworkid)
      .subscribe({
        next: (frameworkResponse) => {
          const frameworkDetails = _.get(frameworkResponse, 'result.framework')
          const categoriesOfFramework = _.get(frameworkDetails, 'categories', [])
          const organisationsList = this.getTermsByCode(categoriesOfFramework, 'org')
          this.designationsList = _.get(organisationsList, '[0].children', [])
          if (this.designationsList?.length && this.designationsList?.length > 0) {
            this.getlistOfRegisterationLinks()
          } else {
            this.isLoading = false
          }
        }
      })
  }

  private getTermsByCode(categories: any[], code: string) {
    const selectedCategory = categories.filter(
      (category: any) => category.code === code
    )
    return _.get(selectedCategory, '[0].terms', [])
  }

  startImporting() {
    if (this.designationsList?.length && this.designationsList?.length === 0) {
      this.dialogRef = this.dialog.open(LoadingPopupComponent, {
        autoFocus: false,
        width: '504px',
        height: '275px',
        maxWidth: '80vw',
        maxHeight: '90vh',
        data: { type: 'import-igot-master-review' },
        disableClose: true
      })
    } else {
      this.dialogRef = this.dialog.open(LoadingPopupComponent, {
        autoFocus: false,
        width: '504px',
        height: '275px',
        maxWidth: '80vw',
        maxHeight: '90vh',
        data: { type: 'import-igot-master-create' },
        disableClose: true
      })
    }
    this.subscribeToAfterClosedModal()

  }

  subscribeToAfterClosedModal() {
    this.dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.hasOwnProperty('reviewImporting') && result?.reviewImporting) {
        this.onboardingService.setFlagToCheckRoute(true)
        this.navigateTo('/app/home/org-designations')
      }
      else if (result && result.reviewImporting || result?.startImporting) {
        this.onboardingService.setFlagToCheckRoute(true)
        this.navigateTo('/app/home/org-designations')
      }
      else return

    })
  }

  raiseInteractTelementry(subType: string) {
    this.eventService.raiseInteractTelemetry(
      {
        type: 'click',
        subType: subType,
        id: 'share-custom-registration-link',
        pageid: '/app/home/onboarding/self-registration'
      },
      {},
    )
  }

  publishNewLink() {
    this.dialogRef = this.dialog.open(LoadingPopupComponent, {
      autoFocus: false,
      width: '504px',
      height: '275px',
      maxWidth: '80vw',
      maxHeight: '90vh',
      data: { type: 'import-igot-master-review' },
      disableClose: true,
    })

    this.dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.hasOwnProperty('reviewImporting') && result?.reviewImporting) {
        this.onboardingService.setFlagToCheckRoute(true)
        this.navigateTo('/app/home/org-designations')
      }
      else if (result && result.reviewImporting || result?.startImporting) {
        this.onboardingService.setFlagToCheckRoute(true)
        this.navigateTo('/app/home/org-designations')
      }
      else this.generateRegistrationLink()

    })
  }

}
