import { MyDashboardHomeComponent } from './my-dashboard-home.component'
import { of, Observable } from 'rxjs'
import { dashboardEmptyData } from '../../../../../../../../../src/mdo-assets/data/data'

describe('MyDashboardHomeComponent', () => {
    let component: MyDashboardHomeComponent
    let routerMock: any
    let configSvcMock: any
    let httpMock: any
    let mdoServiceMock: any

    const mockUserData = {
        userId: 'test-user-id',
        rootOrgId: 'test-org-id',
        roles: ['MDO_LEADER'],
        firstName: 'Test User'
    }

    const mockLookerResponse = {
        signedUrl: 'https://test-looker-url.com/dashboard'
    }

    beforeEach(() => {
        // Create mocks for all dependencies
        routerMock = {
            navigate: jest.fn(),
            url: '/app/my-dashboard'
        }

        configSvcMock = {
            pageNavBar: { color: 'test' }
        }

        httpMock = {
            get: jest.fn().mockImplementation(() => {
                return of({
                    result: {
                        response: mockUserData
                    }
                }).pipe((data: Observable<any>) => data)
            })
        }

        mdoServiceMock = {
            getDashboardData: jest.fn().mockReturnValue(of(mockLookerResponse))
        }

        // Instantiate component with mocked dependencies
        component = new MyDashboardHomeComponent(
            routerMock,
            configSvcMock,
            httpMock,
            mdoServiceMock
        )

        // Mock the iframe element
        component.lookerIframe = {
            nativeElement: {
                src: ''
            }
        } as any
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should set pageNavbar from configSvc', () => {
        expect(component.pageNavbar).toBe(configSvcMock.pageNavBar)
    })

    describe('getDashboardId', () => {
        it('should set selectedDashboardId when value is provided', () => {
            component.getDashboardId('test-dashboard')
            expect(component.selectedDashboardId).toBe('test-dashboard')
        })

        it('should set currentDashboard to dashboardEmpty when value is null', () => {
            component.getDashboardId(null as any)
            expect(component.currentDashboard).toEqual([dashboardEmptyData])
        })
    })

    describe('backToHome', () => {
        it('should navigate to home page', () => {
            component.backToHome()
            expect(routerMock.navigate).toHaveBeenCalledWith(['page', 'home'])
        })
    })

    describe('getUserProfileDetail', () => {
        it('should fetch user profile and show dashboard', async () => {
            const getUserProfileDetailSpy = jest.spyOn(component, 'showDashboard').mockImplementation()

            await component.getUserProfileDetail()

            expect(httpMock.get).toHaveBeenCalledWith('/apis/proxies/v8/api/user/v2/read')
            expect(component.userData).toEqual(mockUserData)
            expect(component.showLookerProDashboard).toBe(true)
            expect(getUserProfileDetailSpy).toHaveBeenCalled()
        })
    })

    describe('getUserProfileTempDetail', () => {
        it('should fetch user profile and show temp dashboard', async () => {
            const showTempDashboardSpy = jest.spyOn(component, 'showTempDashboard').mockImplementation()

            await component.getUserProfileTempDetail()

            expect(httpMock.get).toHaveBeenCalledWith('/apis/proxies/v8/api/user/v2/read')
            expect(component.userData).toEqual(mockUserData)
            expect(showTempDashboardSpy).toHaveBeenCalled()
        })
    })

    describe('showDashboard', () => {
        it('should get looker dashboard data and update iframe URL', () => {
            // Spy on reloadIframeWithNewUser
            const reloadIframeSpy = jest.spyOn(component, 'reloadIframeWithNewUser').mockImplementation()

            // Setup component with user data
            component.userData = mockUserData

            // Call the method
            component.showDashboard()

            // Verify appropriate service was called with correct payload
            const expectedPayload = {
                request: {
                    embedUrl: '/embed/dashboards/7',
                    userAttributes: {
                        roles: mockUserData.roles,
                        orgId: mockUserData.rootOrgId,
                        userId: mockUserData.userId,
                        firstName: mockUserData.firstName
                    }
                }
            }

            expect(mdoServiceMock.getDashboardData).toHaveBeenCalledWith(
                'apis/proxies/v8/looker/dashboard',
                expectedPayload
            )

            // Verify the response handling
            expect(component.lookerDashboardDetail).toBe(mockLookerResponse.signedUrl)
            expect(reloadIframeSpy).toHaveBeenCalled()
        })
    })

    describe('showTempDashboard', () => {
        it('should get looker dashboard data with standard userId', () => {
            // Spy on reloadIframeWithNewUser
            const reloadIframeSpy = jest.spyOn(component, 'reloadIframeWithNewUser').mockImplementation()

            // Setup component with user data
            component.userData = mockUserData

            // Call the method
            component.showTempDashboard()

            // Verify appropriate service was called with correct payload
            const expectedPayload = {
                request: {
                    embedUrl: '/embed/dashboards/7',
                    sessionLengthInSec: 900,
                    userAttributes: {
                        roles: mockUserData.roles,
                        orgId: mockUserData.rootOrgId,
                        userId: mockUserData.userId
                    }
                }
            }

            expect(mdoServiceMock.getDashboardData).toHaveBeenCalledWith(
                'apis/proxies/v8/looker/dashboard',
                expectedPayload
            )

            // Verify the response handling
            expect(component.lookerDashboardDetail).toBe(mockLookerResponse.signedUrl)
            expect(reloadIframeSpy).toHaveBeenCalled()
        })

        it('should use special userId for specific rootOrgId (01359132123730739281)', () => {
            // Spy on reloadIframeWithNewUser
            //   const reloadIframeSpy = jest.spyOn(component, 'reloadIframeWithNewUser').mockImplementation()

            // Setup component with specific rootOrgId that requires special user ID
            component.userData = {
                ...mockUserData,
                rootOrgId: '01359132123730739281'
            }

            // Call the method
            component.showTempDashboard()

            // Check if the special userId was used
            const payload = mdoServiceMock.getDashboardData.mock.calls[0][1]
            expect(payload.request.userAttributes.userId).toBe('c32ced54-14bc-4750-bed0-b335e4d0bc0e')
        })

        it('should use special userId for specific rootOrgId (01376822290813747263)', () => {
            // Spy on reloadIframeWithNewUser
            // const reloadIframeSpy = jest.spyOn(component, 'reloadIframeWithNewUser').mockImplementation()

            // Setup component with specific rootOrgId that requires special user ID
            component.userData = {
                ...mockUserData,
                rootOrgId: '01376822290813747263'
            }

            // Call the method
            component.showTempDashboard()

            // Check if the special userId was used
            const payload = mdoServiceMock.getDashboardData.mock.calls[0][1]
            expect(payload.request.userAttributes.userId).toBe('91d6d08a-8c23-4cc4-9e59-652fd292d426')
        })
    })

    describe('reloadIframeWithNewUser', () => {
        it('should update iframe src with lookerDashboardDetail', () => {
            // Setup
            component.lookerDashboardDetail = 'https://new-dashboard-url.com'

            // Call method
            component.reloadIframeWithNewUser()

            // Verify iframe src was updated
            expect(component.lookerIframe.nativeElement.src).toBe('https://new-dashboard-url.com')
        })

        it('should not throw error if lookerIframe is not defined', () => {
            // Setup - set lookerIframe to undefined
            component.lookerIframe = undefined as any
            component.lookerDashboardDetail = 'https://test-url.com'

            // Expect no error when called
            expect(() => {
                component.reloadIframeWithNewUser()
            }).not.toThrow()
        })
    })

    describe('ngOnInit', () => {
        it('should call getUserProfileDetail', () => {
            // Spy on getUserProfileDetail
            const getUserProfileDetailSpy = jest.spyOn(component, 'getUserProfileDetail').mockImplementation()

            // Call ngOnInit
            component.ngOnInit()

            // Verify getUserProfileDetail was called
            expect(getUserProfileDetailSpy).toHaveBeenCalled()
        })
    })
})