import { DynamicAssetsLoaderService } from './dynamic-assets-loader.service'
import { of } from 'rxjs'

// Mocks
const mockCreateElement = jest.fn()
const mockAppendChild = jest.fn()
const mockFromEvent = jest.fn()

jest.mock('rxjs', () => ({
  fromEvent: jest.fn()
}))

describe('DynamicAssetsLoaderService', () => {
  let service: DynamicAssetsLoaderService

  beforeEach(() => {
    service = new DynamicAssetsLoaderService()
    // Resetting mock functions before each test
    mockCreateElement.mockClear()
    mockAppendChild.mockClear()
    mockFromEvent.mockClear()
    // Mocking document methods
    global.document.createElement = mockCreateElement
    global.document.body.appendChild = mockAppendChild
  })

  describe('loadScript', () => {
    it('should load script if not already loaded', async () => {
      const url = 'http://example.com/script.js'

      const mockScriptElem = { src: url }
      mockCreateElement.mockReturnValue(mockScriptElem)

      mockFromEvent.mockReturnValue(of({})) // Simulate a load event

      const result = await service.loadScript(url)

      expect(mockCreateElement).toHaveBeenCalledWith('script')
      expect(mockAppendChild).toHaveBeenCalledWith(mockScriptElem)
      expect(result).toBe(true)
      expect(service.urlLoadStatus.get(url)).toBe(true)
    })

    it('should return true if script is already loaded', async () => {
      const url = 'http://example.com/script.js'
      service.urlLoadStatus.set(url, true)

      const result = await service.loadScript(url)

      expect(result).toBe(true)
      expect(mockCreateElement).not.toHaveBeenCalled()
    })

    it('should handle errors and return false if script fails to load', async () => {
      const url = 'http://example.com/script.js'
      const error = new Error('Script load failed')
      mockCreateElement.mockImplementation(() => { throw error })

      const result = await service.loadScript(url)

      expect(result).toBe(false)
    })
  })

  describe('loadStyle', () => {
    it('should load style if not already loaded', async () => {
      const url = 'http://example.com/style.css'

      const mockLinkElem = { rel: 'stylesheet', href: url }
      mockCreateElement.mockReturnValue(mockLinkElem)

      const result = await service.loadStyle(url)

      expect(mockCreateElement).toHaveBeenCalledWith('link')
      expect(mockAppendChild).toHaveBeenCalledWith(mockLinkElem)
      expect(result).toBe(true)
      expect(service.urlLoadStatus.get(url)).toBe(true)
    })

    it('should return true if style is already loaded', async () => {
      const url = 'http://example.com/style.css'
      service.urlLoadStatus.set(url, true)

      const result = await service.loadStyle(url)

      expect(result).toBe(true)
      expect(mockCreateElement).not.toHaveBeenCalled()
    })

    it('should handle errors and return false if style fails to load', async () => {
      const url = 'http://example.com/style.css'
      const error = new Error('Style load failed')
      mockCreateElement.mockImplementation(() => { throw error })

      const result = await service.loadStyle(url)

      expect(result).toBe(false)
    })
  })

  describe('loadEventPromise', () => {
    it('should resolve true when script loads', async () => {
      const url = 'http://example.com/script.js'
      const mockScriptElem: any = { src: url }
      service.urlElemMapping.set(url, mockScriptElem)
      mockFromEvent.mockReturnValue(of({})) // Simulate load event

      const result = await service['loadEventPromise'](url)

      expect(mockFromEvent).toHaveBeenCalledWith(mockScriptElem, 'load')
      expect(result).toBe(true)
      expect(service.urlLoadStatus.get(url)).toBe(true)
      expect(service.urlElemMapping.has(url)).toBe(false)
    })

    it('should resolve true if no script element exists', async () => {
      const url = 'http://example.com/script.js'

      const result = await service['loadEventPromise'](url)

      expect(result).toBe(true)
    })
  })
})
