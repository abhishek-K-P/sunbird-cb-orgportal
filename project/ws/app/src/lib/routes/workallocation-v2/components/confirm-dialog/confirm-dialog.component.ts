import { Component, Inject } from '@angular/core'
import { MAT_LEGACY_DIALOG_DATA, MatLegacyDialogRef } from '@angular/material/legacy-dialog'

@Component({
  selector: 'ws-app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {

  dialgData: any

  constructor(
    private dialogRef: MatLegacyDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_LEGACY_DIALOG_DATA) public data: any
  ) {
    this.dialgData = data
  }

  closeDialog(action: string | boolean) {
    this.dialogRef.close(action)
  }
}
