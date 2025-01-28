import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { EventsComponent } from './components/events/events.component'
import { CreateEventComponent } from './components/create-event/create-event.component'

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: EventsComponent,
    data: {
      pageId: 'home/events',
      module: 'events-2',
      pageType: 'feature',
      pageKey: 'events',
    },
  }, {
    path: 'create-event/:id',
    pathMatch: 'full',
    component: CreateEventComponent
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Events2RoutingModule { }
