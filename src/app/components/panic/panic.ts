import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from '@ionic/angular';
import { NativeAudio } from '@awesome-cordova-plugins/native-audio/ngx';

@Component({
  selector: 'panic',
  templateUrl: 'panic.html',
  styleUrl : './panic.scss',
  standalone: false
})
export class PanicComponent implements OnInit, OnDestroy {
  public isActive: boolean = false;
  public panicMessage: string = '';
  private audioFile: string = 'panic';

  constructor(
    private translateService: TranslateService,
    private platform: Platform,
    private nativeAudio: NativeAudio
  ) {
    this.translateService.get('PANIC_ALERT_MESSAGE').subscribe((value) => {
      this.panicMessage = value;
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
        await this.nativeAudio.preloadSimple(this.audioFile, 'assets/panic.mp3');
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
      const audio = new Audio('assets/panic.mp3');
      audio.loop = true; // Panic sound should loop until deactivated
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
