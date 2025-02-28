import { SearchApiService } from './search-api.service'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'

describe('SearchApiService', () => {
  let service: SearchApiService
  let httpClientMock: { post: jest.Mock, get: jest.Mock }

  beforeEach(() => {
    // Mock the HttpClient
    httpClientMock = {
      post: jest.fn(),
      get: jest.fn()
    }
    service = new SearchApiService(httpClientMock as unknown as HttpClient) // Inject mocked HttpClient
  })

  describe('getSearchResults', () => {
    it('should make a POST request to fetch search results', () => {
      const mockRequest = { query: 'test' }
      const mockResponse = { results: [] }
      httpClientMock.post.mockReturnValue(of(mockResponse)) // Mocking HTTP response

      service.getSearchResults(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse) // Verify the response
        expect(httpClientMock.post).toHaveBeenCalledWith(
          '/apis/protected/v8/social/post/search',
          mockRequest
        ) // Verify the API endpoint and payload
      })
    })
  })

  describe('getSearchAutoCompleteResults', () => {
    it('should make a GET request to fetch autocomplete results', () => {
      const mockParams = { q: 'test', l: 'en' }
      const mockResponse = [{ name: 'result1' }, { name: 'result2' }]
      httpClientMock.get.mockReturnValue(of(mockResponse)) // Mocking HTTP response

      service.getSearchAutoCompleteResults(mockParams).subscribe(response => {
        expect(response).toEqual(mockResponse) // Verify the response
        expect(httpClientMock.get).toHaveBeenCalledWith(
          '/apis/proxies/v8/sunbirdigot/read',
          { params: mockParams }
        ) // Verify the API endpoint and query parameters
      })
    })
  })

  describe('getSearchV6Results', () => {
    it('should transform the response correctly and make a POST request', () => {
      const mockRequest = { query: 'test' }
      const mockResponse = {
        result: {
          facets: [
            {
              name: 'category',
              values: [
                { name: 'Cat1', count: 10 },
                { name: 'Cat2', count: 5 }
              ]
            }
          ]
        }
      }

      const expectedTransformedResponse = {
        result: {
          facets: [
            {
              name: 'category',
              values: [
                { name: 'Cat1', count: 10 },
                { name: 'Cat2', count: 5 }
              ]
            }
          ],
          filters: [
            {
              displayName: 'category',
              type: 'category',
              content: [
                { displayName: 'Cat1', type: 'Cat1', count: 10, id: '' },
                { displayName: 'Cat2', type: 'Cat2', count: 5, id: '' }
              ]
            }
          ]
        }
      }

      httpClientMock.post.mockReturnValue(of(mockResponse)) // Mocking HTTP response

      service.getSearchV6Results(mockRequest).subscribe(response => {
        expect(response).toEqual(expectedTransformedResponse) // Verify the transformed response
        expect(httpClientMock.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/sunbirdigot/search',
          mockRequest
        ) // Verify the API endpoint and payload
      })
    })
  })

  describe('getSearch', () => {
    it('should make a POST request with default data and query', () => {
      const mockRequest = { request: { query: 'test query' } }
      const mockResponse = { data: 'mock data' }
      httpClientMock.post.mockReturnValue(of(mockResponse)) // Mocking HTTP response

      service.getSearch(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse) // Verify the response
        expect(httpClientMock.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/sunbirdigot/read',
          expect.objectContaining({
            request: expect.objectContaining({
              query: 'test query'
            })
          }) // Verify the structure of the data being sent
        )
      })
    })
  })
})
