import { Component, Input, OnChanges, OnInit } from '@angular/core'
import { speaker } from '../../models/events.model'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { AddSpeakersComponent } from '../../dialogs/add-speakers/add-speakers.component'

@Component({
  selector: 'ws-app-speakers',
  templateUrl: './speakers.component.html',
  styleUrls: ['./speakers.component.scss']
})
export class SpeakersComponent implements OnInit, OnChanges {
  @Input() speakersList: speaker[] = [
    {
      email: 'puran123[at]yopmail[dot]com',
      name: 'Puran',
      description: 'Praesent in mauris eu tortor porttitor accumsan. Mauris suscipit, ligula sit amet pharetra semper,'
    },
    {
      email: 'puran123[at]yopmail[dot]com',
      name: 'Puran',
      description: ''
    },
    {
      email: 'puran123[at]yopmail[dot]com',
      name: '',
      description: 'Praesent in mauris eu tortor porttitor accumsan. Mauris suscipit, ligula sit amet pharetra semper,'
    },
    {
      email: 'puran123[at]yopmail[dot]com',
      name: 'Puran',
      description: 'Praesent in mauris eu tortor porttitor accumsan. Mauris suscipit, ligula sit amet pharetra semper,'
    },
  ]

  constructor(
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
  }

  openAddSpeakerPopu() {
    const dialogRef = this.dialog.open(AddSpeakersComponent, {
      panelClass: 'dialog_sidenav',
      width: '600px'
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
        data: this.speakersList[index],
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
