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
    this.updateCompetencies()
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
    this.openSnackBar('Competency theme is removed successfully.')
    this.updateCompetencies()
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
    this.updateCompetencies()

  }

  updateCompetencies() {
    this.addCompetencies.emit(this.eventsService.convertToTabularView(this.competencies))
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
