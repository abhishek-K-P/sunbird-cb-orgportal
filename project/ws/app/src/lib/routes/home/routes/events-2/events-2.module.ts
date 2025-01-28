import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { Events2RoutingModule } from './events-2-routing.module'
import { EventsComponent } from './components/events/events.component'
import { CreateEventComponent } from './components/create-event/create-event.component'
import { EventBasicDetailsComponent } from './components/event-basic-details/event-basic-details.component'
import { SpeakersComponent } from './components/speakers/speakers.component'
import { EventMaterialsComponent } from './components/event-materials/event-materials.component'
import { EventCompetenciesComponent } from './components/event-competencies/event-competencies.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatLegacyButtonModule } from '@angular/material/legacy-button'
import { MatLegacyDialogModule } from '@angular/material/legacy-dialog'
import { MatLegacyProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'
import { MatLegacyFormFieldModule } from '@angular/material/legacy-form-field'
import { MatLegacyTooltipModule } from '@angular/material/legacy-tooltip';
import { EventsTableComponent } from './components/events-table/events-table.component'


@NgModule({
  declarations: [
    EventsComponent,
    CreateEventComponent,
    EventBasicDetailsComponent,
    SpeakersComponent,
    EventMaterialsComponent,
    EventCompetenciesComponent,
    EventsTableComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatLegacyButtonModule,
    MatLegacyDialogModule,
    MatLegacyProgressSpinnerModule,
    MatLegacyFormFieldModule,
    MatLegacyTooltipModule,
    Events2RoutingModule,
  ]
})
export class Events2Module { }
