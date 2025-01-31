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
  EVENT_READ: (eventId: string) => `apis/proxies/v8/event/v4/read/${eventId}`
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

}
