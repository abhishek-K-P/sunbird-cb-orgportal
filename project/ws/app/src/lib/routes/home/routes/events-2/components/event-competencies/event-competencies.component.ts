import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
import { EventsService } from '../../services/events.service'
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar'
import { AddCompetencyComponent } from '../../dialogs/add-competency/add-competency.component'
import { MatLegacyDialog } from '@angular/material/legacy-dialog'

@Component({
  selector: 'ws-app-event-competencies',
  templateUrl: './event-competencies.component.html',
  styleUrls: ['./event-competencies.component.scss']
})
export class EventCompetenciesComponent implements OnChanges {
  @Input() openMode = 'edit'
  @Input() competenciesList: any = []
  @Output() addCompetencies = new EventEmitter<any>()
  competencies: any
  searchText: string = ''
  event: any
  eventId: any

  constructor(private matSnackBar: MatLegacySnackBar,
    private dialog: MatLegacyDialog,
    private eventsService: EventsService,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes.competenciesList) {
      this.competencies = this.eventsService.convertToTreeView(this.competenciesList)
    }
  }

  ngOnInit(): void {

    // this.eventId = this.route.snapshot.paramMap.get('eventId')

    // this.eventsService.eventDetails.subscribe((res: any) => {
    //   if (res) {
    //     this.event = res
    //     if (this.event?.competencies_v6) {
    //       this.competencies = this.eventsService.convertToTreeView(this.event.competencies_v6)
    //     }
    //   }
    // })
    // let _competencies: any = [
    //   {
    //     "competencyAreaDescription": "Functional competencies are common among many domains, cutting across MDOs, as well as roles and activities.",
    //     "competencyAreaIdentifier": "kcmfinal_fw_competencyarea_af8caa53-7f84-499e-86b2-e32e5b59908e",
    //     "competencyAreaName": "Functional",
    //     "competencyAreaRefId": "COMAREA-000003",
    //     "competencySubThemeAdditionalProperties": {
    //       "displayName": "Handling Allowances & Reimbursement",
    //       "timeStamp": 1724675891609
    //     },
    //     "competencySubThemeDescription": "Handling Allowances & Reimbursement Competency Sub-Theme",
    //     "competencySubThemeIdentifier": "kcmfinal_fw_subtheme_35bf9d51-7299-45a5-ad99-1f7c7db1e4ba",
    //     "competencySubThemeName": "Handling Allowances & Reimbursement",
    //     "competencySubThemeRefId": "COMSUBTHEME-000276",
    //     "competencyThemeAdditionalProperties": {
    //       "displayName": "Administration Matters",
    //       "timeStamp": 1724675757333
    //     },
    //     "competencyThemeDescription": "Administration Matters competency Theme",
    //     "competencyThemeIdentifier": "kcmfinal_fw_theme_92909bf6-2cea-47ea-b426-dc31803f2177",
    //     "competencyThemeName": "Administration Matters",
    //     "competencyThemeRefId": "COMTHEME-000205",
    //     "competencyThemeType": "theme"
    //   },
    //   {
    //     "competencyAreaDescription": "Behavioural competencies describe the key values and strengths that help an official perform effectively in a range of roles.",
    //     "competencyAreaIdentifier": "kcmfinal_fw_competencyarea_5ed3587a-2a9b-4e3c-8852-8ffcff5c70b2",
    //     "competencyAreaName": "Behavioural",
    //     "competencyAreaRefId": "COMAREA-000001",
    //     "competencySubThemeAdditionalProperties": {
    //       "displayName": "Planning & Prioritization",
    //       "timeStamp": 1724764179110
    //     },
    //     "competencySubThemeDescription": "Planning & Prioritization Competency Sub-Theme",
    //     "competencySubThemeIdentifier": "kcmfinal_fw_subtheme_81ded4ed-55dc-4bd1-a21e-6fc5840ce30e",
    //     "competencySubThemeName": "Planning & Prioritization",
    //     "competencySubThemeRefId": "COMSUBTHEME-000025",
    //     "competencyThemeAdditionalProperties": {
    //       "displayName": "Operational Excellence",
    //       "timeStamp": 1724764141855
    //     },
    //     "competencyThemeDescription": "Operational Excellence competency Theme",
    //     "competencyThemeIdentifier": "kcmfinal_fw_theme_49a613f9-b825-4e16-a74a-0d413cf6c4eb",
    //     "competencyThemeName": "Operational Excellence",
    //     "competencyThemeRefId": "COMTHEME-000008",
    //     "competencyThemeType": "theme"
    //   }
    // ]
    // this.competencies = this.eventsService.convertToTreeView(_competencies)
  }

  hideAnfShow(row: any) {
    if (row.collapsed) {
      row.collapsed = false
    } else {
      row.collapsed = true
    }
  }

  removeNode(_competency: any) {
    this.competencies = this.competencies.filter((competency: any) => _competency.competencyAreaName !== competency.competencyAreaName)
    this.openSnackBar('Competency area is removed successfully.')
  }

  removeTheme(_competency: any, _theme: any) {
    this.competencies = this.competencies.map((competency: any) => {
      if (competency.competencyAreaName === _competency.competencyAreaName) {
        return {
          ...competency,
          themes: competency.themes.filter((theme: any) => theme.competencyThemeName !== _theme.competencyThemeName)
        }
      } else {
        return { ...competency }
      }
    })
    this.openSnackBar('Competency theme is removee successfully.')
  }

  removeSubTheme(_competency: any, _theme: any, _subTheme: any) {
    this.competencies = this.competencies.map((competency: any) => {
      if (competency.competencyAreaName === _competency.competencyAreaName) {
        return {
          ...competency,
          themes: competency.themes.map((theme: any) => {
            if (theme.competencyThemeName === _theme.competencyThemeName) {
              return {
                ...theme,
                subThems: theme.subThems.filter(
                  (subTheme: any) => _subTheme.competencySubThemeAdditionalProperties.displayName !== subTheme.competencySubThemeAdditionalProperties.displayName)
              }
            }
            return theme
          })
        }
      } else {
        return { ...competency }
      }
    })
    this.openSnackBar('Competency sub theme is removed successfully.')

  }

  showAddCompetencyDialog() {

    const dialogRef = this.dialog.open(AddCompetencyComponent, {
      panelClass: 'dialog_sidenav',
      width: '800px',
      disableClose: true,
      data: this.competencies
    })

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // this.competenciesList = result
        this.competencies = this.eventsService.convertToTreeView(result)
        this.addCompetencies.emit(result)

      }
    })
  }

  private openSnackBar(message: string) {
    this.matSnackBar.open(message)
  }

}
