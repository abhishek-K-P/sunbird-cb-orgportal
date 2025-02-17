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
    this.dialog.open(AddSpeakersComponent, {
      panelClass: 'dialog_sidenav',
      width: '600px',
      data: {
        rootOrgId: this.userProfile ? this.userProfile.rootOrgId : '',
        speakersList: this.speakersList
      }
    })
  }

  editSpeaker(speakerIndex: number) {
    if (this.speakersList && this.speakersList[speakerIndex]) {
      this.dialog.open(AddSpeakersComponent, {
        panelClass: 'dialog_sidenav',
        data: {
          rootOrgId: this.userProfile ? this.userProfile.rootOrgId : '',
          speakerIndex: speakerIndex,
          speakersList: this.speakersList
        },
        width: '600px'
      })
    }
  }

  delete(index: number) {
    if (this.speakersList && this.speakersList[index]) {
      this.speakersList.splice(index, 1)
    }
  }

}
