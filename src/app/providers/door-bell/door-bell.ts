import { Injectable, Inject, InjectionToken } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { ModalController, Platform } from "@ionic/angular";
import { Observable, timer } from "rxjs";
import * as moment from "moment";

import { ActuatorService } from "../api/actuator.service";
import { DeviceService } from "../device/device.service";
import { Settings } from "../settings/settings";
import { ApiNew } from "../api/api-new";

// Define injection tokens
export const BACKGROUNDMODE_TOKEN = new InjectionToken<any>('background.mode.token');
export const INSOMNIA_TOKEN = new InjectionToken<any>('insomnia.token');
export const LOCALNOTIFICATIONS_TOKEN = new InjectionToken<any>('localnotifications.token');
export const NATIVEAUDIO_TOKEN = new InjectionToken<any>('nativeaudio.token');

@Injectable({
  providedIn: 'root'
})
export class DoorBellProvider {
  private activeDoorBell: any;
  private modalInstance: any;
  private timming$: any;
  private openedModal: boolean = false;
  private backgroundWasActive: boolean = false;
  private rigningId: number = 0;

  private doorbellRingingText: string = "";
  private doorbellTimeText: string = "";

  constructor(
    @Inject(BACKGROUNDMODE_TOKEN) private backgroundMode: any,
    @Inject(INSOMNIA_TOKEN) private insomnia: any,
    @Inject(LOCALNOTIFICATIONS_TOKEN) private localNotifications: any,
    @Inject(NATIVEAUDIO_TOKEN) private nativeAudio: any,
    private actuatorService: ActuatorService,
    private deviceService: DeviceService,
    private modalCtrl: ModalController,
    private translate: TranslateService,
    public platform: Platform,
    public settings: Settings,
    private apiNew: ApiNew
  ) {
    this.modalInstance = this.modalCtrl.create({
      component: 'DeviceDoorBellPage',
      cssClass: 'modal-fullscreen'
    });
  }

  async activateDoorBell(measure: any = null, silent: boolean = false) {
    console.log('activateDoorBell', this.openedModal);
    if (!this.openedModal) {
      if (measure) {
        this.activeDoorBell = {
          device: measure.device,
          endpoint: measure.endpoint,
        };
      }
      if (this.timming$) {
        this.timming$.unsubscribe();
      }

      if (!this.checkDisturbMode() && !silent) {
        //No Disturb mode desactivado
        await this.openNotification();
        this.showRingingNotification();

        this.timming$ = timer(7 * 1000).subscribe(() => {
          if (this.openedModal) {
            this.stopAudio();
            this.closeNotification();
          }
        });
      } else {
        //No Disturb mode activado
        //this.sendNotification();
        this.setOffDevice();
      }
    }
  }

  storeDoorBellTopic() {
    this.apiNew
      .getAll("devices", { include: "room", limit: 100 })
      .subscribe((values: any) => {
        const doorBell = values.docs.find((item) =>
          ["000021", "000020", "000022"].includes(item.uid.code)
        );
        if (doorBell !== undefined) {
          this.settings.updateDoorbellTopic(
            "gozmart/sonoff/" +
              doorBell.uid.mac +
              doorBell.uid.code +
              "/relay/0"
          );
        }
      });
  }

  private checkDisturbMode() {
    const noDisturb = localStorage.getItem("noDisturb");
    if (noDisturb === "true") {
      return true;
    }
    return false;
  }

  private async openNotification() {
    console.warn('openNotification');
    this.openedModal = true;
    this.modalInstance.onDidDismiss((action) => {
      if (this.timming$) {
        this.timming$.unsubscribe();
      }
      this.openedModal = false;

      this.stopAudio();
      this.removeRingingNotification();
      if (!action) {
        //this.sendNotification();
        this.backgroundAgain();
      }
      this.sleepAgain();
      this.setOffDevice();
    });
    await this.modalInstance.present();
    if (this.platform.is("cordova")) {
      // Simulate we are in background in order to send to dashboard of mobilock
      this.backgroundWasActive = true;

      if (this.backgroundMode.isActive()) {
        this.showRingingNotification();
      }
      this.backgroundMode.unlock();
      this.backgroundMode.wakeUp();
      this.backgroundMode.moveToForeground();
    }
    let doorBellTone = this.settings.getDoorbellTone();
    if(doorBellTone == undefined) doorBellTone = "";
    try {
      await this.nativeAudio.play(doorBellTone);
    } catch(err) {
      console.error('Error playing audio:', err);
    }
    // Force to close modal - JMA - 25-10-2021
    timer(10 * 1000).subscribe(() => {
      this.closeNotification();
    });
  }

  private backgroundAgain() {
    if (this.backgroundWasActive) {
      this.backgroundWasActive = false;

      if (this.platform.is("cordova")) {
        this.backgroundMode.moveToBackground();
      }
    }
  }

  private sleepAgain() {
    if (this.platform.is("cordova")) {
      this.insomnia.allowSleepAgain().then(
        () => console.log("allowSleepAgain success"),
        () => console.log("allowSleepAgain error")
      );
    }
  }

  private closeNotification() {
    this.modalInstance.dismiss(false).catch(() => {});
  }

  private async stopAudio() {
    let doorBellTone = this.settings.getDoorbellTone();
    if(doorBellTone == undefined) doorBellTone = "";
    try {
      await this.nativeAudio.stop(doorBellTone);
      await this.nativeAudio.unload(doorBellTone);
    } catch(err) {
      console.error('Error stopping audio:', err);
    }
  }

  private sendNotification() {
    if (this.deviceService.isWallTablet()) {
      return;
    }
    this.translate.get("DOORBELL_RINGING_TIME").subscribe((value) => {
      this.doorbellTimeText = value;

      this.localNotifications.schedule({
        id: moment().unix(),
        text: this.doorbellTimeText + " " + moment().format("HH:mm:ss"),
        sound: undefined,
        icon: "res://icon",
        smallIcon: "res://doorbell",
      });
    });
  }

  private showRingingNotification() {
    if (this.deviceService.isWallTablet()) {
      return;
    }
    this.translate.get("DOORBELL_RINGING").subscribe((value) => {
      this.doorbellRingingText = value;

      this.rigningId = moment().unix();
      this.localNotifications.schedule({
        id: this.rigningId,
        text: this.doorbellRingingText,
        sound: undefined,
        icon: "res://icon",
        smallIcon: "res://doorbell",
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
    if (!this.activeDoorBell) {
      return;
    }
    this.activeDoorBell.value = "Off";
    this.actuatorService.create(this.activeDoorBell).subscribe(
      (res) => {
        this.activeDoorBell = null;
      },
      (err) => {
        this.activeDoorBell = null;
      }
    );
  }
}
