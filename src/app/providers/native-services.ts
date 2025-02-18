import { Injectable } from '@angular/core';
import { NativeAudio } from '@awesome-cordova-plugins/native-audio/ngx';
import { BackgroundMode } from '@awesome-cordova-plugins/background-mode/ngx';
import { Insomnia } from '@awesome-cordova-plugins/insomnia/ngx';
import { LocalNotifications } from '@awesome-cordova-plugins/local-notifications/ngx';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
}) 
export class NativeServices {
  constructor(
    private nativeAudio: NativeAudio,
    private backgroundMode: BackgroundMode,
    private insomnia: Insomnia,
    private platform: Platform
  ) {}

  getNativeAudio(): NativeAudio {
    return this.nativeAudio;
  }

  getBackgroundMode(): BackgroundMode {
    return this.backgroundMode;
  }

  getInsomnia(): Insomnia {
    return this.insomnia;
  }

  getLocalNotifications(): any {
    if (this.platform.is('cordova')) {
      return LocalNotifications;
    }
    // Return a mock implementation for non-Cordova environments
    return {
      schedule: () => Promise.resolve(),
      clear: () => Promise.resolve(),
      // Add other methods as needed
    };
  }
}
