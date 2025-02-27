import { NgModule } from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import { CreateUserComponent } from './routes/create-user/create-user.component'
import { ViewUserComponent } from './routes/view-user/view-user.component'
import { RouterModule } from '@angular/router'
import { UsersRoutingModule } from './users.routing.module'
import { BreadcrumbsOrgModule, ScrollspyLeftMenuModule, UIORGTableModule } from '@sunbird-cb/collection'
import {
  MatSidenavModule, MatGridListModule, MatListModule, MatCardModule, MatFormFieldModule, MatInputModule,
  MatIconModule, MatButtonModule, MatRadioModule, MatDialogModule, MatSelectModule, MatProgressSpinnerModule,
  MatPaginatorModule, MatTableModule, MatSortModule, MatChipsModule,
} from '@angular/material'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatDividerModule } from '@angular/material/divider'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { RolesService } from './services/roles.service'
import { FileService } from './services/upload.service'
import { UsersUploadComponent } from './components/users-upload/users-upload.component'
import { PipeEmailModule } from '../pipes/pipe-email/pipe-email.module'
import { PipeDurationTransformModule } from '@sunbird-cb/utils'

@NgModule({
  declarations: [CreateUserComponent, ViewUserComponent, UsersUploadComponent],
  imports: [
    CommonModule, RouterModule, UsersRoutingModule, BreadcrumbsOrgModule,
    MatSidenavModule, MatListModule, ScrollspyLeftMenuModule, MatCardModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatGridListModule,
    MatRadioModule, MatDialogModule, ReactiveFormsModule, MatSelectModule, MatProgressSpinnerModule,
    MatExpansionModule, MatDividerModule, MatPaginatorModule, MatTableModule, WidgetResolverModule, MatSortModule, PipeEmailModule,
    UIORGTableModule, MatChipsModule, PipeDurationTransformModule,
  ],
  providers: [RolesService, FileService, DatePipe],
  exports: [UsersUploadComponent],
})
export class UsersModule { }
