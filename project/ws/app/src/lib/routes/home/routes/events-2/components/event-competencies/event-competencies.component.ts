import { Component, Input } from '@angular/core'
import { EventsService } from '../../services/events.service'
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar'
import { AddCompetencyComponent } from '../../dialogs/add-competency/add-competency.component'
import { MatLegacyDialog } from '@angular/material/legacy-dialog'

@Component({
  selector: 'ws-app-event-competencies',
  templateUrl: './event-competencies.component.html',
  styleUrls: ['./event-competencies.component.scss']
})
export class EventCompetenciesComponent {
  @Input() openMode = 'edit'
  competencies: any
  searchText: string = ''

  constructor(private matSnackBar: MatLegacySnackBar,
    private dialog: MatLegacyDialog,
    private eventsService: EventsService,
  ) { }

  ngOnInit(): void {
    let _competencies: any = [
      {
        "competencyAreaDescription": "Functional competencies are common among many domains, cutting across MDOs, as well as roles and activities.",
        "competencyAreaIdentifier": "kcmfinal_fw_competencyarea_af8caa53-7f84-499e-86b2-e32e5b59908e",
        "competencyAreaName": "Functional",
        "competencyAreaRefId": "COMAREA-000003",
        "competencySubThemeAdditionalProperties": {
          "displayName": "Handling Allowances & Reimbursement",
          "timeStamp": 1724675891609
        },
        "competencySubThemeDescription": "Handling Allowances & Reimbursement Competency Sub-Theme",
        "competencySubThemeIdentifier": "kcmfinal_fw_subtheme_35bf9d51-7299-45a5-ad99-1f7c7db1e4ba",
        "competencySubThemeName": "Handling Allowances & Reimbursement",
        "competencySubThemeRefId": "COMSUBTHEME-000276",
        "competencyThemeAdditionalProperties": {
          "displayName": "Administration Matters",
          "timeStamp": 1724675757333
        },
        "competencyThemeDescription": "Administration Matters competency Theme",
        "competencyThemeIdentifier": "kcmfinal_fw_theme_92909bf6-2cea-47ea-b426-dc31803f2177",
        "competencyThemeName": "Administration Matters",
        "competencyThemeRefId": "COMTHEME-000205",
        "competencyThemeType": "theme"
      },
      {
        "competencyAreaDescription": "Behavioural competencies describe the key values and strengths that help an official perform effectively in a range of roles.",
        "competencyAreaIdentifier": "kcmfinal_fw_competencyarea_5ed3587a-2a9b-4e3c-8852-8ffcff5c70b2",
        "competencyAreaName": "Behavioural",
        "competencyAreaRefId": "COMAREA-000001",
        "competencySubThemeAdditionalProperties": {
          "displayName": "Influencing and Negotiation",
          "timeStamp": 1724328873174
        },
        "competencySubThemeDescription": "",
        "competencySubThemeIdentifier": "kcmfinal_fw_subtheme_42a53028-112d-43e8-9726-2065b4d36257",
        "competencySubThemeName": "Influencing and Negotiation",
        "competencySubThemeRefId": "COMSUBTHEME-000035",
        "competencyThemeAdditionalProperties": {
          "displayName": "Collaborative Leadership",
          "timeStamp": 1724328741549
        },
        "competencyThemeDescription": "",
        "competencyThemeIdentifier": "kcmfinal_fw_theme_b88dbaf8-99f8-45da-a4a7-5e23f9e1c001",
        "competencyThemeName": "Collaborative Leadership",
        "competencyThemeRefId": "COMTHEME-000011",
        "competencyThemeType": "theme"
      },
      {
        "competencyAreaDescription": "Functional competencies are common among many domains, cutting across MDOs, as well as roles and activities.",
        "competencyAreaIdentifier": "kcmfinal_fw_competencyarea_af8caa53-7f84-499e-86b2-e32e5b59908e",
        "competencyAreaName": "Functional",
        "competencyAreaRefId": "COMAREA-000003",
        "competencySubThemeAdditionalProperties": {
          "displayName": "Implementing Official Language",
          "timeStamp": 1724675927861
        },
        "competencySubThemeDescription": "Implementing Official Language Competency Sub-Theme",
        "competencySubThemeIdentifier": "kcmfinal_fw_subtheme_364e40fe-95ea-4437-9f14-d2d6331feff8",
        "competencySubThemeName": "Implementing Official Language",
        "competencySubThemeRefId": "COMSUBTHEME-000279",
        "competencyThemeAdditionalProperties": {
          "displayName": "Administration Matters",
          "timeStamp": 1724675757333
        },
        "competencyThemeDescription": "Administration Matters competency Theme",
        "competencyThemeIdentifier": "kcmfinal_fw_theme_92909bf6-2cea-47ea-b426-dc31803f2177",
        "competencyThemeName": "Administration Matters",
        "competencyThemeRefId": "COMTHEME-000205",
        "competencyThemeType": "theme"
      },
      {
        "competencyAreaDescription": "Behavioural competencies describe the key values and strengths that help an official perform effectively in a range of roles.",
        "competencyAreaIdentifier": "kcmfinal_fw_competencyarea_5ed3587a-2a9b-4e3c-8852-8ffcff5c70b2",
        "competencyAreaName": "Behavioural",
        "competencyAreaRefId": "COMAREA-000001",
        "competencySubThemeAdditionalProperties": {
          "displayName": "Conflict Management",
          "timeStamp": 1724328873172
        },
        "competencySubThemeDescription": "",
        "competencySubThemeIdentifier": "kcmfinal_fw_subtheme_61c8ba58-0202-4f76-8fbd-c32bb6b3c952",
        "competencySubThemeName": "Conflict Management",
        "competencySubThemeRefId": "COMSUBTHEME-000036",
        "competencyThemeAdditionalProperties": {
          "displayName": "Collaborative Leadership",
          "timeStamp": 1724328741549
        },
        "competencyThemeDescription": "",
        "competencyThemeIdentifier": "kcmfinal_fw_theme_b88dbaf8-99f8-45da-a4a7-5e23f9e1c001",
        "competencyThemeName": "Collaborative Leadership",
        "competencyThemeRefId": "COMTHEME-000011",
        "competencyThemeType": "theme"
      },
      {
        "competencyAreaDescription": "Behavioural competencies describe the key values and strengths that help an official perform effectively in a range of roles.",
        "competencyAreaIdentifier": "kcmfinal_fw_competencyarea_5ed3587a-2a9b-4e3c-8852-8ffcff5c70b2",
        "competencyAreaName": "Behavioural",
        "competencyAreaRefId": "COMAREA-000001",
        "competencySubThemeAdditionalProperties": {
          "displayName": "Planning & Prioritization",
          "timeStamp": 1724764179110
        },
        "competencySubThemeDescription": "Planning & Prioritization Competency Sub-Theme",
        "competencySubThemeIdentifier": "kcmfinal_fw_subtheme_81ded4ed-55dc-4bd1-a21e-6fc5840ce30e",
        "competencySubThemeName": "Planning & Prioritization",
        "competencySubThemeRefId": "COMSUBTHEME-000025",
        "competencyThemeAdditionalProperties": {
          "displayName": "Operational Excellence",
          "timeStamp": 1724764141855
        },
        "competencyThemeDescription": "Operational Excellence competency Theme",
        "competencyThemeIdentifier": "kcmfinal_fw_theme_49a613f9-b825-4e16-a74a-0d413cf6c4eb",
        "competencyThemeName": "Operational Excellence",
        "competencyThemeRefId": "COMTHEME-000008",
        "competencyThemeType": "theme"
      },
      {
        "competencyAreaDescription": "Domain competencies are defined for a specific domain (for example, the Ministry of Personnel or Department of Biotechnology) but that does not mean others will not need them.",
        "competencyAreaIdentifier": "kcmfinal_fw_competencyarea_c527d0c7-ab6a-40d8-a06b-298fedc32b6c",
        "competencyAreaName": "Domain",
        "competencyAreaRefId": "COMAREA-000002",
        "competencySubThemeAdditionalProperties": {
          "displayName": "Adherence to Vigilance Guidelines",
          "timeStamp": 1724329331026
        },
        "competencySubThemeDescription": "Adherence to Vigilance Guidelines Competency Sub-Theme",
        "competencySubThemeIdentifier": "kcmfinal_fw_subtheme_7d0f9ba8-275a-453f-a5ca-e6eba616ace5",
        "competencySubThemeName": "Adherence to Vigilance Guidelines",
        "competencySubThemeRefId": "COMSUBTHEME-000044",
        "competencyThemeAdditionalProperties": {
          "displayName": "Adherence to Vigilance Guidelines",
          "timeStamp": 1724329319692
        },
        "competencyThemeDescription": "Adherence to Vigilance Guidelines competency Theme",
        "competencyThemeIdentifier": "kcmfinal_fw_theme_b3d2e633-5959-4d1e-9d7f-bba42865ca68",
        "competencyThemeName": "Adherence to Vigilance Guidelines",
        "competencyThemeRefId": "COMTHEME-000016",
        "competencyThemeType": "theme"
      },
      {
        "competencyAreaDescription": "Functional competencies are common among many domains, cutting across MDOs, as well as roles and activities.",
        "competencyAreaIdentifier": "kcmfinal_fw_competencyarea_af8caa53-7f84-499e-86b2-e32e5b59908e",
        "competencyAreaName": "Functional",
        "competencyAreaRefId": "COMAREA-000003",
        "competencySubThemeAdditionalProperties": {
          "displayName": "Preventive Vigilance",
          "timeStamp": 1724767755390
        },
        "competencySubThemeDescription": "Preventive Vigilance Competency Sub-Theme",
        "competencySubThemeIdentifier": "kcmfinal_fw_subtheme_2ce23e33-3121-4a46-a07b-2adbdaffc579",
        "competencySubThemeName": "Preventive Vigilance",
        "competencySubThemeRefId": "COMSUBTHEME-000266",
        "competencyThemeAdditionalProperties": {
          "displayName": "Vigilance Administration",
          "timeStamp": 1724767709764
        },
        "competencyThemeDescription": "Vigilance Administration competency Theme",
        "competencyThemeIdentifier": "kcmfinal_fw_theme_f2717261-6319-4f5c-b05a-8767fa4c3f51",
        "competencyThemeName": "Vigilance Administration",
        "competencyThemeRefId": "COMTHEME-000201",
        "competencyThemeType": "theme"
      },
      {
        "competencyAreaDescription": "Functional competencies are common among many domains, cutting across MDOs, as well as roles and activities.",
        "competencyAreaIdentifier": "kcmfinal_fw_competencyarea_af8caa53-7f84-499e-86b2-e32e5b59908e",
        "competencyAreaName": "Functional",
        "competencyAreaRefId": "COMAREA-000003",
        "competencySubThemeAdditionalProperties": {
          "displayName": "Inventory Management",
          "timeStamp": 1724767037164
        },
        "competencySubThemeDescription": "Inventory Management Competency Sub-Theme",
        "competencySubThemeIdentifier": "kcmfinal_fw_subtheme_6ba1543e-891f-46ec-b09b-974156f54cc1",
        "competencySubThemeName": "Inventory Management",
        "competencySubThemeRefId": "COMSUBTHEME-000234",
        "competencyThemeAdditionalProperties": {
          "displayName": "Material Management",
          "timeStamp": 1724767010422
        },
        "competencyThemeDescription": "Material Management competency Theme",
        "competencyThemeIdentifier": "kcmfinal_fw_theme_b8e6271f-f225-4593-978b-4f1a822c7485",
        "competencyThemeName": "Material Management",
        "competencyThemeRefId": "COMTHEME-000193",
        "competencyThemeType": "theme"
      },
      {
        "competencyAreaDescription": "Domain competencies are defined for a specific domain (for example, the Ministry of Personnel or Department of Biotechnology) but that does not mean others will not need them.",
        "competencyAreaIdentifier": "kcmfinal_fw_competencyarea_c527d0c7-ab6a-40d8-a06b-298fedc32b6c",
        "competencyAreaName": "Domain",
        "competencyAreaRefId": "COMAREA-000002",
        "competencySubThemeAdditionalProperties": {
          "displayName": "Human Resource Systems Management",
          "timeStamp": 1724687263661
        },
        "competencySubThemeDescription": "Human Resource Systems Management Competency Sub-Theme",
        "competencySubThemeIdentifier": "kcmfinal_fw_subtheme_a445103c-94e6-4c21-8050-08b668f19e7c",
        "competencySubThemeName": "Human Resource Systems Management",
        "competencySubThemeRefId": "COMSUBTHEME-000116",
        "competencyThemeAdditionalProperties": {
          "displayName": "Human Resource Systems Management",
          "timeStamp": 1724648584675
        },
        "competencyThemeDescription": "Human Resource Systems Management competency Theme",
        "competencyThemeIdentifier": "kcmfinal_fw_theme_02855add-e2bf-4348-8c5f-a00492461620",
        "competencyThemeName": "Human Resource Systems Management",
        "competencyThemeRefId": "COMTHEME-000088",
        "competencyThemeType": "theme"
      },
      {
        "competencyAreaDescription": "Functional competencies are common among many domains, cutting across MDOs, as well as roles and activities.",
        "competencyAreaIdentifier": "kcmfinal_fw_competencyarea_af8caa53-7f84-499e-86b2-e32e5b59908e",
        "competencyAreaName": "Functional",
        "competencyAreaRefId": "COMAREA-000003",
        "competencySubThemeAdditionalProperties": {
          "displayName": "Handling Miscellaneous Matters (Car, Residence, Personal Staff etc.)",
          "timeStamp": 1724675861316
        },
        "competencySubThemeDescription": "Handling Miscellaneous Matters (Car, Residence, Personal Staff etc.) Competency Sub-Theme",
        "competencySubThemeIdentifier": "kcmfinal_fw_subtheme_0632be81-392a-45f8-a93b-b1649e29fb5e",
        "competencySubThemeName": "Handling Miscellaneous Matters (Car, Residence, Personal Staff etc.)",
        "competencySubThemeRefId": "COMSUBTHEME-000278",
        "competencyThemeAdditionalProperties": {
          "displayName": "Administration Matters",
          "timeStamp": 1724675757333
        },
        "competencyThemeDescription": "Administration Matters competency Theme",
        "competencyThemeIdentifier": "kcmfinal_fw_theme_92909bf6-2cea-47ea-b426-dc31803f2177",
        "competencyThemeName": "Administration Matters",
        "competencyThemeRefId": "COMTHEME-000205",
        "competencyThemeType": "theme"
      }
    ]
    this.competencies = this.eventsService.convertToTreeView(_competencies)
    console.log("competenciesObject ", this.competencies)
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
    this.openSnackBar('Competency area is remove successfully.')
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
    this.openSnackBar('Competency theme is remove successfully.')
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
    this.openSnackBar('Competency sub theme is remove successfully.')

  }

  showSearch() {

    const dialogRef = this.dialog.open(AddCompetencyComponent, {
      panelClass: 'dialog_sidenav',
      width: '800px',
      disableClose: true,
    })

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        console.log(result)
      }
    })
  }

  private openSnackBar(message: string) {
    this.matSnackBar.open(message)
  }

}
