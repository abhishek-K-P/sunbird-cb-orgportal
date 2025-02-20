import { Component, Inject, OnInit } from '@angular/core'
import { MAT_LEGACY_DIALOG_DATA, MatLegacyDialogRef } from '@angular/material/legacy-dialog'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import * as _ from 'lodash'
@Component({
  selector: 'ws-app-youtube-player',
  templateUrl: './youtube-player.component.html',
  styleUrls: ['./youtube-player.component.scss']
})
export class YoutubePlayerComponent implements OnInit {
  eventData: any
  videoId: any
  youtubeURL = true
  videoLink: SafeResourceUrl = ''
  iframeSrc: SafeResourceUrl = ''
  constructor(
    private dialogRef: MatLegacyDialogRef<YoutubePlayerComponent>,
    @Inject(MAT_LEGACY_DIALOG_DATA) public data: any,
    private domSanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.eventData = this.data.event
    this.getLink()
  }

  getYouTubeVideoId(url: any) {
    const urlParams = new URL(url).searchParams
    return urlParams.get("v")
  }

  getLink() {
    let url = ''
    if (this.eventData && this.eventData.recordedLinks && this.eventData.recordedLinks.length > 0) {
      url = this.eventData.recordedLinks[0]
    } else {
      url = this.eventData.registrationLink
    }
    this.videoId = url
    // tslint:disable-next-line: max-line-length
    // this.videoId = 'https://portal.dev.karmayogibharat.net//assets/public/content/do_114252240474439680163/artifact/do_114252240474439680163_1739775452390_file_example_mp4_480_1_5mg.mp4'
    if (url) {

      if (this.videoId.includes('embed')) {
        this.videoId = this.videoId.split('embed/')[1]
        this.generateVideoLink()
      } else if (this.videoId.includes('watch')) {
        this.videoId = this.getYouTubeVideoId(this.videoId)
        this.generateVideoLink()
      } else {
        this.youtubeURL = false
        this.generateVideoLink()
      }
    }
  }

  generateVideoLink() {
    this.videoLink = this.domSanitizer.bypassSecurityTrustResourceUrl(this.videoId)

    if (this.youtubeURL) {
      const youtubeEmbedUrl = `https://www.youtube.com/embed/${this.videoId}`
      this.iframeSrc = this.domSanitizer.bypassSecurityTrustResourceUrl(youtubeEmbedUrl)
    }
  }

  closeDialog() {
    this.dialogRef.close()
  }

}