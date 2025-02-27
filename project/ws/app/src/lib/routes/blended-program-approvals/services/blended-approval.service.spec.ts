import { BlendedApporvalService } from './blended-approval.service' // Import the service
import { HttpClient } from '@angular/common/http' // Import HttpClient
import { of } from 'rxjs' // Import of for creating observable responses

// Mock the HttpClient
jest.mock('@angular/common/http', () => ({
    HttpClient: jest.fn().mockImplementation(() => ({
        get: jest.fn(),
        post: jest.fn(),
    })),
}))

describe('BlendedApporvalService', () => {
    let service: BlendedApporvalService
    let httpClient: HttpClient

    beforeEach(() => {
        // Create instance of BlendedApporvalService with mocked HttpClient
        httpClient = new HttpClient(null as any) as HttpClient // Type casting the HttpClient to HttpClient
        service = new BlendedApporvalService(httpClient)
    })

    afterEach(() => {
        jest.clearAllMocks() // Clean up mocks after each test
    })

    it('should be created', () => {
        expect(service).toBeTruthy()
    })

    it('should call getBlendedProgramsDetails with correct URL', () => {
        const programID = '123'
        const mockResponse = { data: 'some data' };
        (httpClient.get as jest.Mock).mockReturnValue(of(mockResponse)) // Casting to jest.Mock

        service.getBlendedProgramsDetails(programID).subscribe(response => {
            expect(response).toEqual(mockResponse)
        })

        expect(httpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/action/content/v3/read/123')
    })

    it('should call getLearners with correct URL', () => {
        const batchId = 'batch123'
        const orgName = 'org123'
        const mockResponse = { learners: [] };
        (httpClient.get as jest.Mock).mockReturnValue(of(mockResponse))

        service.getLearners(batchId, orgName).subscribe(response => {
            expect(response).toEqual(mockResponse)
        })

        expect(httpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/cohorts/course/getUsersForBatch/batch123/org123')
    })

    it('should call getLearnersWithoutOrg with correct URL', () => {
        const batchId = 'batch123'
        const mockResponse = { learners: [] };
        (httpClient.get as jest.Mock).mockReturnValue(of(mockResponse))

        service.getLearnersWithoutOrg(batchId).subscribe(response => {
            expect(response).toEqual(mockResponse)
        })

        expect(httpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/cohorts/course/getUsersForBatch/batch123')
    })

    it('should call getRequests with correct URL and data', () => {
        const req = { someData: 'value' }
        const mockResponse = { status: 'success' };
        (httpClient.post as jest.Mock).mockReturnValue(of(mockResponse))

        service.getRequests(req).subscribe(response => {
            expect(response).toEqual(mockResponse)
        })

        expect(httpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/workflow/blendedprogram/search', req)
    })

    it('should call getUserById with correct URL', () => {
        const userId = 'user123'
        const mockResponse = { result: { response: { name: 'John Doe' } } };
        (httpClient.get as jest.Mock).mockReturnValue(of(mockResponse))

        service.getUserById(userId).subscribe(response => {
            expect(response).toEqual(mockResponse.result.response)
        })

        expect(httpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/api/user/v2/read/user123')
    })

    it('should call getUserById without userId and return default response', () => {
        const mockResponse = { result: { response: { name: 'John Doe' } } };
        (httpClient.get as jest.Mock).mockReturnValue(of(mockResponse))

        service.getUserById('').subscribe(response => {
            expect(response).toEqual(mockResponse.result.response)
        })

        expect(httpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/api/user/v2/read/')
    })

    it('should call downloadCert with correct URL', () => {
        const certId = 'cert123'
        const mockResponse = new Blob()
        const mockLink = { click: jest.fn() }

        document.createElement = jest.fn().mockReturnValue(mockLink); // Mock the 'a' element

        (httpClient.get as jest.Mock).mockReturnValue(of(mockResponse))

        service.downloadCert(certId)

        expect(httpClient.get).toHaveBeenCalledWith('/apis/protected/v8/cohorts/course/batch/cert/download/cert123')
        expect(mockLink.click).toHaveBeenCalled()
    })

    it('should call nominateLearners with correct URL and data', () => {
        const req = { learner: 'learner123' }
        const mockResponse = { status: 'success' };
        (httpClient.post as jest.Mock).mockReturnValue(of(mockResponse))

        service.nominateLearners(req).subscribe(response => {
            expect(response).toEqual(mockResponse)
        })

        expect(httpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/workflow/blendedprogram/admin/enrol', req)
    })

    it('should call removeLearner with correct URL and data', () => {
        const req = { learner: 'learner123' }
        const mockResponse = { status: 'removed' };
        (httpClient.post as jest.Mock).mockReturnValue(of(mockResponse))

        service.removeLearner(req).subscribe(response => {
            expect(response).toEqual(mockResponse)
        })

        expect(httpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/workflow/blendedprogram/remove/mdo', req)
    })
})
