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
  filteredThemes: any[] = []
  limitToShow = 4

  comptencyAreasList: any[] = []
  validThemesList: any[] = []
  selectedThemesList: any[] = []
  preSelectedThemesCount = 0
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

      let notSelectedThemes: any[] = []
      let sortedThemes: any = []

      themes.terms
        .filter((theme: any) => theme.associations && theme.associations.length > 0)
        .map((theme: any) => {
          const filteredAssociations = this.filterDuplicates(theme.associations, 'identifier')
          theme['selectedSubThemes'] = []
          if (this.competencies) {
            this.competencies.forEach((competencyArea: any) => {
              if (competencyArea.themes) {
                const selctedTheme = competencyArea.themes.find((_selctedThem: any) => _selctedThem.competencyThemeIdentifier === theme.identifier)
                if (selctedTheme) {
                  theme['selected'] = true
                  theme['preSelected'] = true
                  const sortedAssociations: any[] = []
                  filteredAssociations.forEach((subtheme: any) => {
                    if (selctedTheme.subThems && selctedTheme.subThems.find((selectedSubTheme: any) => selectedSubTheme.competencySubThemeIdentifier === subtheme.identifier)) {
                      subtheme['selected'] = true
                      subtheme['preSelected'] = true
                      theme['selectedSubThemes'].push(subtheme)
                      sortedAssociations.unshift(subtheme)
                    } else {
                      sortedAssociations.push(subtheme)
                    }
                  })
                  theme['associations'] = sortedAssociations
                  this.selectedThemesList.push(theme)
                }
              }
            })
          }
          if (theme['selected'] !== true) {
            notSelectedThemes.push(theme)
          }

          return {
            ...theme,
            associations: filteredAssociations
          }
        })

      const competencyIndexMap: Map<string, number> = new Map()
      this.comptencyAreasList.forEach((competency, index) => {
        if (competency['associations']) {
          competency['associations'].forEach((association: any) => {
            competencyIndexMap.set(association.identifier, index)
          })
        }
      })

      this.preSelectedThemesCount = this.selectedThemesList.length

      sortedThemes = [...this.selectedThemesList, ...notSelectedThemes]

      sortedThemes.forEach((theme: any) => {
        const competencyIndex = competencyIndexMap.get(theme.identifier)
        if (competencyIndex !== undefined) {
          theme['competency_index'] = competencyIndex
        }
      })
      this.validThemesList = sortedThemes
    }

    this.setFilteredThemes()
  }

  filterDuplicates(items: any[], key: string) {
    const seen = new Set()
    return items.filter((item) => {
      if (seen.has(item[key])) {
        return false
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
        const limitToSlice = this.preSelectedThemesCount + this.limitToShow
        this.filteredThemes = filteredList ? filteredList.slice(0, limitToSlice) : []
      } else {
        this.filteredThemes = filteredList
      }
    }
  }

  toggleThemes() {
    this.themesShowMore = !this.themesShowMore
    this.setFilteredThemes()
  }

  selectTheme(index: number) {
    const currentTheme = this.filteredThemes[index]
    if (currentTheme) {
      const checked = currentTheme['selected'] !== true ? true : false
      currentTheme['selected'] = checked
      if (checked) {
        this.selectedThemesList.unshift(currentTheme)
      } else {
        this.selectedThemesList = this.selectedThemesList.filter((selectedTheme) => selectedTheme.identifier !== currentTheme.identifier)
        if (currentTheme.selectedSubThemes) {
          currentTheme.selectedSubThemes.forEach((subThem: any) => {
            subThem['selected'] = false // as it contains reference from root object false will be added to root object
          })
        }
        currentTheme.selectedSubThemes = []
      }
    }
  }

  selectSubTheme(currentSubTheme: any, theme: any) {
    if (currentSubTheme) {
      const checked = currentSubTheme['selected'] !== true ? true : false
      currentSubTheme['selected'] = checked
      if (checked) {
        theme.selectedSubThemes.push(currentSubTheme)
      } else {
        theme.selectedSubThemes = theme.selectedSubThemes.filter((selectedSubTheme: any) => selectedSubTheme.identifier !== currentSubTheme.identifier)
      }
    }
  }

  get canAddCompetencies(): boolean {
    if (!this.selectedThemesList || (
      this.selectedThemesList &&
      this.selectedThemesList.find((selectedThem: any) => (!selectedThem.selectedSubThemes || selectedThem.selectedSubThemes.length === 0)))) {
      return false
    }
    return true
  }

  saveCompetencies() {
    const competencies = this.generateCompetencies()
    this.dialogRef.close(competencies)
  }

  generateCompetencies(): any[] {
    let competenciesList: any[] = []
    if (this.selectedThemesList && this.comptencyAreasList) {
      this.selectedThemesList.forEach((selctedThem: any) => {
        const competencyAreaDetails = this.comptencyAreasList[selctedThem.competency_index]
        if (selctedThem.selectedSubThemes && competencyAreaDetails) {
          selctedThem.selectedSubThemes.forEach((subThem: any) => {
            const competencyDetails = {
              competencyAreaDescription: competencyAreaDetails.description,
              competencyAreaIdentifier: competencyAreaDetails.identifier,
              competencyAreaName: competencyAreaDetails.name,
              competencyAreaRefId: competencyAreaDetails.refId,

              competencyThemeDescription: selctedThem.description,
              competencyThemeIdentifier: selctedThem.identifier,
              competencyThemeName: selctedThem.name,
              competencyThemeRefId: selctedThem.refId,
              competencyThemeType: 'Theme',
              competencyThemeAdditionalProperties: selctedThem.additionalProperties,

              competencySubThemeDescription: subThem.description,
              competencySubThemeIdentifier: subThem.identifier,
              competencySubThemeName: subThem.name,
              competencySubThemeRefId: subThem.refId,
              competencySubThemeAdditionalProperties: subThem.additionalProperties
            }
            competenciesList.push(competencyDetails)
          })
        }
      })
    }
    return competenciesList
  }

  closeDialog() {
    this.dialogRef.close()
  }

}
