import { Component, Input } from '@angular/core'
import { speaker } from '../../models/events.model'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { AddSpeakersComponent } from '../../dialogs/add-speakers/add-speakers.component'
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar'

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
    private matSnackBar: MatLegacySnackBar,
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
        if (this.speakersList.find((addedSpeaker: any) => addedSpeaker.email.toLowerCase() === speakerDetails.email.toLocaleLowerCase())) {
          this.speakersList.push(speakerDetails)
        } else {
          this.openSnackBar('There is already a speaker with the same email. Please add the speaker with a different email.')
        }
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
          if (this.speakersList.find((addedSpeaker: any) => addedSpeaker.email.toLowerCase() === speakerDetails.email.toLocaleLowerCase())) {
            this.speakersList[index] = speakerDetails
          } else {
            this.openSnackBar('There is already a speaker with the same email. Please update speaker with a different email.')
          }
        }
      })
    }
  }

  delete(index: number) {
    if (this.speakersList && this.speakersList[index]) {
      this.speakersList.splice(index, 1)
    }
  }

  private openSnackBar(message: string) {
    this.matSnackBar.open(message)
  }
}
