import { SearchApiService } from './search-api.service'
import { HttpClient } from '@angular/common/http'
import { of, throwError } from 'rxjs'
import { ISocialSearchRequest, ISocialSearchResult } from '../models/search.model'
import { NSSearch } from '@sunbird-cb/collection'
// import { Mocked } from 'jest-mock'
describe('SearchApiService', () => {
  let service: SearchApiService
  let httpClientMock: jest.Mocked<HttpClient>

  beforeEach(() => {
    // const httpClientMock: Mocked<HttpClient> = {
    //   post: jest.fn(),
    //   get: jest.fn(),
    //   request: jest.fn(),
    //   delete: jest.fn(),
    //   put: jest.fn(),
    //   head: jest.fn(),
    //   jsonp: jest.fn(),
    //   patch: jest.fn(),
    // }

    // service = new SearchApiService(httpClientMock)
  })

  describe('getSearchResults', () => {
    it('should return search results on success', () => {
      const mockRequest: ISocialSearchRequest = { query: 'test' } as ISocialSearchRequest
      const mockResponse: ISocialSearchResult = {
        total: 10, // Correcting the missing field
        result: [], // Correcting the missing field
        filters: [], // Correcting the missing field
      }

      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.getSearchResults(mockRequest).subscribe((response) => {
        expect(response).toEqual(mockResponse)
        expect(httpClientMock.post).toHaveBeenCalledWith(
          '/apis/protected/v8/social/post/search',
          mockRequest
        )
      })
    })

    it('should return an error on failure', () => {
      const mockRequest: ISocialSearchRequest = { query: 'test' } as ISocialSearchRequest
      const mockError = new Error('Network Error')

      httpClientMock.post.mockReturnValue(throwError(mockError))

      service.getSearchResults(mockRequest).subscribe(
        () => {
          // Should not reach here
        },
        (error) => {
          expect(error).toEqual(mockError)
          expect(httpClientMock.post).toHaveBeenCalledWith(
            '/apis/protected/v8/social/post/search',
            mockRequest
          )
        }
      )
    })
  })

  describe('getSearchV6Results', () => {
    it('should return search V6 results on success', () => {
      const mockRequest: NSSearch.ISearchV6Request = { query: 'test' } as NSSearch.ISearchV6Request
      const mockResponse: NSSearch.ISearchV6ApiResult = {
        totalHits: 100,
        result: [],
        filters: [
          {
            type: 'catalogPaths',
            content: [],
            displayName: ''
          }
        ],
        filtersUsed: [],
        notVisibleFilters: []
      }

      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.getSearchV6Results(mockRequest).subscribe((response) => {
        expect(response).toEqual(mockResponse)
        // Ensure content is modified as per the logic in the service
        expect(response.filters[0].content).toEqual([
          { label: 'child1', value: 'child1_value' },
          { label: 'child2', value: 'child2_value' }
        ])
        expect(httpClientMock.post).toHaveBeenCalledWith(
          '/apis/protected/v8/content/searchV6',
          mockRequest
        )
      })
    })

    it('should return an error on failure', () => {
      const mockRequest: NSSearch.ISearchV6Request = { query: 'test' } as NSSearch.ISearchV6Request
      const mockError = new Error('Network Error')

      httpClientMock.post.mockReturnValue(throwError(mockError))

      service.getSearchV6Results(mockRequest).subscribe(
        () => {
          // Should not reach here
        },
        (error) => {
          expect(error).toEqual(mockError)
          expect(httpClientMock.post).toHaveBeenCalledWith(
            '/apis/protected/v8/content/searchV6',
            mockRequest
          )
        }
      )
    })
  })


})
