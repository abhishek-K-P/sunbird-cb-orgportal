//#region (imports)
import { Component, OnDestroy, OnInit } from '@angular/core'
import { NavigationEnd, Router } from '@angular/router'
import { Subscription } from 'rxjs'

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
  //#endregion

  //#region (constructor)
  constructor(
    private router: Router,
  ) { }

  //#endregion

  //#region (onint)
  ngOnInit(): void {
    this.initialization()
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
  }

  updateCurrentRoute(): void {
    const urlSegments = this.router.url.split('/')
    this.currentRoute = urlSegments[urlSegments.length - 1]
  }

  //#endregion

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe()
    }
  }

}
