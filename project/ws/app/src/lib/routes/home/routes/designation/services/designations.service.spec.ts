import { DesignationsService } from './designations.service'
import { HttpClient } from '@angular/common/http'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { of } from 'rxjs'

// Mock the HttpClient and ConfigurationsService
jest.mock('@angular/common/http')
jest.mock('@sunbird-cb/utils')

describe('DesignationsService', () => {
  let service: DesignationsService
  let mockHttpClient: HttpClient
  let mockConfigService: ConfigurationsService

  beforeEach(() => {
    mockHttpClient = new HttpClient(null as any) // Mock HttpClient
    mockConfigService = new ConfigurationsService() // Mock ConfigurationsService
    service = new DesignationsService(mockHttpClient, mockConfigService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('setUserProfile', () => {
    it('should set user profile', () => {
      const profile = { userId: '123' }
      service.setUserProfile(profile)
      expect(service.userProfileDetails).toEqual(profile)
    })
  })

  describe('createFrameWork', () => {
    it('should call createFrameWork API and return response', (done) => {
      const mockResponse = { result: 'success' }
      const frameworkName = 'framework1'
      const orgId = 'org1'
      const termName = 'term1'

      // Mocking HttpClient's get method
      mockHttpClient.get = jest.fn().mockReturnValue(of(mockResponse))

      service.createFrameWork(frameworkName, orgId, termName).subscribe(response => {
        expect(response).toEqual(mockResponse)
        expect(mockHttpClient.get).toHaveBeenCalledWith(
          `/apis/proxies/v8/org/framework/read?frameworkName=${frameworkName}&orgId=${orgId}&termName=${encodeURIComponent(termName)}`
        )
        done()
      })
    })
  })

  describe('getIgotMasterDesignations', () => {
    it('should format and return designations list', (done) => {
      const request = {}
      const mockResponse = {
        result: {
          result: {
            data: [{ id: '1', name: 'Designation1' }],
            facets: [],
            totalCount: 1,
          },
        },
      }

      const formattedResponse = {
        formatedDesignationsLsit: [{ id: '1', name: 'Designation1', selected: false, isOrgDesignation: false }],
        facets: [],
        totalCount: 1,
      }

      // Mocking HttpClient's post method
      mockHttpClient.post = jest.fn().mockReturnValue(of(mockResponse))

      service.getIgotMasterDesignations(request).subscribe(response => {
        expect(response).toEqual(formattedResponse)
        done()
      })
    })
  })

  describe('getUuid', () => {
    it('should return a UUID', () => {
      // Mocking uuidv4 function
      // jest.spyOn(uuidv4, 'v4').mockReturnValue('mock-uuid')
      const uuid = service.getUuid
      expect(uuid).toBe('mock-uuid')
    })
  })

  describe('copyFramework', () => {
    it('should call copyFramework API and return formatted response', (done) => {
      const request = {}
      const mockResponse = { result: { response: 'success' } }

      // Mocking HttpClient's post method
      mockHttpClient.post = jest.fn().mockReturnValue(of(mockResponse))

      service.copyFramework(request).subscribe(response => {
        expect(response).toEqual('success')
        done()
      })
    })
  })

  describe('getOrgReadData', () => {
    it('should call getOrgReadData API and return response', (done) => {
      const organisationId = 'org1'
      const mockResponse = { result: { response: 'success' } }

      // Mocking HttpClient's post method
      mockHttpClient.post = jest.fn().mockReturnValue(of(mockResponse))

      service.getOrgReadData(organisationId).subscribe(response => {
        expect(response).toEqual('success')
        done()
      })
    })
  })

  // More tests for other methods can be added in a similar way
})
