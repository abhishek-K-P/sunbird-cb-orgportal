import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { EventsComponent } from './components/events/events.component'
import { CreateEventComponent } from './components/create-event/create-event.component'
import { UpcomingEventsComponent } from './components/upcoming-events/upcoming-events.component'
import { DraftEventsComponent } from './components/draft-events/draft-events.component'
import { PendingApprovalEventsComponent } from './components/pending-approval-events/pending-approval-events.component'
import { PastEventsComponent } from './components/past-events/past-events.component'
import { RejectedEventsComponent } from './components/rejected-events/rejected-events.component'
import { ConfigResolveService } from '../../resolvers/config-resolve.service'

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
        component: UpcomingEventsComponent,
        data: {
          pageId: 'app/home/events/upcoming',
          module: 'events-2',
        },
      },
      {
        path: 'draft',
        component: DraftEventsComponent,
        data: {
          pageId: 'app/home/events/draft',
          module: 'events-2',
        },
      },
      {
        path: 'pending-approval',
        component: PendingApprovalEventsComponent,
        data: {
          pageId: 'app/home/events/pending-approval',
          module: 'events-2',
        },
      },
      {
        path: 'past',
        component: PastEventsComponent,
        data: {
          pageId: 'app/home/events/past',
          module: 'events-2',
        },
      },
      {
        path: 'rejected',
        component: RejectedEventsComponent,
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
    },
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Events2RoutingModule { }
