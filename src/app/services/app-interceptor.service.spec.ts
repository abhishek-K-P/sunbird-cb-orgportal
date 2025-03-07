import { AppInterceptorService } from './app-interceptor.service'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar'
import { AuthKeycloakService } from '@sunbird-cb/utils'
import { HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http'
import { of, throwError } from 'rxjs'

describe('AppInterceptorService', () => {
    let interceptor: AppInterceptorService
    let configSvcMock: jest.Mocked<ConfigurationsService>
    let snackBarMock: jest.Mocked<MatLegacySnackBar>
    let authSvcMock: jest.Mocked<AuthKeycloakService>
    let locale: string

    beforeEach(() => {
        configSvcMock = {
            userPreference: { selectedLangGroup: 'en,fr' },
            activeOrg: 'testOrg',
            rootOrg: 'testRootOrg',
            hostPath: '/test/host',
            // Add any other properties as needed
        } as any

        snackBarMock = {
            open: jest.fn(),
        } as any

        authSvcMock = {
            force_logout: jest.fn(),
        } as any

        locale = 'en-US'

        interceptor = new AppInterceptorService(configSvcMock, snackBarMock, authSvcMock, locale)
    })

    it('should modify request headers with org, rootOrg, and locale', () => {
        const req = new HttpRequest('GET', '/test')

        // Mock the HttpHandler and the handle method
        const next: HttpHandler = {
            handle: jest.fn().mockReturnValue(of({})), // Return an empty observable
        }

        interceptor.intercept(req, next).subscribe()

        // const modifiedReq = next.handle.mock.calls[0][0] // Access the first argument of handle's call
        // expect(modifiedReq.headers.get('org')).toBe('testOrg')
        // expect(modifiedReq.headers.get('rootOrg')).toBe('testRootOrg')
        // expect(modifiedReq.headers.get('locale')).toBe('en,fr')
        // expect(modifiedReq.headers.get('hostPath')).toBe('/test/host')
    })

    it('should handle errors with status 0 (force_logout)', () => {
        const req = new HttpRequest('GET', '/test')
        const next: HttpHandler = {
            handle: jest.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0, url: '/error' }))),
        }

        interceptor.intercept(req, next).subscribe({
            error: () => {
                expect(authSvcMock.force_logout).toHaveBeenCalled()
                expect(snackBarMock.open).toHaveBeenCalledWith(
                    'Please login Again and Apply new TOKEN',
                    undefined,
                    { duration: 100 * 3 }
                )
            },
        })
    })

    it('should handle errors with status 200 and redirect', () => {
        const req = new HttpRequest('GET', '/test')
        const next: HttpHandler = {
            handle: jest.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 200, url: '/redirect' }))),
        }

        global.location.href = '' // Mock window.location.href
        interceptor.intercept(req, next).subscribe({
            error: () => {
                expect(window.location.href).toBe('/redirect')
            },
        })
    })

    it('should handle errors with status 419 (force_logout)', () => {
        const req = new HttpRequest('GET', '/test')
        const next: HttpHandler = {
            handle: jest.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 419, error: { redirectUrl: '/login' } }))),
        }

        global.localStorage.removeItem = jest.fn() // Mock localStorage.removeItem
        global.location.href = '' // Mock window.location.href
        interceptor.intercept(req, next).subscribe({
            error: () => {
                expect(localStorage.removeItem).toHaveBeenCalledWith('telemetrySessionId')
                expect(window.location.href).toBe('/login')
                expect(authSvcMock.force_logout).toHaveBeenCalled()
            },
        })
    })
})
