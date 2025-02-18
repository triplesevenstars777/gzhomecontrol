import { Injectable, InjectionToken,  Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, Platform } from '@ionic/angular';
import { Observable, timer } from 'rxjs';
import * as moment from 'moment';

import { BackgroundMode } from '@awesome-cordova-plugins/background-mode';
import { Insomnia } from '@awesome-cordova-plugins/insomnia';
import { LocalNotifications } from '@awesome-cordova-plugins/local-notifications';
import { NativeAudio } from '@awesome-cordova-plugins/native-audio';

import { ActuatorService } from '../api/actuator.service';
import { DeviceService } from '../device/device.service';

export const BACKGROUNDMODE_TOKEN = new InjectionToken<any>('background.mode.token');
export const INSOMNIA_TOKEN = new InjectionToken<any>('insomnia.token');
export const LOCALNOTIFICATIONS_TOKEN = new InjectionToken<any>('localnotifications.token');
export const NATIVEAUDIO_TOKEN = new InjectionToken<NativeAudio>('nativeaudio.token');

@Injectable({
  providedIn: 'root'
})
export class PanicProvider {

  private activePanic: any;
  private modalInstance: any;
  private timming$: any;
  private openedModal: boolean = false;
  private backgroundWasActive: boolean = false;
  private rigningId: number = 0;

  private panicRingingText: string = "";
  private panicTimeText: string = "";

  constructor(
    @Inject(BACKGROUNDMODE_TOKEN) private backgroundMode: any,
    @Inject(INSOMNIA_TOKEN) private insomnia: any,
    @Inject(LOCALNOTIFICATIONS_TOKEN)private localNotifications: any,
    @Inject(NATIVEAUDIO_TOKEN) private nativeAudio: NativeAudio,
    private actuatorService: ActuatorService,
    private deviceService: DeviceService,
    private modalCtrl: ModalController,
    private translate: TranslateService,
    public platform: Platform
  ) {
    this.modalInstance = this.modalCtrl.create({
      component: 'DevicePanicPage', 
      cssClass: "modal-fullscreen" 
    });
  }

  activatePanic(measure: any = null) {
    if (!this.openedModal) {
      if (measure) {
        this.activePanic = {
          device: measure.device,
          endpoint: measure.endpoint
        };
      }
      if (this.timming$) {
        this.timming$.unsubscribe();
      }
      if (this.checkPanicMode()) {
        //No Disturb mode desactivado
        this.openNotification();
        this.showRingingNotification();

        this.timming$ = timer(10 * 1000).subscribe(() => {
          if (this.openedModal) {
            this.closeNotification();
          }
        });

      } else {
        //No Disturb mode activado
        this.sendNotification();
        this.setOffDevice();
      }
    }
  }

  private checkPanicMode() {
    const panic = localStorage.getItem('panic');
    if (panic === 'true') { return true };
    return false;
  }

  private openNotification() {
    this.modalInstance.onDidDismiss(action => {
      if (this.timming$) {
        this.timming$.unsubscribe();
      }
      this.openedModal = false;

      this.stopAudio();
      this.removeRingingNotification();

      if (!action) {
        this.sendNotification();
        this.backgroundAgain();
      }
      this.sleepAgain();
      this.setOffDevice();
    });
    this.modalInstance.present();
    this.nativeAudio.loop('PANIC_AUDIO_KEY');

    if (this.platform.is("cordova")) {
      // Simulate we are in background in order to send to dasnboard of mobilock
      this.backgroundWasActive = true;

      if (this.backgroundMode.isActive()) {
        this.showRingingNotification();
      }
      this.backgroundMode.unlock();
      this.backgroundMode.wakeUp();
      this.backgroundMode.moveToForeground();
    }

    this.openedModal = true;
  }

  private backgroundAgain(){
    if(this.backgroundWasActive) {
      this.backgroundWasActive = false;

      if (this.platform.is("cordova")) {
        this.backgroundMode.moveToBackground();
      }
    }
  }

  private sleepAgain(){
    if (this.platform.is("cordova")) {
      this.insomnia.allowSleepAgain().then(
        () => console.log('allowSleepAgain success'),
        () => console.log('allowSleepAgain error')
      );
    }
  }

  private closeNotification() {
    this.modalInstance.dismiss().catch(() => { });
  }

  private stopAudio(){
    this.nativeAudio.stop('PANIC_AUDIO_KEY');
  }

  private sendNotification() {
    if(this.deviceService.isWallTablet()) 
    {
      return;
    }
    this.translate.get('PANIC_RINGING_TIME').subscribe((value) => {
      this.panicTimeText = value;

      this.localNotifications.schedule({
        id: moment().unix(),
        text: this.panicTimeText + ' ' + moment().format('HH:mm:ss'),
        sound: ""
      });
    });
  }

  private showRingingNotification() {
    if(this.deviceService.isWallTablet()) 
    {
      return;
    }
    this.translate.get('PANIC_RINGING').subscribe((value) => {
      this.panicRingingText = value;

      this.rigningId = moment().unix();
      this.localNotifications.schedule({
        id: this.rigningId,
        text: this.panicRingingText,
        sound: "",
        icon: 'res://icon',
        smallIcon: 'res://panic'
      });
    });

  }

  private removeRingingNotification() {
    if (this.rigningId) {
      this.localNotifications.clear(this.rigningId);
      this.rigningId = 0;
    }
  }

  private setOffDevice() {
    if (!this.activePanic) { return }
    this.activePanic.value = 'Off';
    this.actuatorService.create(this.activePanic).subscribe((res) => {
      this.activePanic = null;
    }, (err) => {
      this.activePanic = null;
    });
  }
}
