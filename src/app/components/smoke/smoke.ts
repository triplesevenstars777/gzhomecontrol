import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from '@ionic/angular';
import { NativeAudio } from '@awesome-cordova-plugins/native-audio/ngx';

@Component({
  selector: 'smoke',
  templateUrl: 'smoke.html',
  styleUrl : './smoke.scss',
  standalone: false
})
export class SmokeComponent implements OnInit, OnDestroy {
  public isActive: boolean = false;
  public smokeAlertMessage: string = '';
  private audioFile: string = 'smoke';

  constructor(
    private translateService: TranslateService,
    private platform: Platform,
    private nativeAudio: NativeAudio
  ) {
    this.translateService.get('SMOKE_ALERT_MESSAGE').subscribe((value) => {
      this.smokeAlertMessage = value;
    });

    if (this.platform.is('cordova')) {
      this.preloadAudio();
    }
  }

  ngOnInit() {
    // Initialize any required state
  }

  private async preloadAudio() {
    if (this.platform.is('cordova')) {
      try {
        await this.nativeAudio.preloadSimple(this.audioFile, 'assets/smoke.mp3');
      } catch (error) {
        console.error('Error preloading audio:', error);
      }
    }
  }

  public async activateAlert() {
    this.isActive = true;
    if (this.platform.is('cordova')) {
      try {
        await this.nativeAudio.play(this.audioFile);
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    } else {
      // Fallback for browser
      const audio = new Audio('assets/smoke.mp3');
      audio.play().catch(error => console.error('Error playing audio:', error));
    }
  }

  public async deactivateAlert() {
    this.isActive = false;
    if (this.platform.is('cordova')) {
      try {
        await this.nativeAudio.stop(this.audioFile);
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    }
  }

  async ngOnDestroy() {
    if (this.platform.is('cordova')) {
      try {
        await this.nativeAudio.unload(this.audioFile);
      } catch (error) {
        console.error('Error unloading audio:', error);
      }
    }
  }
}
