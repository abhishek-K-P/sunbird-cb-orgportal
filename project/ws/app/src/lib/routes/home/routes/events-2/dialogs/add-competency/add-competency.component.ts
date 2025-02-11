import { Component, Inject, OnInit } from '@angular/core'
import { FormControl } from '@angular/forms'
import { ProfileV2Service } from '../../../../services/home.servive'
import { MAT_LEGACY_DIALOG_DATA, MatLegacyDialogRef } from '@angular/material/legacy-dialog'
import { debounceTime } from 'rxjs/operators'
import * as _ from 'lodash'

@Component({
  selector: 'ws-app-add-competency',
  templateUrl: './add-competency.component.html',
  styleUrls: ['./add-competency.component.scss']
})

export class AddCompetencyComponent implements OnInit {
  searchControl!: FormControl
  themesShowMore = false
  subThemesShowMore = false
  filteredThemes: any[] = []
  filteredSubThemes: any[] = []
  limitToShow = 4

  comptencyAreasList: any[] = []
  validThemesList: any[] = []
  validSubThemesList: any[] = []
  selectedThemesList: any[] = []
  selectedSubThemesList: any[] = []
  constructor(
    private dialogRef: MatLegacyDialogRef<AddCompetencyComponent>,
    @Inject(MAT_LEGACY_DIALOG_DATA) private competencies: any[],
    private homeService: ProfileV2Service
  ) { }

  ngOnInit(): void {
    this.searchControl = new FormControl('')
    this.searchControl.valueChanges.pipe(
      debounceTime(500)
    ).subscribe(() => {
      this.setFilteredThemes()
      this.setFilteredSubThemes()
    })

    this.getFrameWorkDetails()
  }

  getFrameWorkDetails() {
    this.homeService.getFilterEntityV2().subscribe((response: any) => {
      this.generateThemsAndSubThemes(response)
    })
  }

  generateThemsAndSubThemes(response: any) {
    if (response) {
      let competencyArea: any = []
      let themes: any = []
      response.forEach((areas: any) => {
        if (areas.code === 'competencyarea') {
          competencyArea = areas
          this.comptencyAreasList = competencyArea.terms
        } else if (areas.code === 'theme') {
          themes = areas
        }
      })

      if (!themes || !themes.terms) return

      let filteredThemes = themes.terms
        .filter((theme: any) => theme.associations && theme.associations.length > 0)
        .map((theme: any, themeIndex: number) => {
          const filteredAssociations = this.filterDuplicates(theme.associations, 'identifier')
          filteredAssociations.forEach((subtheme: any) => {
            subtheme['themeIndex'] = themeIndex
            subtheme['themeIdentifier'] = theme.identifier
            if (this.competencies && this.competencies.find((competency) => competency.competencySubThemeIdentifier === subtheme.identifier)) {
              subtheme['selected'] = true
              this.selectedSubThemesList.push(theme)
            }
          })
          if (this.competencies && this.competencies.find((competency) => competency.competencyThemeIdentifier === theme.identifier)) {
            theme['selected'] = true
            this.selectedThemesList.push(theme)
          }

          return {
            ...theme,
            associations: filteredAssociations
          }
        })

      const competencyRefIdMap = new Map<string, any>()
      this.comptencyAreasList.forEach((competency: any) => {
        competency.associations.forEach((competencyThemes: any) => {
          competencyRefIdMap.set(competencyThemes.refId, competencyThemes)
        })
      })
      filteredThemes.forEach((theme: any) => {
        theme.associations.forEach((subtheme: any) => {
          const competencyThemes = competencyRefIdMap.get(subtheme.refId)
          if (competencyThemes) {
            subtheme.competencyRefId = competencyThemes.refId
          }
        })
      })

      this.validThemesList = filteredThemes
      this.validSubThemesList = filteredThemes
        .reduce((acc: any[], theme: any) => {
          return [...acc, ...theme.associations]
        }, [])
        .filter((subtheme: any, index: number, self: any[]) => {
          return self.findIndex(s => s.identifier === subtheme.identifier) === index
        })
    }

    this.setFilteredThemes()
    this.setFilteredSubThemes()
  }

  filterDuplicates(items: any[], key: string) {
    const seen = new Set()
    return items.filter((item) => {
      if (seen.has(item[key])) {
        return false  // Duplicate found
      }
      seen.add(item[key])
      return true
    })
  }

  setFilteredThemes() {
    const searchKey = this.searchControl.value.toLowerCase() || ''
    if (this.validThemesList) {
      let filteredList = this.validThemesList.filter((theme: any) => theme.name.toLowerCase().includes(searchKey))
      if (!this.themesShowMore) {
        this.filteredThemes = filteredList ? filteredList.slice(0, this.limitToShow) : []
      } else {
        this.filteredThemes = filteredList
      }
    }
  }

  setFilteredSubThemes() {
    const searchKey = this.searchControl.value.toLowerCase() || ''
    if (this.validSubThemesList) {
      let filteredList = this.validSubThemesList.filter((theme: any) => theme.name.toLowerCase().includes(searchKey))
      if (!this.subThemesShowMore) {
        this.filteredSubThemes = filteredList ? filteredList.slice(0, this.limitToShow) : []
      } else {
        this.filteredSubThemes = filteredList
      }
    }
  }

  toggleThemes() {
    this.themesShowMore = !this.themesShowMore
    this.setFilteredThemes()
  }

  toggleSubThemes() {
    this.subThemesShowMore = !this.subThemesShowMore
    this.setFilteredSubThemes()
  }

  selectTheme(index: number) {
    const currentTheme = this.filteredThemes[index]
    if (currentTheme) {
      const checked = currentTheme['selected'] !== true ? true : false
      currentTheme['selected'] = checked
      if (checked) {
        this.selectedThemesList.push(currentTheme)
      } else {
        this.selectedThemesList = this.selectedThemesList.filter((selectedTheme) => selectedTheme.identifier !== currentTheme.identifier)
        const selectedSubThemes: any = []
        this.selectedSubThemesList.forEach((selectedSubTheme) => {
          if (selectedSubTheme.themeIdentifier === currentTheme.identifier) {
            selectedSubTheme['selected'] = false
          } else {
            selectedSubThemes.push(selectedSubTheme)
          }
        })
        this.selectedSubThemesList = selectedSubThemes
      }
    }
  }

  selectSubTheme(index: number) {
    const currentSubTheme = this.filteredSubThemes[index]
    if (currentSubTheme) {
      const checked = currentSubTheme['selected'] !== true ? true : false
      currentSubTheme['selected'] = checked
      if (checked) {
        this.selectedSubThemesList.push(currentSubTheme)
      } else {
        this.selectedSubThemesList = this.selectedSubThemesList.filter((selectedSubTheme) => selectedSubTheme.identifier !== currentSubTheme.identifier)
      }
    }
  }

  closeDialog() {
    this.dialogRef.close()
  }

}
