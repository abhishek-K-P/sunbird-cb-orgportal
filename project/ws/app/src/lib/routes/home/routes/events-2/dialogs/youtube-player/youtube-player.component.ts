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
    // this.initializePlayer('')
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

  // initializePlayer(resumeFrom: any) {
  //   let timeSpent = resumeFrom ? resumeFrom : 0

  //   let timeStamp = ''
  //   let timeStampString: any = ''
  //   let lastTimeAccessed = ''
  //   /* tslint:disable */
  //   //  let progress : any= ''
  //   /* tslint:enable */

  //   const dispatcher: telemetryEventDispatcherFunction = (event: any) => {
  //     /* tslint:disable */
  //     console.log(event['data'])

  //     if (event['data']['passThroughData'] && event['data']['passThroughData']['timeSpent']) {
  //       timeSpent = event['data']['passThroughData']['timeSpent']
  //       /* tslint:disable */
  //       console.log('timeSpent % 60 === 0 ', timeSpent, ':: ', timeSpent % 60 === 0)
  //       // if(timeSpent % 60 === 0){
  //       //   this.saveProgressUpdate(this.eventData.duration,timeSpent,lastTimeAccessed)
  //       // }
  //       if (this.eventData) {
  //         if (this.eventData.startDate && this.eventData.startTime) {
  //           let eventDateTime = this.eventData.startDate + ' ' + this.eventData.startTime
  //           let eventDateTimeStamp = new Date(eventDateTime).getTime()
  //           let currentDateTimeStamp = new Date().getTime()
  //           if (currentDateTimeStamp >= eventDateTimeStamp) {
  //             if (timeSpent && timeSpent % this.rateToFire === 0) {
  //               this.startInterval(timeSpent, lastTimeAccessed)
  //             }
  //             this.intervalStarted = true
  //             this.currentEvent = true
  //           }
  //         }
  //       }

  //     }
  //     /* tslint:disable */
  //     if (event['data'] && event['data']['playerStatus'] === 'ENDED') {
  //       if (this.currentEvent) {
  //         this.saveProgressUpdate(this.eventData.duration, timeSpent, lastTimeAccessed)

  //       }
  //     }
  //     // if(event['data']['passThroughData'] && event['data']['passThroughData']['playerDuration']) {
  //     //   playerDuration =  event['data']['passThroughData']['playerDuration']
  //     // }
  //     /* tslint:enable */
  //     // if (this.widgetData.identifier) {
  //     //   this.eventSvc.dispatchEvent(event)
  //     // }
  //   }
  //   const saveCLearning: saveContinueLearningFunction = (data: any) => {
  //     /* tslint:disable */
  //     console.log(data, timeSpent)
  //     const dataobj: any = JSON.parse(data.data)
  //     if (dataobj && dataobj.timestamp) {
  //       // let progress = ''
  //       timeStamp = dataobj.timestamp
  //       timeStampString = new Date(timeStamp).toISOString().replace('T', ' ').replace('Z', ' ').split('.')
  //       lastTimeAccessed = timeStampString[0] + ':00+0000'
  //       // progress = dataobj.progress.toString()
  //     }
  //     if (this.currentEvent) {
  //       this.saveProgressUpdate(this.eventData.duration, timeSpent, lastTimeAccessed)
  //     }
  //   }
  //   const fireRProgress: fireRealTimeProgressFunction = (identifier: any, data: any) => {
  //     /* tslint:disable */
  //     console.log(identifier, data)
  //   }
  //   const initObj = youtubeInitializer(
  //     this.youtubeTag.nativeElement,
  //     this.videoId,
  //     dispatcher,
  //     saveCLearning,
  //     fireRProgress,
  //     { resumeFrom },
  //     '',
  //     true,
  //     {},
  //     NsContent.EMimeTypes.YOUTUBE,
  //     '500px',
  //   )
  //   this.dispose = initObj.dispose
  // }

  // startInterval(timeSpent: any, lastTimeAccessed: any) {
  //   this.saveProgressUpdate(this.eventData.duration, timeSpent, lastTimeAccessed, true)
  // }

  // getBatchId() {
  //   let batchId = ''
  //   if (this.eventData && typeof this.eventData.batches === 'string') {
  //     this.eventData.batches = JSON.parse(this.eventData.batches)
  //   }
  //   if (Array.isArray(this.eventData.batches) && this.eventData.batches.length > 0) {
  //     batchId = this.eventData.batches[0].batchId || ''
  //   }
  //   return batchId
  // }

  // customDateFormat(date: any, time: any) {
  //   const stime = time.split('+')[0]
  //   const hour = stime.substr(0, 2)
  //   const min = stime.substr(2, 3)
  //   return `${date} ${hour}${min}`
  // }

  // saveProgressUpdate(progress: any, timeSpent: any, lastTimeAccessed: any, normalUpdate?: boolean) {
  //   let userId = ''
  //   let completionPercentage: any = 0
  //   const batchId = this.getBatchId()
  //   if (timeSpent) {
  //     // completionPercentage = (timeSpent / (this.eventData.duration * 60)) * 100
  //     completionPercentage = normalUpdate ?
  //       (this.eventData.duration * 60 / (this.eventData.duration * 60)) * 100 :
  //       (timeSpent / (this.eventData.duration * 60)) * 100
  //   }

  //   if (this.eventData) {
  //     const req = {
  //       'request': {
  //         'userId': userId,
  //         'events': [
  //           {
  //             'eventId': this.eventData.identifier,
  //             'batchId': batchId,
  //             'status': completionPercentage > 50 ? 2 : 1,
  //             'lastAccessTime': lastTimeAccessed, // data.dateAccessed
  //             'progressdetails': {
  //               'max_size': this.eventData.duration * 60, // complete video duration
  //               'current': [ // current state
  //                 progress,
  //               ],
  //               'duration': normalUpdate ? this.eventData.duration * 60 : timeSpent, // watch time
  //               'mimeType': 'application/html',
  //               'stateMetaData': timeSpent, // last state
  //             },
  //             'completionPercentage': completionPercentage ? Number(parseFloat(completionPercentage).toFixed(2)) : 0.0,
  //           },
  //         ],
  //       },
  //     }
  //     if (completionPercentage > 50) {
  //       this.rateToFire = 300
  //     }
  //     if (this.resumeEventStatus !== 2) {
  //       /* tslint:disable */
  //       console.log('req', req)
  //       /* tslint:enable */

  //     } else {
  //       /* tslint:disable */
  //       console.log('Already completed ', req)
  //     }
  //   }
  // }

  // ngOnDestroy() {
  //   /* tslint:disable */
  //   console.log(this.player)
  //   /* tslint:enable */
  //   this.intervalStarted = false
  //   if (this.player) {
  //     this.player.dispose()
  //   }
  //   if (this.dispose) {
  //     this.dispose()
  //   }
  // }
}