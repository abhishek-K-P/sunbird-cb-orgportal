import { NgModule } from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'

import { Events2RoutingModule } from './events-2-routing.module'
import { EventsComponent } from './components/events/events.component'
import { CreateEventComponent } from './components/create-event/create-event.component'
import { EventBasicDetailsComponent } from './components/event-basic-details/event-basic-details.component'
import { SpeakersComponent } from './components/speakers/speakers.component'
import { EventMaterialsComponent } from './components/event-materials/event-materials.component'
import { EventCompetenciesComponent } from './components/event-competencies/event-competencies.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatLegacyButtonModule } from '@angular/material/legacy-button'
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog'
import { MatLegacyProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'
import { MatLegacyFormFieldModule } from '@angular/material/legacy-form-field'
import { MatLegacyTooltipModule } from '@angular/material/legacy-tooltip'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio'
// import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { EventsTableComponent } from './components/events-table/events-table.component'
import { UpcomingEventsComponent } from './components/upcoming-events/upcoming-events.component'
import { DraftEventsComponent } from './components/draft-events/draft-events.component'
import { PendingApprovalEventsComponent } from './components/pending-approval-events/pending-approval-events.component'
import { PastEventsComponent } from './components/past-events/past-events.component'
import { RejectedEventsComponent } from './components/rejected-events/rejected-events.component'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatTableModule } from '@angular/material/table'
import { MatIconModule } from '@angular/material/icon'
import { MatPaginatorModule } from '@angular/material/paginator'
import { EventsService } from './services/events.service'
import { BasicInfoComponent } from './dialogs/basic-info/basic-info.component'


@NgModule({
  declarations: [
    EventsComponent,
    CreateEventComponent,
    EventBasicDetailsComponent,
    SpeakersComponent,
    EventMaterialsComponent,
    EventCompetenciesComponent,
    EventsTableComponent,
    UpcomingEventsComponent,
    DraftEventsComponent,
    PendingApprovalEventsComponent,
    PastEventsComponent,
    RejectedEventsComponent,
    BasicInfoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatLegacyButtonModule,
    MatDialogModule,
    MatLegacyProgressSpinnerModule,
    MatLegacyFormFieldModule,
    MatLegacyTooltipModule,
    MatMenuModule,
    MatInputModule,
    MatRadioModule,
    Events2RoutingModule,
    MatCardModule,
    MatSnackBarModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
  ],
  providers: [
    DatePipe,
    EventsService
  ]
})
export class Events2Module { }
