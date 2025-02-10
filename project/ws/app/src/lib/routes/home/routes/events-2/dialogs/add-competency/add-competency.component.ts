import { Component, OnInit } from '@angular/core'
import { FormControl } from '@angular/forms'
import { ProfileV2Service } from '../../../../services/home.servive'
import { MatLegacyDialogRef } from '@angular/material/legacy-dialog'
import { debounceTime } from 'rxjs/operators'
import * as _ from 'lodash'

@Component({
  selector: 'ws-app-add-competency',
  templateUrl: './add-competency.component.html',
  styleUrls: ['./add-competency.component.scss']
})

export class AddCompetencyComponent implements OnInit {
  searchControl!: FormControl
  themes: any[] = []
  themesShowMore = false
  subThemesShowMore = false
  subThemes: any[] = []
  filterThemes: any[] = []
  filteredSubThemes: any[] = []
  limitToShow = 4

  comptencyAreasList: any[] = []
  validThemesList: any[] = []
  validSubThemesList: any[] = []
  constructor(
    private dialogRef: MatLegacyDialogRef<AddCompetencyComponent>,
    private homeService: ProfileV2Service
  ) { }

  ngOnInit(): void {
    this.searchControl = new FormControl('')
    this.searchControl.valueChanges.pipe(
      debounceTime(500)
    ).subscribe((serachKey: string) => {
      console.log(serachKey)
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
          })

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

  setFilteredThemes(searchKey = '') {
    if (this.validThemesList) {
      let filteredList = this.validThemesList.filter((theme: any) => theme.name.includes(searchKey))
      this.filterThemes = filteredList ? filteredList.slice(0, this.limitToShow) : []
    }
  }

  setFilteredSubThemes(searchKey = '') {
    if (this.validSubThemesList) {
      let filteredList = this.validSubThemesList.filter((theme: any) => theme.name.includes(searchKey))
      this.filteredSubThemes = filteredList ? filteredList.slice(0, this.limitToShow) : []
    }
  }

  visibleThemes() {
    if (this.validThemesList.length > 4) {
      this.filterThemes = this.validThemesList.slice(0, this.limitToShow)
      this.themesShowMore = true
    } else {
      this.filterThemes = this.validThemesList
      this.themesShowMore = false
    }
  }

  visibleSubThemes() {
    if (this.subThemes.length > 4) {
      this.filteredSubThemes = this.subThemes.slice(0, this.limitToShow)
      this.subThemesShowMore = true
    } else {
      this.filteredSubThemes = this.subThemes
      this.subThemesShowMore = false
    }
  }

  toggleThemes() {
    this.themesShowMore = !this.themesShowMore
    if (!this.themesShowMore) {
      this.filterThemes = this.validThemesList
    } else {
      this.filterThemes = this.validThemesList.slice(0, this.limitToShow)
    }
  }

  toggleSubThemes() {
    this.subThemesShowMore = !this.subThemesShowMore
    if (!this.subThemesShowMore) {
      this.filteredSubThemes = this.subThemes
    } else {
      this.filteredSubThemes = this.subThemes.slice(0, this.limitToShow)
    }
  }

  closeDialog() {
    this.dialogRef.close()
  }

}
