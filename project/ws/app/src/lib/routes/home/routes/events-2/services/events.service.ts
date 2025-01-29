import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

const API_END_POINTS = {
  GET_EVENTS: '/apis/proxies/v8/sunbirdigot/search',
}

@Injectable({
  providedIn: 'root'
})
export class EventsService {

  constructor(
    private http: HttpClient
  ) { }

  getEvents(req: any) {
    return this.http.post<any>(`${API_END_POINTS.GET_EVENTS}`, req)
  }
}
