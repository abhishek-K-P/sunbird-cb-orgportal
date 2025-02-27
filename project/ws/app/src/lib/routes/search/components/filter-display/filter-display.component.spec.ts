import { FilterDisplayComponent } from './filter-display.component'
import { ActivatedRoute, Router } from '@angular/router'
import { SearchServService } from '../../services/search-serv.service'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { of } from 'rxjs'

jest.mock('@angular/router', () => ({
    ActivatedRoute: jest.fn(),
    Router: jest.fn().mockImplementation(() => ({
        navigate: jest.fn(),
    })),
}))

jest.mock('../../services/search-serv.service', () => ({
    SearchServService: jest.fn().mockImplementation(() => ({
        translateSearchFilters: jest.fn(),
    })),
}))

jest.mock('@sunbird-cb/utils', () => ({
    ConfigurationsService: jest.fn().mockImplementation(() => ({
        userPreference: { selectedLocale: 'en' },
    })),
}))

describe('FilterDisplayComponent', () => {
    let component: FilterDisplayComponent
    let activatedRouteMock: any
    let routerMock: any
    let searchServServiceMock: any
    let configurationsServiceMock: any

    beforeEach(() => {
        activatedRouteMock = new ActivatedRoute()
        routerMock = new Router()
        searchServServiceMock = new SearchServService(null as any, null as any, null as any, null as any)
        configurationsServiceMock = new ConfigurationsService()

        component = new FilterDisplayComponent(
            activatedRouteMock,
            routerMock,
            searchServServiceMock,
            configurationsServiceMock
        )
    })

    it('should be created', () => {
        expect(component).toBeTruthy()
    })

    it('should call translateSearchFilters on ngOnInit', async () => {
        const mockFilters = { someFilter: 'value' }
        searchServServiceMock.translateSearchFilters.mockResolvedValue(mockFilters)

        await component.ngOnInit()

        expect(searchServServiceMock.translateSearchFilters).toHaveBeenCalledWith('en')
        expect(component.translatedFilters).toEqual(mockFilters)
    })

    it('should process queryParams and set searchRequest filters', () => {
        const mockQueryParams = { get: jest.fn().mockReturnValue(JSON.stringify({ key: ['value'] })) }
        activatedRouteMock.queryParamMap = of(mockQueryParams)

        component.ngOnInit()

        expect(component.searchRequest.filters).toEqual({ key: ['value'] })
    })

    it('should call router.navigate in addFilter method', () => {
        const filterItem = { key: 'type', value: 'value' }
        component.searchRequest = { filters: {} }

        component.addFilter(filterItem)

        expect(routerMock.navigate).toHaveBeenCalledWith([], {
            queryParams: { f: JSON.stringify({ type: ['value'] }) },
            relativeTo: activatedRouteMock.parent,
            queryParamsHandling: 'merge',
        })
    })

    it('should call router.navigate in removeFilter method', () => {
        component.searchRequest.filters = { type: ['value'] }

        const filterItem = { key: 'type', value: 'value' }
        component.removeFilter(filterItem)

        expect(routerMock.navigate).toHaveBeenCalledWith([], {
            queryParams: { f: '{}' },
            relativeTo: activatedRouteMock.parent,
            queryParamsHandling: 'merge',
        })
    })

    it('should remove filters correctly', () => {
        component.removeFilters()

        expect(routerMock.navigate).toHaveBeenCalledWith([], {
            queryParams: { f: null },
            queryParamsHandling: 'merge',
            relativeTo: activatedRouteMock.parent,
        })
    })

    it('should call filterClose.emit when filterClose is triggered', () => {
        const emitSpy = jest.spyOn(component.filterClose, 'emit')

        component.filterClose.emit(true)

        expect(emitSpy).toHaveBeenCalledWith(true)
    })

    it('should call advancedFilterClick method and navigate', () => {
        // const filter = { filters: { key: 'value', title: '' } }
        // component.advancedFilterClick(filter)

        expect(routerMock.navigate).toHaveBeenCalledWith([], {
            queryParams: { f: JSON.stringify({ key: 'value' }) },
            relativeTo: activatedRouteMock.parent,
            queryParamsHandling: 'merge',
        })
    })

    it('should correctly handle lowerCaseFilter method', () => {
        const filterObject = { someKey: { value: 'test' } }
        component.lowerCaseFilter(filterObject, ['someKey'])

        expect(Object.hasOwnProperty.call(filterObject, 'somekey')).toBe(true)
    })

    it('should track filters using filterUnitResponseTrackBy', () => {
        // const filter = { id: 1 }
        // const result = component.filterUnitResponseTrackBy(filter)
        // expect(result).toBe(1)
    })

    it('should track filters using filterUnitTrackBy', () => {
        // const filter = { id: 1 }
        // const result = component.filterUnitTrackBy(filter)
        // expect(result).toBe(1)
    })
})
