import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { EventsComponent } from './components/events/events.component'
import { CreateEventComponent } from './components/create-event/create-event.component'
import { ConfigResolveService } from '../../resolvers/config-resolve.service'
import { EventsListComponent } from './components/events-list/events-list.component'
import { EventResolverService } from './services/event-resolver'

const routes: Routes = [
  {
    path: '',
    component: EventsComponent,
    data: {
      pageId: 'home/events',
      module: 'events-2',
      pageType: 'feature',
      pageKey: 'events',
      path: '',
    },
    resolve: {
      configService: ConfigResolveService,
    },
    children: [
      {
        path: '',
        redirectTo: 'pending-approval',
        pathMatch: 'full',
      },
      {
        path: 'upcoming',
        component: EventsListComponent,
        data: {
          pageId: 'app/home/events/upcoming',
          module: 'events-2',
        },
        resolve: {
          configService: ConfigResolveService,
        },
      },
      {
        path: 'draft',
        component: EventsListComponent,
        data: {
          pageId: 'app/home/events/draft',
          module: 'events-2',
        },
      },
      {
        path: 'pending-approval',
        component: EventsListComponent,
        data: {
          pageId: 'app/home/events/pending-approval',
          module: 'events-2',
        },
        resolve: {
          configService: ConfigResolveService,
        },
      },
      {
        path: 'past',
        component: EventsListComponent,
        data: {
          pageId: 'app/home/events/past',
          module: 'events-2',
        },
      },
      {
        path: 'canceled',
        component: EventsListComponent,
        data: {
          pageId: 'app/home/events/canceled',
          module: 'events-2',
        },
      },
      {
        path: 'rejected',
        component: EventsListComponent,
        data: {
          pageId: 'app/home/events/rejected',
          module: 'events-2',
        },
      },
    ],
  }, {
    path: 'edit-event/:eventId',
    pathMatch: 'full',
    component: CreateEventComponent,
    resolve: {
      configService: ConfigResolveService,
      eventDetails: EventResolverService
    },
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Events2RoutingModule { }
