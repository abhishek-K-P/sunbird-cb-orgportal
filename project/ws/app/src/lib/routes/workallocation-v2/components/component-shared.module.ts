import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator'
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio'
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table'
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { UserAutocompleteCardComponent } from './user-autocomplete-card/user-autocomplete-card.component'
import { ExportAsModule } from 'ngx-export-as'
import { AutocompleteModule } from './autocomplete/autocomplete.module'
import { InitialAvatarComponent } from './initial-avatar/initial-avatar.component'
import { PublishPopupComponent } from './publish-popup/publish-popup.component'
// import { PdfViewerModule } from 'ng2-pdf-viewer'
import { PlayerDialogComponent } from './player-dialog/player-dialog.component'
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component'

@NgModule({
    declarations: [
        UserAutocompleteCardComponent,
        InitialAvatarComponent,
        PublishPopupComponent,
        PlayerDialogComponent,
        ConfirmDialogComponent,
    ],
    // PdfViewerModule
    imports: [
        CommonModule,
        MatCardModule, FormsModule, ReactiveFormsModule, MatSidenavModule, MatListModule,
        MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatGridListModule,
        MatRadioModule, MatDialogModule, MatSelectModule, MatProgressSpinnerModule,
        MatExpansionModule, MatDividerModule, MatPaginatorModule, MatTableModule,
        ExportAsModule, MatMenuModule, MatTabsModule, MatProgressSpinnerModule, MatAutocompleteModule,
        AutocompleteModule,
    ],
    exports: [
        UserAutocompleteCardComponent,
        InitialAvatarComponent,
        PublishPopupComponent,
        PlayerDialogComponent,
        ConfirmDialogComponent,
    ]
})
export class ComponentSharedModule { }
