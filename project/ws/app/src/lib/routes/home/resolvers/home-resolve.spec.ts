
import { ProfileV2Service } from '../services/home.servive'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { of, throwError } from 'rxjs'
import { IResolveResponse } from '@sunbird-cb/utils'
import { NSProfileDataV2 } from '../models/profile-v2.model'
import { HomeResolve } from './home-resolve'

describe('HomeResolve', () => {
  let homeResolve: HomeResolve
  let profileV2SvcMock: jest.Mocked<ProfileV2Service>
  let configSvcMock: jest.Mocked<ConfigurationsService>

  beforeEach(() => {
    // Create mock instances of ProfileV2Service and ConfigurationsService
    profileV2SvcMock = {
      fetchProfile: jest.fn(),
    } as any

    configSvcMock = {
      userProfile: {
        userId: 'mockUserId'
      }
    } as any

    homeResolve = new HomeResolve(profileV2SvcMock, configSvcMock)
  })

  it('should resolve profile data when userId is valid', (done) => {
    // Arrange
    const mockUserProfile: any = {
      id: '',
      userId: '',
      interests: undefined,
      photo: undefined,
      osCreatedAt: '',
      osCreatedBy: '',
      osUpdatedAt: '',
      osUpdatedBy: '',
      osid: '',
      personalDetails: undefined,
      professionalDetails: [],
      skills: undefined
    }
    const mockResponse: IResolveResponse<NSProfileDataV2.IProfile> = { data: mockUserProfile, error: null }

    profileV2SvcMock.fetchProfile.mockReturnValue(of(mockUserProfile))

    const routeMock = {
      routeConfig: { path: 'somePath' },
      params: { userId: 'mockUserId' },
      queryParams: {},
    } as any

    const stateMock = {} as any

    // Act
    homeResolve.resolve(routeMock, stateMock).subscribe(response => {
      // Assert
      expect(response).toEqual(mockResponse)
      expect(profileV2SvcMock.fetchProfile).toHaveBeenCalledWith('mockUserId')
      done()
    })
  })

  it('should return error response when fetchProfile fails', (done) => {
    // Arrange
    const mockError = new Error('Some error')
    const mockErrorResponse: IResolveResponse<NSProfileDataV2.IProfile> = { data: null, error: mockError }

    profileV2SvcMock.fetchProfile.mockReturnValue(throwError(mockError))

    const routeMock = {
      routeConfig: { path: 'somePath' },
      params: { userId: 'mockUserId' },
      queryParams: {},
    } as any

    const stateMock = {} as any

    // Act
    homeResolve.resolve(routeMock, stateMock).subscribe(response => {
      // Assert
      expect(response).toEqual(mockErrorResponse)
      expect(profileV2SvcMock.fetchProfile).toHaveBeenCalledWith('mockUserId')
      done()
    })
  })

  it('should resolve profile data when route path is "me"', (done) => {
    // Arrange
    const mockUserProfile: any = {
      id: '',
      userId: '',
      interests: undefined,
      photo: undefined,
      osCreatedAt: '',
      osCreatedBy: '',
      osUpdatedAt: '',
      osUpdatedBy: '',
      osid: '',
      personalDetails: undefined,
      professionalDetails: [],
      skills: undefined
    }
    const mockResponse: IResolveResponse<NSProfileDataV2.IProfile> = { data: mockUserProfile, error: null }

    profileV2SvcMock.fetchProfile.mockReturnValue(of(mockUserProfile))

    const routeMock = {
      routeConfig: { path: 'me' },
      params: {},
      queryParams: {},
    } as any

    const stateMock = {} as any

    // Act
    homeResolve.resolve(routeMock, stateMock).subscribe(response => {
      // Assert
      expect(response).toEqual(mockResponse)
      expect(profileV2SvcMock.fetchProfile).toHaveBeenCalledWith('mockUserId')
      done()
    })
  })

  it('should resolve profile data when userId is from queryParams', (done) => {
    // Arrange
    const mockUserProfile: any = { /* mock your profile data here */ }
    const mockResponse: IResolveResponse<NSProfileDataV2.IProfile> = { data: mockUserProfile, error: null }

    profileV2SvcMock.fetchProfile.mockReturnValue(of(mockUserProfile))

    const routeMock = {
      routeConfig: { path: 'somePath' },
      params: {},
      queryParams: { userId: 'queryUserId' },
    } as any

    const stateMock = {} as any

    // Act
    homeResolve.resolve(routeMock, stateMock).subscribe(response => {
      // Assert
      expect(response).toEqual(mockResponse)
      expect(profileV2SvcMock.fetchProfile).toHaveBeenCalledWith('queryUserId')
      done()
    })
  })

  it('should use configSvc userId if userId is not available in route params or queryParams', (done) => {
    // Arrange
    const mockUserProfile: any = { /* mock your profile data here */ }
    const mockResponse: IResolveResponse<NSProfileDataV2.IProfile> = { data: mockUserProfile, error: null }

    profileV2SvcMock.fetchProfile.mockReturnValue(of(mockUserProfile))

    const routeMock = {
      routeConfig: { path: 'somePath' },
      params: {},
      queryParams: {},
    } as any

    const stateMock = {} as any

    // Act
    homeResolve.resolve(routeMock, stateMock).subscribe(response => {
      // Assert
      expect(response).toEqual(mockResponse)
      expect(profileV2SvcMock.fetchProfile).toHaveBeenCalledWith('mockUserId')
      done()
    })
  })
})
