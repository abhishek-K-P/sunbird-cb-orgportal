//#region (imports)
import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router'
import { Subscription } from 'rxjs'
import { BasicInfoComponent } from '../../dialogs/basic-info/basic-info.component'
import * as _ from 'lodash'

//#endregion

@Component({
  selector: 'ws-app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit, OnDestroy {

  //#region (global variables)
  currentRoute = 'pending-approval'
  routeSubscription: Subscription = new Subscription()
  userProfile: any
  pathUrl = ''
  //#endregion

  //#region (constructor)
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private route: Router
  ) { }

  //#endregion

  //#region (onint)
  ngOnInit(): void {
    this.initialization()
    this.getRouteSubscription
  }

  initialization() {
    this.updateCurrentRoute()
    this.getRouteSubscription()
  }

  getRouteSubscription() {
    this.routeSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateCurrentRoute()
      }
    })
    if (_.get(this.activatedRoute, 'snapshot.data.configService.userProfile')) {
      this.userProfile = _.get(this.activatedRoute, 'snapshot.data.configService.userProfile')
    }
    this.pathUrl = _.get(this.activatedRoute, 'snapshot.url[0].path', 'pending-approval')
  }

  updateCurrentRoute(): void {
    const urlSegments = this.router.url.split('/')
    this.currentRoute = urlSegments[urlSegments.length - 1]
  }
  //#endregion

  openBasicInfoDialog() {
    const dialgRrf = this.dialog.open(BasicInfoComponent, {
      panelClass: 'create-event-dialog',
      data: this.userProfile,
    })

    dialgRrf.afterClosed().subscribe((identifier: any) => {
      if (identifier) {
        this.route.navigate([`/app/home/events/edit-event`, identifier], {
          queryParams: {
            mode: 'edit',
            pathUrl: this.pathUrl
          }
        })
      }
    })
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe()
    }
  }

}
