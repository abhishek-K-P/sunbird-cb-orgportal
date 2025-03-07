import { ConfigResolveService } from './config-resolve.service'
import { of } from 'rxjs'

// Create a mock class for ConfigurationsService
class MockConfigurationsService {
  // Add the methods you want to mock or return any necessary data
  // For example, you could mock a property or method on this service
  someMethod = jest.fn().mockReturnValue('someValue'); // Mock a method (if necessary)
}

describe('ConfigResolveService', () => {
  let service: ConfigResolveService
  let mockConfService: MockConfigurationsService

  beforeEach(() => {
    mockConfService = new MockConfigurationsService()
    service = new ConfigResolveService(mockConfService as any)  // Pass the mocked service to the constructor
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should resolve config', (done) => {
    // Mock the return value of the resolve method to be an Observable
    const expectedConfig = { ...mockConfService }
    jest.spyOn(mockConfService, 'someMethod').mockReturnValue(of(expectedConfig))

    service.resolve().subscribe((config) => {
      expect(config).toEqual(expectedConfig)
      done()
    })
  })
})
