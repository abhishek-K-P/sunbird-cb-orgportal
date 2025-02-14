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
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select'
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field'
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar'
import { EventsTableComponent } from './components/events-table/events-table.component'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatTableModule } from '@angular/material/table'
import { MatIconModule } from '@angular/material/icon'
import { EventsService } from './services/events.service'
import { BasicInfoComponent } from './dialogs/basic-info/basic-info.component'
import { MatStepperModule } from '@angular/material/stepper'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { AddSpeakersComponent } from './dialogs/add-speakers/add-speakers.component'
import { MaterialDetailsComponent } from './components/material-details/material-details.component'
import { EventsListComponent } from './components/events-list/events-list.component'
import { MatLegacyPaginatorModule } from '@angular/material/legacy-paginator'
import { EventResolverService } from './services/event-resolver'
import { AddCompetencyComponent } from './dialogs/add-competency/add-competency.component'
import { MatLegacyCheckboxModule } from '@angular/material/legacy-checkbox'
import { MatLegacyAutocompleteModule } from '@angular/material/legacy-autocomplete'
import { EventsPreviewComponent } from './components/events-preview/events-preview.component'
import { YoutubePlayerComponent } from './dialogs/youtube-player/youtube-player.component'
import { MatLegacyTabsModule } from '@angular/material/legacy-tabs'
import { CardCompetencyComponent } from './components/card-competency/card-competency.component'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { RejectionReasonComponent } from './dialogs/rejection-reason/rejection-reason.component'
// import { MatTimepickerModule } from 'mat-timepicker'


@NgModule({
  declarations: [
    EventsComponent,
    CreateEventComponent,
    EventBasicDetailsComponent,
    SpeakersComponent,
    EventMaterialsComponent,
    EventCompetenciesComponent,
    EventsTableComponent,
    BasicInfoComponent,
    AddSpeakersComponent,
    MaterialDetailsComponent,
    EventsListComponent,
    AddCompetencyComponent,
    EventsPreviewComponent,
    YoutubePlayerComponent,
    CardCompetencyComponent,
    RejectionReasonComponent
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
    MatSelectModule,
    MatLegacyCheckboxModule,
    Events2RoutingModule,
    MatCardModule,
    MatSnackBarModule,
    MatTableModule,
    MatIconModule,
    MatLegacyPaginatorModule,
    MatStepperModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatLegacyAutocompleteModule,
    MatLegacyTabsModule,
    WidgetResolverModule,
    // MatTimepickerModule
    NgxMaterialTimepickerModule
  ],
  providers: [
    DatePipe,
    EventsService,
    EventResolverService
  ]
})
export class Events2Module { }
