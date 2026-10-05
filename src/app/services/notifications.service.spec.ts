import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { of } from 'rxjs'
import { NotificationsService } from './notifications.service'

describe('NotificationsService', () => {
  let service: NotificationsService
  let http: any
  let router: any
  let snackBar: any
  let windowOpen: jest.SpyInstance

  const environment = {
    portalsForNotifications: { cbp: 'https://cbp.igot.in', learner: 'https://learner.igot.in' },
  }
  const contentId = 'do_123'

  const contentNotification = (subCategory: string) => ({
    category: 'CONTENT',
    sub_category: subCategory,
    message: { data: { id: contentId } },
  })

  /** The content read answers with this content. */
  const contentReads = (content: any) => {
    http.get.mockReturnValue(of({ result: { content } }))
  }

  const redirect = (notification: any, roles: string[] = []) =>
    service.handleRedirection(notification, environment, roles, snackBar)

  beforeEach(() => {
    http = { get: jest.fn(), post: jest.fn() }
    router = { navigate: jest.fn() }
    snackBar = { open: jest.fn() }
    windowOpen = jest.spyOn(window, 'open').mockImplementation(() => null)
    service = new NotificationsService(
      http as HttpClient,
      {} as ConfigurationsService,
      router as Router
    )
  })

  afterEach(() => {
    windowOpen.mockRestore()
    localStorage.removeItem('isStandaloneResource')
  })

  it('should create the service', () => {
    expect(service).toBeTruthy()
  })

  describe('handleRedirection for live content', () => {
    /** A published comprehensive assessment is built in this portal, so it opens here in preview. */
    it('should open a published comprehensive assessment in its preview step here', () => {
      contentReads({ status: 'Live', courseCategory: 'Comprehensive Assessment' })

      redirect(contentNotification('CONTENT_PUBLISHED'))

      expect(http.get).toHaveBeenCalledWith(`/apis/proxies/v8/action/content/v3/read/${contentId}`)
      expect(router.navigate).toHaveBeenCalledWith(
        [`/app/home/comprehensive-assessment/edit/${contentId}`],
        { queryParams: { mode: 'view', preview: true, editMode: true, pathUrl: 'live', step: 'preview' } }
      )
      expect(windowOpen).not.toHaveBeenCalled()
    })

    it('should open any other published content in the cbp portal', () => {
      contentReads({ status: 'Live', courseCategory: 'Course' })

      redirect(contentNotification('CONTENT_PUBLISHED'))

      expect(router.navigate).not.toHaveBeenCalled()
      expect(windowOpen).toHaveBeenCalledWith(
        `https://cbp.igot.in/author/content-detail/${contentId}/overview-v2?isStandaloneResource=false`, '_blank')
    })

    it('should open a live comprehensive assessment in the cbp portal for any other notification', () => {
      contentReads({ status: 'Live', courseCategory: 'Comprehensive Assessment' })

      redirect(contentNotification('CONTENT_REVIEWED'))

      expect(router.navigate).not.toHaveBeenCalled()
      expect(windowOpen).toHaveBeenCalledWith(
        `https://cbp.igot.in/author/content-detail/${contentId}/overview-v2?isStandaloneResource=false`, '_blank')
    })

    it('should mark a standalone resource on the cbp link', () => {
      contentReads({ status: 'Live', primaryCategory: 'Learning Resource', resourceCategory: 'Video' })

      redirect(contentNotification('CONTENT_PUBLISHED'))

      expect(localStorage.getItem('isStandaloneResource')).toBe('true')
      expect(windowOpen).toHaveBeenCalledWith(
        `https://cbp.igot.in/author/content-detail/${contentId}/overview-v2?isStandaloneResource=true`, '_blank')
    })
  })

  describe('handleRedirection for content in any other status', () => {
    it('should send a creator to the editor of a draft', () => {
      contentReads({ status: 'Draft', courseCategory: 'Comprehensive Assessment' })

      redirect(contentNotification('CONTENT_PUBLISHED'), ['CONTENT_CREATOR'])

      expect(router.navigate).not.toHaveBeenCalled()
      expect(windowOpen).toHaveBeenCalledWith(
        `https://cbp.igot.in/author/editor/${contentId}/collectionV2?isStandaloneResource=false`, '_blank')
    })

    it('should keep anyone but a creator out of a draft', () => {
      contentReads({ status: 'Draft' })

      redirect(contentNotification('CONTENT_PUBLISHED'))

      expect(snackBar.open).toHaveBeenCalledWith('You are not authorized to view this content.')
      expect(windowOpen).not.toHaveBeenCalled()
    })

    it('should say retired content is retired', () => {
      contentReads({ status: 'Retired', courseCategory: 'Comprehensive Assessment' })

      redirect(contentNotification('CONTENT_PUBLISHED'))

      expect(snackBar.open).toHaveBeenCalledWith('This content is retired.')
      expect(router.navigate).not.toHaveBeenCalled()
    })
  })
})
