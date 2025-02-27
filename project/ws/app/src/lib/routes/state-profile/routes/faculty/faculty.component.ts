import { Component, OnInit } from '@angular/core'
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { debounceTime, switchMap, takeUntil } from 'rxjs/operators'
import { OrgProfileService } from '../../services/org-profile.service'
import { Subject } from 'rxjs'
import { ConfigurationsService } from '@sunbird-cb/utils'
/* tslint:disable*/
import * as _ from 'lodash'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { DialogBoxComponent } from '../../components/dialog-box/dialog-box.component'


@Component({
    selector: 'ws-app-faculty',
    templateUrl: './faculty.component.html',
    styleUrls: ['./faculty.component.scss'],
    /* tslint:disable */
    host: { class: 'w-full role-card flex flex-1' },
    /* tslint:enable */
})
export class FacultyComponent implements OnInit {
    facultyForm!: UntypedFormGroup
    private unsubscribe = new Subject<void>()

    constructor(
        private orgSvc: OrgProfileService,
        private configSvc: ConfigurationsService,
        private dialog: MatDialog
    ) {
        this.facultyForm = new UntypedFormGroup({
            regularFacultyCount: new UntypedFormControl('', [Validators.required]),
            adhocFacultyCount: new UntypedFormControl('', [Validators.required]),
            guestFacultyCount: new UntypedFormControl('', [Validators.required]),
            otherCount: new UntypedFormControl('', []),
        })

        // pre poluate form fields when data is available (edit mode)
        if (this.configSvc.unMappedUser && this.configSvc.unMappedUser.orgProfile) {
            const facultydata = _.get(this.configSvc.unMappedUser.orgProfile, 'profileDetails.faculty')
            this.facultyForm.patchValue({
                regularFacultyCount: _.get(facultydata, 'regularFacultyCount'),
                adhocFacultyCount: _.get(facultydata, 'adhocFacultyCount'),
                guestFacultyCount: _.get(facultydata, 'guestFacultyCount'),
                otherCount: _.get(facultydata, 'otherCount'),
            })
            this.facultyForm.updateValueAndValidity()
            this.orgSvc.updateLocalFormValue('faculty', this.facultyForm.value)
            this.orgSvc.updateFormStatus('faculty', this.facultyForm.valid)
        }

        this.facultyForm.valueChanges
            .pipe(
                debounceTime(500),
                switchMap(async formValue => {
                    if (formValue) {
                        this.orgSvc.updateLocalFormValue('faculty', formValue)
                        this.orgSvc.updateFormStatus('faculty', this.facultyForm.valid)
                    }
                }),
                takeUntil(this.unsubscribe)
            ).subscribe()
    }

    ngOnInit() {
    }

    openActivityDialog() {
        const dialogRef = this.dialog.open(DialogBoxComponent, {
            data: {
                view: 'faculty',
            },
            hasBackdrop: false,
            width: '550px',

        })
        dialogRef.afterClosed().subscribe(_result => {

        })
    }
}
