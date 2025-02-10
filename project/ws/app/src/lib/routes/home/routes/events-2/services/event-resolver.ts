import { Injectable } from '@angular/core'
import { catchError, map } from 'rxjs/operators'
import { of, Observable } from 'rxjs'
import { ActivatedRoute } from '@angular/router'
import { EventsService } from './events.service'
import * as _ from 'lodash'

@Injectable()
export class EventResolverService {

  constructor(private eventSvc: EventsService) { }

  resolve(activatedRoute: ActivatedRoute): Observable<any> {
    const id = _.get(activatedRoute, 'params.eventId', '').replace(':', '')
    return this.eventSvc.getEventDetailsByid(id)
      .pipe(
        map((data: any) => {
          const requiredData = _.get(data, 'result.event')
          return { data: requiredData, error: null }
        }),
        catchError((err: any) => {
          return of({ data: null, error: err })
        })
      )
  }
}
