import { Component, Input } from '@angular/core'
import { speaker } from '../../models/events.model'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { AddSpeakersComponent } from '../../dialogs/add-speakers/add-speakers.component'

@Component({
  selector: 'ws-app-speakers',
  templateUrl: './speakers.component.html',
  styleUrls: ['./speakers.component.scss']
})
export class SpeakersComponent {
  @Input() speakersList: speaker[] = []
  @Input() openMode = 'edit'
  @Input() userProfile: any

  constructor(
    private dialog: MatDialog,
  ) { }

  openAddSpeakerPopu() {
    const dialogRef = this.dialog.open(AddSpeakersComponent, {
      panelClass: 'dialog_sidenav',
      width: '600px',
      data: {
        rootOrgId: this.userProfile ? this.userProfile.rootOrgId : ''
      }
    })

    dialogRef.afterClosed().subscribe((speakerDetails: speaker) => {
      if (speakerDetails) {
        this.speakersList.push(speakerDetails)
      }
    })
  }

  editSpeaker(index: number) {
    if (this.speakersList && this.speakersList[index]) {
      const dialogRef = this.dialog.open(AddSpeakersComponent, {
        panelClass: 'dialog_sidenav',
        data: {
          rootOrgId: this.userProfile ? this.userProfile.rootOrgId : '',
          speaker: this.speakersList[index]
        },
        width: '600px'
      })

      dialogRef.afterClosed().subscribe((speakerDetails: speaker) => {
        if (speakerDetails) {
          this.speakersList[index] = speakerDetails
        }
      })
    }
  }

  delete(index: number) {
    if (this.speakersList && this.speakersList[index]) {
      this.speakersList.splice(index, 1)
    }
  }
}
