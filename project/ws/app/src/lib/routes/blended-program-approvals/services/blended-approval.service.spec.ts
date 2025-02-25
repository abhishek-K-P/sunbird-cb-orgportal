import { BlendedApporvalService } from './blended-approval.service'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'

// Create a mock implementation for HttpClient
jest.mock('@angular/common/http', () => ({
    HttpClient: jest.fn().mockImplementation(() => ({
        get: jest.fn(),
        post: jest.fn(),
    }))
}))

describe('BlendedApporvalService', () => {
    let service: BlendedApporvalService
    let httpClientMock: jest.Mocked<HttpClient> // Type the mock as a Jest mocked HttpClient

    beforeEach(() => {
        // Create a mock instance of the HttpClient
        httpClientMock = new HttpClient(null as any) as jest.Mocked<HttpClient>
        service = new BlendedApporvalService(httpClientMock)
    })

    it('should be created', () => {
        expect(service).toBeTruthy()
    })

    describe('getBlendedProgramsDetails', () => {
        it('should call get with correct URL and return data', () => {
            const programID = '123'
            const mockResponse = { data: 'program details' }
            const expectedUrl = `/apis/proxies/v8/action/content/v3/read/${programID}`

            // Mock the HttpClient get method
            httpClientMock.get.mockReturnValue(of(mockResponse))  // mockReturnValue is now available

            service.getBlendedProgramsDetails(programID).subscribe(response => {
                expect(response).toEqual(mockResponse)
            })
            expect(httpClientMock.get).toHaveBeenCalledWith(expectedUrl)
        })
    })

    describe('getLearners', () => {
        it('should call get with correct URL and return data', () => {
            const batchId = 'batch123'
            const orgName = 'org1'
            const mockResponse = { learners: ['learner1', 'learner2'] }
            const expectedUrl = `/apis/proxies/v8/cohorts/course/getUsersForBatch/${batchId}/${orgName}`

            httpClientMock.get.mockReturnValue(of(mockResponse))

            service.getLearners(batchId, orgName).subscribe(response => {
                expect(response).toEqual(mockResponse)
            })
            expect(httpClientMock.get).toHaveBeenCalledWith(expectedUrl)
        })
    })

    describe('getUserById', () => {
        it('should call get with correct URL and return data for a valid userId', () => {
            const userId = 'user123'
            const mockResponse = { result: { response: { name: 'John Doe' } } }
            const expectedUrl = `/apis/proxies/v8/api/user/v2/read/${userId}`

            httpClientMock.get.mockReturnValue(of(mockResponse))

            service.getUserById(userId).subscribe(response => {
                expect(response).toEqual(mockResponse.result.response)
            })
            expect(httpClientMock.get).toHaveBeenCalledWith(expectedUrl)
        })

        it('should call get with default URL when no userId is provided', () => {
            const mockResponse = { result: { response: { name: 'John Doe' } } }
            const expectedUrl = '/apis/proxies/v8/api/user/v2/read/'

            httpClientMock.get.mockReturnValue(of(mockResponse))

            service.getUserById('').subscribe(response => {
                expect(response).toEqual(mockResponse.result.response)
            })
            expect(httpClientMock.get).toHaveBeenCalledWith(expectedUrl)
        })
    })

    describe('downloadCert', () => {
        it('should call get with correct URL to download certificate', () => {
            const certId = 'cert123'
            const expectedUrl = `/apis/protected/v8/cohorts/course/batch/cert/download/${certId}`
            const mockResponse = new Blob()

            // Mocking the get request for certificate download
            httpClientMock.get.mockReturnValue(of(mockResponse))

            service.downloadCert(certId)

            expect(httpClientMock.get).toHaveBeenCalledWith(expectedUrl)
        })
    })

    describe('fetchBlendedUserCount', () => {
        it('should call post with correct URL and return data', async () => {
            const req = { batch: 'batch123' }
            const mockResponse = { userCount: 10 }

            httpClientMock.post.mockReturnValue(of(mockResponse))

            const result = await service.fetchBlendedUserCount(req)

            expect(result).toEqual(mockResponse)
            expect(httpClientMock.post).toHaveBeenCalledWith('/apis/v8/workflow/blendedprogram/enrol/status/count', req)
        })
    })
})
