import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

const API_END_POINTS = {
  GET_ALL_ROLES: '/apis/proxies/v8/data/v1/system/settings/get/orgTypeList',
  GET_PROGRAM_COORDINATOR_ROLES: '/apis/proxies/v8/program/coordinator/roles',
}

export const BP_TRAINER_ROLE = 'BP_PROGRAM_TRAINER'

// 'National Lead Trainer' -> 'NATIONAL_LEAD_TRAINER', the form profileDetails.bpCoTrainer is stored in
export function toBpCoTrainerCode(value: any): string {
  return `${value || ''}`.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_')
}

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  constructor(private http: HttpClient) { }
  getAllRoles(): Observable<any> {
    return this.http.get(API_END_POINTS.GET_ALL_ROLES)
  }
  getProgramCoordinatorRoles(): Observable<any> {
    return this.http.get(API_END_POINTS.GET_PROGRAM_COORDINATOR_ROLES)
  }
}
