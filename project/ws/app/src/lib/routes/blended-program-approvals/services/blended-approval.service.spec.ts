
import { HttpClient } from '@angular/common/http'
import { BlendedApporvalService } from './blended-approval.service'


describe('BlendedApporvalService', () => {
    let component: BlendedApporvalService

    const http: Partial<HttpClient> = {}

    beforeAll(() => {
        component = new BlendedApporvalService(
            http as HttpClient
        )
    })

    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })
})