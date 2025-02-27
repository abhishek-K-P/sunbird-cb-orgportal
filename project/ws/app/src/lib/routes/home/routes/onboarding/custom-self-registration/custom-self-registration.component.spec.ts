import { CustomSelfRegistrationComponent } from './custom-self-registration.component'
import { OnboardingService } from '../../../services/onboarding.service'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { Router } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
import { FormBuilder, FormGroup } from '@angular/forms'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { Clipboard } from '@angular/cdk/clipboard'
import { of, throwError } from 'rxjs'

// Mock dependencies
jest.mock('@angular/material/legacy-dialog')
jest.mock('@angular/router')
jest.mock('../../../services/onboarding.service')
jest.mock('@angular/cdk/clipboard')
jest.mock('@angular/material/legacy-snack-bar')

describe('CustomSelfRegistrationComponent', () => {
  let component: CustomSelfRegistrationComponent
  let onboardingService: jest.Mocked<OnboardingService>
  let dialog: MatDialog
  let router: Router
  let activatedRoute: ActivatedRoute
  let formBuilder: FormBuilder
  let snackbar: MatSnackBar
  let clipboard: Clipboard

  beforeEach(() => {
    // Mock implementations
    router = { navigate: jest.fn() } as unknown as Router
    activatedRoute = {
      parent: {
        snapshot: {
          data: {
            configService: { userProfile: { rootOrgId: 'rootOrgId' }, orgReadData: { frameworkid: 'frameworkId' } },
            pageData: { data: {} },
          }
        }
      }
    } as unknown as ActivatedRoute
    formBuilder = new FormBuilder()
    snackbar = { open: jest.fn() } as unknown as MatSnackBar
    clipboard = { copy: jest.fn() } as unknown as Clipboard

    // Mocking OnboardingService methods
    onboardingService = {
      getListOfRegisteedLinks: jest.fn(),
      generateSelfRegistrationQRCode: jest.fn(),
    } as unknown as jest.Mocked<OnboardingService>

    dialog = { open: jest.fn() } as unknown as MatDialog

    // Create component instance
    component = new CustomSelfRegistrationComponent(
      dialog,
      activatedRoute,
      router,
      formBuilder,
      snackbar,
      clipboard,
      onboardingService,
      null as any, // designationsService, we can leave it as any for now
      null as any  // eventService, we can leave it as any for now
    )
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should call ngOnInit and initialize the form', () => {
    component.ngOnInit()
    expect(component.rootOrdId).toBe('rootOrgId')
    expect(component.framewordId).toBe('frameworkId')
    expect(component.selfRegistrationForm instanceof FormGroup).toBeTruthy()
  })

  it('should get the list of registration links', () => {
    const mockResponse = {
      result: {
        qrCodeDataForOrg: [{ startDate: '2025-02-27', endDate: '2025-03-27', url: 'test.com' }]
      }
    }

    onboardingService.getListOfRegisteedLinks.mockReturnValue(of(mockResponse))  // Mocking the method with mockReturnValue

    component.getlistOfRegisterationLinks()
    expect(component.registeredLinksList.length).toBe(1)
    expect(component.customRegistrationLinks.registrationLink).toBe('test.com')
  })

  it('should handle error in getlistOfRegisterationLinks gracefully', () => {
    onboardingService.getListOfRegisteedLinks.mockReturnValue(throwError(() => new Error('Error')))

    component.getlistOfRegisterationLinks()
    expect(component.isLoading).toBe(false)
  })

  it('should copy link to clipboard and show snackbar', () => {
    component.copyLinkToClipboard('test.com')
    expect(clipboard.copy).toHaveBeenCalledWith('test.com')
    expect(snackbar.open).toHaveBeenCalledWith('Copied!', '', { panelClass: ['success'] })
  })

  it('should generate registration link and handle response successfully', () => {
    const mockResponse = {
      result: {
        registrationLink: 'generatedLink.com',
        qrRegistrationLink: 'qrGeneratedLink',
        qrCodeLogoPath: 'qrCodeLogoPath'
      },
      responseCode: 'OK'
    }

    onboardingService.generateSelfRegistrationQRCode.mockReturnValue(of(mockResponse))  // Mocking the method with mockReturnValue

    component.generateRegistrationLink()
    expect(component.customRegistrationLinks.registrationLink).toBe('generatedLink.com')
    expect(component.latestRegisteredData.startDate).toBeInstanceOf(Date)
    expect(component.latestRegisteredData.endDate).toBeInstanceOf(Date)
  })

  it('should handle error in generateRegistrationLink', () => {
    // const dialogRef = { close: jest.fn() }
    // dialog.open.mockReturnValue(dialogRef)

    onboardingService.generateSelfRegistrationQRCode.mockReturnValue(throwError(() => new Error('Error')))

    component.generateRegistrationLink()
    //expect(dialogRef.close).toHaveBeenCalled()
  })

  it('should navigate to the correct route', () => {
    component.navigateTo('/some-route')
    expect(router.navigate).toHaveBeenCalledWith(['/some-route'])
  })

  it('should check registration status', () => {
    const status = component.checkRegistrationStatus('2025-03-01')
    expect(status).toBe(true) // Assuming today's date is before 2025-03-01
  })

  it('should handle check registration status with invalid date', () => {
    const status = component.checkRegistrationStatus('')
    expect(status).toBe(false)
  })
})
