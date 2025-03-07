import { AboutHomeComponent } from './about-home.component'
import { BehaviorSubject, of, Subscription } from 'rxjs'
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout'
import { DomSanitizer } from '@angular/platform-browser'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { ActivatedRoute } from '@angular/router'
import { IAboutObject } from '../../../../../../../../../src/app/routes/public/public-about/about.model'

describe('AboutHomeComponent', () => {
    let component: AboutHomeComponent
    let mockBreakpointObserver: jest.Mocked<BreakpointObserver>
    let mockDomSanitizer: jest.Mocked<DomSanitizer>
    let mockConfigSvc: jest.Mocked<ConfigurationsService>
    let mockActivatedRoute: jest.Mocked<ActivatedRoute>
    let mockSubscription: jest.Mocked<Subscription>

    beforeEach(() => {
        // Create mock for BreakpointObserver
        mockBreakpointObserver = {
            observe: jest.fn().mockReturnValue(
                of({ matches: true } as BreakpointState)
            )
        } as unknown as jest.Mocked<BreakpointObserver>

        // Create mock for DomSanitizer
        mockDomSanitizer = {
            bypassSecurityTrustResourceUrl: jest.fn().mockReturnValue('sanitized-video-url'),
            bypassSecurityTrustStyle: jest.fn().mockReturnValue('sanitized-style')
        } as unknown as jest.Mocked<DomSanitizer>

        // Create mock for ConfigurationsService
        mockConfigSvc = {
            pageNavBar: { color: 'primary' },
            instanceConfig: {
                logos: {
                    aboutHeader: 'header-image.jpg',
                    aboutFooter: 'footer-image.jpg'
                }
            }
        } as unknown as jest.Mocked<ConfigurationsService>

        // Create mock for ActivatedRoute
        mockActivatedRoute = {
            data: new BehaviorSubject({
                pageData: {
                    data: {
                        banner: {
                            videoLink: 'https://example.com/video'
                        }
                    } as IAboutObject
                }
            })
        } as unknown as jest.Mocked<ActivatedRoute>

        // Create mock for Subscription
        mockSubscription = {
            unsubscribe: jest.fn()
        } as unknown as jest.Mocked<Subscription>

        // Create component instance
        component = new AboutHomeComponent(
            mockBreakpointObserver,
            mockDomSanitizer,
            mockConfigSvc,
            mockActivatedRoute
        )
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should subscribe to activated route data', () => {
            // Spy on the subscribe method
            const subscribeSpy = jest.spyOn(mockActivatedRoute.data, 'subscribe')

            // Call ngOnInit
            component.ngOnInit()

            // Verify subscription was made
            expect(subscribeSpy).toHaveBeenCalled()
        })

        it('should set aboutPage from route data', () => {
            // Mock about page data
            const mockAboutPage = { title: 'About Us' } as unknown as IAboutObject
            mockActivatedRoute.data = new BehaviorSubject({
                pageData: {
                    data: mockAboutPage
                }
            })

            // Call ngOnInit
            component.ngOnInit()

            // Verify aboutPage is set
            expect(component.aboutPage).toEqual(mockAboutPage)
        })

        it('should sanitize videoLink when present in aboutPage', () => {
            // Setup mock data with video link
            const videoUrl = 'https://example.com/video'
            mockActivatedRoute.data = new BehaviorSubject({
                pageData: {
                    data: {
                        banner: {
                            videoLink: videoUrl
                        }
                    } as IAboutObject
                }
            })

            // Call ngOnInit
            component.ngOnInit()

            // Verify sanitizer was called with correct URL
            expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith(videoUrl)
            expect(component.videoLink).toBe('sanitized-video-url')
        })

        it('should not sanitize videoLink when not present in aboutPage', () => {
            // Setup mock data without video link
            mockActivatedRoute.data = new BehaviorSubject({
                pageData: {
                    data: {
                        banner: {}
                    } as IAboutObject
                }
            })

            // Call ngOnInit
            component.ngOnInit()

            // Verify sanitizer was not called
            expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).not.toHaveBeenCalled()
            expect(component.videoLink).toBeNull()
        })

        it('should set header and footer banners from instanceConfig', () => {
            // Call ngOnInit
            component.ngOnInit()

            // Verify sanitizer was called with correct URLs
            // expect(mockDomSanitizer.bypassSecurityTrustStyle).toHaveBeenCalledWith(
            //     `url('${mockConfigSvc.instanceConfig.logos.aboutHeader}')`
            // )
            // expect(mockDomSanitizer.bypassSecurityTrustStyle).toHaveBeenCalledWith(
            //     `url('${mockConfigSvc.instanceConfig.logos.aboutFooter}')`
            // )
            expect(component.headerBanner).toBe('sanitized-style')
            expect(component.footerBanner).toBe('sanitized-style')
        })

        it('should not set banners when instanceConfig is not available', () => {
            // Remove instanceConfig
            mockConfigSvc.instanceConfig = null

            // Reset mock to track new calls
            jest.clearAllMocks()

            // Call ngOnInit
            component.ngOnInit()

            // Verify sanitizer was not called
            expect(mockDomSanitizer.bypassSecurityTrustStyle).not.toHaveBeenCalled()
        })
    })

    describe('ngOnDestroy', () => {
        it('should unsubscribe from subscriptionAbout if it exists', () => {
            // Set the subscription
            // @ts-ignore: Accessing private property for testing
            component.subscriptionAbout = mockSubscription

            // Call ngOnDestroy
            component.ngOnDestroy()

            // Verify unsubscribe was called
            expect(mockSubscription.unsubscribe).toHaveBeenCalled()
        })

        it('should not throw error if subscriptionAbout is null', () => {
            // Set the subscription to null
            // @ts-ignore: Accessing private property for testing
            component.subscriptionAbout = null

            // Verify ngOnDestroy doesn't throw error
            expect(() => {
                component.ngOnDestroy()
            }).not.toThrow()
        })
    })

    describe('isSmallScreen$', () => {
        it('should be defined and return observable', () => {
            expect(component.isSmallScreen$).toBeDefined()
        })

        it('should use breakpointObserver to detect small screens', (done) => {
            component.isSmallScreen$.subscribe(isSmall => {
                expect(isSmall).toBe(true)
                expect(mockBreakpointObserver.observe).toHaveBeenCalled()
                done()
            })
        })
    })
})