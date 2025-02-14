import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { map } from 'rxjs/operators'
import * as _ from 'lodash'
import { DatePipe } from '@angular/common'
import { Observable } from 'rxjs'

const API_END_POINTS = {
  GET_EVENTS: '/apis/proxies/v8/sunbirdigot/search',
  CREATE_CONTENT: 'apis/proxies/v8/action/content/v3/create',
  UPLOAD_CONTENT: 'apis/proxies/v8/upload/action/content/v3/upload',
  CREATE_EVENT: '/apis/proxies/v8/event/v4/create',
  EVENT_READ: (eventId: string) => `apis/proxies/v8/event/v4/read/${eventId}`,
  UPDATE_EVENT: (eventId: string) => `apis/proxies/v8/event/v4/update/${eventId}`,
  PUBLISH_EVENT: (eventId: string) => `apis/proxies/v8/event/v4/publish/${eventId}`,
  SEARCH_USERS: '/apis/proxies/v8/user/v1/search',
}

@Injectable({
  providedIn: 'root'
})
export class EventsService {

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe
  ) { }

  getEvents(req: any) {
    return this.http.post<any>(`${API_END_POINTS.GET_EVENTS}`, req).pipe(map((res: any) => {
      const formatedData = {
        Event: _.get(res, 'result.Event', []),
        count: _.get(res, 'result.count', 0)
      }
      formatedData.Event.forEach((event: any) => {
        event['startDate'] = event['startDate'] ? this.datePipe.transform(event['startDate'], 'dd MMM, yyyy') : ''
        event['createdOn'] = event['createdOn'] ? this.datePipe.transform(event['createdOn'], 'dd MMM, yyyy') : ''
      })
      return formatedData
    }))
  }

  createContent(req: any): Observable<any> {
    return this.http.post<any>(`${API_END_POINTS.CREATE_CONTENT}`, req)
  }

  uploadContent(val: any, formdata: any): Observable<any> {
    this.http.post<any>(`${API_END_POINTS.UPLOAD_CONTENT}/${val}`, formdata, {
      headers: {
        'content-type': 'application/json',
      },
    })
    return this.http.post<any>(`${API_END_POINTS.UPLOAD_CONTENT}/${val}`, formdata)
  }

  createEvent(req: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.CREATE_EVENT, req)
  }

  getEventDetailsByid(eventId: string) {
    return this.http.get<any>(API_END_POINTS.EVENT_READ(eventId))
  }

  updateEvent(formBody: any, eventId: string) {
    return this.http.patch<any>(`${API_END_POINTS.UPDATE_EVENT(eventId)}`, formBody)
  }

  publishEvent(eventId: string, formBody: any) {
    return this.http.post<any>(API_END_POINTS.PUBLISH_EVENT(eventId), formBody)
  }

  convertToTreeView(competencies: any) {
    const competenciesObject: any = []

    competencies.forEach((_obj: any) => {
      let _area = competenciesObject.find((cObj: any) => cObj.competencyAreaName === _obj.competencyAreaName)
      if (_area) {
        let findTheme = _area.themes.find((theme: any) => theme.competencyThemeRefId === _obj.competencyThemeRefId)
        if (findTheme) {
          findTheme.subThems.push({
            competencySubThemeDescription: _obj.competencySubThemeDescription,
            competencySubThemeIdentifier: _obj.competencySubThemeIdentifier,
            competencySubThemeName: _obj.competencySubThemeName,
            competencySubThemeRefId: _obj.competencySubThemeRefId,
            competencySubThemeAdditionalProperties: {
              displayName: _obj.competencySubThemeAdditionalProperties.displayName,
              timeStamp: _obj.competencySubThemeAdditionalProperties.timeStamp
            }
          })
        } else {
          let _themeObj = this.generateThemeObj(_obj)
          _area.themes.push(_themeObj)
        }
      } else {
        let _themeObj = this.generateThemeObj(_obj)
        competenciesObject.push({
          competencyAreaDescription: _obj.competencyAreaDescription,
          competencyAreaIdentifier: _obj.competencyAreaIdentifier,
          competencyAreaName: _obj.competencyAreaName,
          competencyAreaRefId: _obj.competencyAreaRefId,
          collapsed: true,
          themes: [_themeObj]
        })
      }
    })
    return competenciesObject
  }

  generateThemeObj(_obj: any) {
    let themeObj: any = {
      competencyThemeDescription: _obj.competencyThemeDescription,
      competencyThemeIdentifier: _obj.competencyThemeIdentifier,
      competencyThemeName: _obj.competencyThemeName,
      competencyThemeRefId: _obj.competencyThemeRefId,
      competencyThemeType: _obj.competencyThemeType,
      collapsed: true,
      competencyThemeAdditionalProperties: {
        displayName: _obj.competencyThemeAdditionalProperties.displayName,
        timeStamp: _obj.competencyThemeAdditionalProperties.timeStamp
      },
      subThems: [{
        competencySubThemeDescription: _obj.competencySubThemeDescription,
        competencySubThemeIdentifier: _obj.competencySubThemeIdentifier,
        competencySubThemeName: _obj.competencySubThemeName,
        competencySubThemeRefId: _obj.competencySubThemeRefId,
        competencySubThemeAdditionalProperties: {
          displayName: _obj.competencySubThemeAdditionalProperties.displayName,
          timeStamp: _obj.competencySubThemeAdditionalProperties.timeStamp
        }
      }]
    }
    return themeObj
  }

  searchUser(value: string, rootOrgId: string) {
    const reqBody = {
      request: {
        query: value,
        filters: {
          rootOrgId
        },
      },
    }

    return this.http.post<any>(`${API_END_POINTS.SEARCH_USERS}`, reqBody)
  }

}
