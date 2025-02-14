import { Component, Inject } from '@angular/core'
import { MAT_LEGACY_DIALOG_DATA, MatLegacyDialogRef } from '@angular/material/legacy-dialog'

@Component({
  selector: 'ws-app-rejection-reason',
  templateUrl: './rejection-reason.component.html',
  styleUrls: ['./rejection-reason.component.scss']
})
export class RejectionReasonComponent {

  rejectReason: any

  constructor(
    private dialogRef: MatLegacyDialogRef<RejectionReasonComponent>,
    @Inject(MAT_LEGACY_DIALOG_DATA) data: any
  ) {
    this.rejectReason = data
  }

  closeDialog() {
    this.dialogRef.close()
  }

}
