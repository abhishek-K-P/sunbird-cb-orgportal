import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { SearchApiService } from './search-api.service'
import { ISocialSearchRequest, ISocialSearchResult, ISearchAutoComplete } from '../models/search.model'
import { NSSearch } from '@sunbird-cb/collection'

describe('SearchApiService', () => {
  let service: SearchApiService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SearchApiService]
    })

    service = TestBed.inject(SearchApiService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getSearchResults', () => {
    it('should make a POST request to social search endpoint with the provided request', () => {
      const mockRequest: ISocialSearchRequest = {
        query: 'test',
        pageNo: 0,
        pageSize: 10,
        org: null,
        rootOrg: null,
        userId: '',
        sessionId: 0,
        postKind: 'Unknown'
      }

      const mockResponse: ISocialSearchResult = {
        result: [],
        total: 0,
        filters: []
      }

      service.getSearchResults(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne('/apis/protected/v8/social/post/search')
      expect(req.request.method).toBe('POST')
      expect(req.request.body).toEqual(mockRequest)
      req.flush(mockResponse)
    })
  })

  describe('getSearchAutoCompleteResults', () => {
    it('should make a GET request to the auto-complete endpoint with the provided params', () => {
      const mockParams = { q: 'test', l: 'en' }
      const mockResponse: ISearchAutoComplete[] = [

      ]

      service.getSearchAutoCompleteResults(mockParams).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(request =>
        request.url === '/apis/protected/v8/content/searchAutoComplete' &&
        request.params.get('q') === 'test' &&
        request.params.get('l') === 'en'
      )
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })
  })

  describe('getSearchV6Results', () => {
    it('should make a POST request to the searchV6 endpoint and transform the response correctly', () => {
      const mockRequest: NSSearch.ISearchV6Request = {
        query: 'test',
        locale: ['en']
      }

      const mockRawResponse: NSSearch.ISearchV6ApiResult = {
        totalHits: 10,
        result: [],
        filters: [
          {
            displayName: 'Catalog',
            type: 'catalogPaths',
            content: [
              {
                id: 'catalog1',
                displayName: 'Catalog 1',
                children: [
                  {
                    id: 'subcatalog1', displayName: 'Sub Catalog 1',
                    count: 0
                  }
                ],
                count: 0
              }
            ]
          }
        ],
        filtersUsed: [],
        notVisibleFilters: []
      }

      const expectedTransformedResponse: NSSearch.ISearchV6ApiResult = {
        totalHits: 10,
        result: [],
        filters: [
          {
            displayName: 'Catalog',
            type: 'catalogPaths',
            content: [
              {
                id: 'subcatalog1', displayName: 'Sub Catalog 1',
                count: 0
              }
            ]
          }
        ],
        filtersUsed: [],
        notVisibleFilters: []
      }

      service.getSearchV6Results(mockRequest).subscribe(response => {
        expect(response).toEqual(expectedTransformedResponse)
      })

      const req = httpMock.expectOne('/apis/protected/v8/content/searchV6')
      expect(req.request.method).toBe('POST')
      expect(req.request.body).toEqual(mockRequest)
      req.flush(mockRawResponse)
    })

    it('should handle catalog filter transformation correctly when there are multiple catalogs', () => {
      const mockRequest: NSSearch.ISearchV6Request = {
        query: 'test',
        locale: ['en']
      }

      const mockResponse: NSSearch.ISearchV6ApiResult = {
        totalHits: 10,
        result: [],
        filters: [
          {
            displayName: 'Catalog',
            type: 'catalogPaths',
            content: [
              {
                id: 'catalog1', displayName: 'Catalog 1',
                count: 0
              },
              {
                id: 'catalog2', displayName: 'Catalog 2',
                count: 0
              }
            ]
          }
        ],
        filtersUsed: [],
        notVisibleFilters: []
      }

      // For multiple catalogs, the content should remain unchanged
      service.getSearchV6Results(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne('/apis/protected/v8/content/searchV6')
      expect(req.request.method).toBe('POST')
      req.flush(mockResponse)
    })

    it('should handle catalog filter transformation when children is undefined', () => {
      const mockRequest: NSSearch.ISearchV6Request = {
        query: 'test',
        locale: ['en']
      }

      const mockResponse: NSSearch.ISearchV6ApiResult = {
        totalHits: 10,
        result: [],
        filters: [
          {
            displayName: 'Catalog',
            type: 'catalogPaths',
            content: [
              {
                id: 'catalog1', displayName: 'Catalog 1',
                count: 0
              }
            ]
          }
        ],
        filtersUsed: [],
        notVisibleFilters: []
      }

      // When there's only one catalog but no children property, the content should become an empty array
      const expectedResponse: NSSearch.ISearchV6ApiResult = {
        totalHits: 10,
        result: [],
        filters: [
          {
            displayName: 'Catalog',
            type: 'catalogPaths',
            content: []
          }
        ],
        filtersUsed: [],
        notVisibleFilters: []
      }

      service.getSearchV6Results(mockRequest).subscribe(response => {
        expect(response).toEqual(expectedResponse)
      })

      const req = httpMock.expectOne('/apis/protected/v8/content/searchV6')
      expect(req.request.method).toBe('POST')
      req.flush(mockResponse)
    })
  })
})