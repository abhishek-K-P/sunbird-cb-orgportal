import { ProfileViewComponent } from './profile-view.component'
import { BlendedApporvalService } from '../../services/blended-approval.service'
import { WidgetUserService } from '@sunbird-cb/collection'
import { MatLegacyDialog } from '@angular/material/legacy-dialog'
import { Router, ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import moment from 'moment'
import { ProfileCertificateDialogComponent } from '../profile-certificate-dialog/profile-certificate-dialog.component'

// Jest mocks
jest.mock('@angular/material/legacy-dialog')
jest.mock('../../services/blended-approval.service')
jest.mock('@sunbird-cb/collection')
jest.mock('@angular/router')

describe('ProfileViewComponent', () => {
    let component: ProfileViewComponent
    let bpServiceMock: jest.Mocked<BlendedApporvalService>
    let userSvcMock: jest.Mocked<WidgetUserService>
    let dialogMock: jest.Mocked<MatLegacyDialog>
    let routerMock: jest.Mocked<Router>
    let routeMock: jest.Mocked<ActivatedRoute>

    beforeEach(() => {
        // Manually mock the services
        bpServiceMock = {
            getUserById: jest.fn(),
            downloadCert: jest.fn(),
        } as unknown as jest.Mocked<BlendedApporvalService>

        userSvcMock = {
            fetchUserBatchList: jest.fn(),
        } as unknown as jest.Mocked<WidgetUserService>

        dialogMock = {
            open: jest.fn(),
        } as unknown as jest.Mocked<MatLegacyDialog>

        routerMock = {
            getCurrentNavigation: jest.fn(),
        } as unknown as jest.Mocked<Router>

        routeMock = {
            snapshot: {
                params: { userId: '123' },
                data: {
                    pageData: {
                        data: { tabs: [] },
                    },
                },
            } as any,
        } as jest.Mocked<ActivatedRoute>

        // Instantiate the component
        component = new ProfileViewComponent(
            dialogMock,
            routeMock,
            bpServiceMock,
            routerMock,
            userSvcMock,
        )
    })

    it('should create the ProfileViewComponent', () => {
        expect(component).toBeTruthy()
    })

    it('should fetch user data on init', () => {
        const userProfile = {
            profileDetails: {
                professionalDetails: [{ designation: 'Developer' }],
                academics: ['Math', 'Science'],
                interests: ['Reading'],
                verifiedKarmayogi: true,
            },
            firstName: 'John',
            email: 'john.doe@example.com',
            userId: '123',
            userName: 'john_doe',
        }

        // Mock the service responses to return observables
        bpServiceMock.getUserById.mockReturnValue(of(userProfile))
        userSvcMock.fetchUserBatchList.mockReturnValue(of([]))

        // Call ngOnInit method (which will call the mocked services)
        component.ngOnInit()

        // Assertions after service calls
        expect(component.portalProfile).toEqual(userProfile)
        expect(component.verifiedBadge).toBe(true)
        expect(component.academics).toEqual(userProfile.profileDetails.academics)
        expect(component.hobbies).toEqual(userProfile.profileDetails.interests)
    })

    it('should download all certificates correctly', () => {
        const mockCert = { identifier: 'cert123', issuedCertificates: [{ identifier: 'cert123' }] }
        const mockResponse = { result: { printUri: 'url_to_certificate' } }

        // Mock the services to return observables
        bpServiceMock.downloadCert.mockReturnValue(of(mockResponse))

        // Mock data for certification
        const mockData = [{ issuedCertificates: [mockCert] }]

        component.downloadAllCertificate(mockData)

        // Assert that downloadCert was called correctly
        expect(bpServiceMock.downloadCert).toHaveBeenCalledWith('cert123')
        expect(component.allCertificate).toEqual([
            {
                identifier: 'cert123',
                dataUrl: 'url_to_certificate',
                content: undefined,
                issuedCertificates: mockCert.issuedCertificates[0],
            },
        ])
    })

    it('should format date correctly in paDate method', () => {
        const date = '05-03-2025'
        const formattedDate = component.paDate(date)
        const expectedFormattedDate = moment(date, 'DD-MM-YYYY').toDate().toDateString()

        expect(formattedDate).toEqual(expectedFormattedDate)
    })

    it('should handle scroll and set sticky state', () => {
        component.elementPosition = 100

        // Simulate window scroll event
        global.innerHeight = 500
        global.scrollY = 150

        component.handleScroll()

        expect(component.sticky).toBe(true)

        // Simulate window scroll event where scrollY < elementPosition
        global.scrollY = 50

        component.handleScroll()

        expect(component.sticky).toBe(false)
    })

    it('should open certificate dialog if issuedCertificates match identifier', () => {
        const mockItem = {
            issuedCertificates: [{ identifier: 'cert123' }],
            dataUrl: 'certificate_url',
        }

        component.openCertificateDialog(mockItem)

        expect(dialogMock.open).toHaveBeenCalledWith(ProfileCertificateDialogComponent, {
            autoFocus: false,
            data: { cet: 'certificate_url', value: mockItem },
        })
    })

    it('should not open certificate dialog if issuedCertificates do not match identifier', () => {
        const mockItem = {
            issuedCertificates: [{ identifier: 'cert456' }],
            dataUrl: 'certificate_url',
        }

        component.openCertificateDialog(mockItem)

        expect(dialogMock.open).not.toHaveBeenCalled()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })
})
