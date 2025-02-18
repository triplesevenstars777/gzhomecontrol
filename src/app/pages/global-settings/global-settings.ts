import { Component, Inject } from "@angular/core";
import { DEVICE_TOKEN } from '../../providers/device/device.service';
import { Router } from '@angular/router';
import {
  AlertController,
  LoadingController,
  NavController
} from "@ionic/angular";
import { Device } from "@awesome-cordova-plugins/device/ngx";

import { environment } from "../../../environments/environment.prod";
import { AuthService } from "../../providers/api/auth.service";
import { NodeService } from "../../providers/api/node.service";
import { DeviceService } from "../../providers/device/device.service";
import { FirstRunPage } from "..";
import { Settings } from "../../providers";
import { TranslateService } from "@ngx-translate/core";
import { UserStorage } from "../../providers/user/user-storage";
import moment from "moment";

@Component({
  selector: "page-global-settings",
  templateUrl: "global-settings.html",
  styleUrl: "./global-settings.scss",
  standalone: false
})
export class GlobalSettingsPage {
  public currentUser: any = null;
  public currentDoorbell: string = "";
  public currentLanguage: string = "";
  public currentServerEndpoint: string = "";
  public currentIoTHubEndpoint: string = "";
  public isLoading = false;

  public appVersion: string = "";
  public panic: boolean = false;
  public noDisturb: boolean = false;
  public blockDevices: boolean = false;
  public serverUrlChanged: boolean = false;

  public tabletModel: string;
  public tabletManufacturer: string;

  public cancelButtonString: string;
  public acceptButtonString: string;
  public passwordString: string;
  public enterLogoutPasswordTitleString: string;

  public enterAdvancedPasswordTitle: string;
  public advancedSettingsModalTitle: string;
  public settingsConfirmTitle: string;
  public settingsConfirmMessage: string;

  private languages = {
    en: "ENGLISH",
    es: "SPANISH",
    de: "GERMAN",
    it: "ITALIAN",
    fr: "FRENCH",
    po: "POLISH"
  };

  constructor(
    private alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    private auth: AuthService,
    @Inject(DEVICE_TOKEN) private device: Device,
    private deviceService: DeviceService,
    private router: Router,
    private nodeService: NodeService,
    private settings: Settings,
    private userStorage: UserStorage,
    public translateService: TranslateService
  ) {
    this.translateService
      .get("ENTER_LOGOUT_PASSWORD_TITLE")
      .subscribe((value) => {
        this.enterLogoutPasswordTitleString = value;
      });
    this.translateService.get("PASSWORD").subscribe((value) => {
      this.passwordString = value;
    });
    this.translateService.get("CANCEL_BUTTON").subscribe((value) => {
      this.cancelButtonString = value;
    });
    this.translateService.get("ACCEPT_BUTTON").subscribe((value) => {
      this.acceptButtonString = value;
    });
    this.translateService
      .get("ENTER_ADVANCED_PASSWORD_TITLE")
      .subscribe((value) => {
        this.enterAdvancedPasswordTitle = value;
      });
    this.translateService
      .get("ADVANCED_SETTINGS_MODAL_TITLE")
      .subscribe((value) => {
        this.advancedSettingsModalTitle = value;
      });
    this.translateService
      .get("SETTINGS_CONFIRMATION_TITLE")
      .subscribe((value) => {
        this.settingsConfirmTitle = value;
      });
    this.translateService
      .get("SETTINGS_CONFIRMATION_MESSAGE")
      .subscribe((value) => {
        this.settingsConfirmMessage = value;
      });

    if (this.deviceService.isMobile()) {
      this.tabletManufacturer = this.device.manufacturer;
      this.tabletModel = this.device.model;
    }

    this.currentServerEndpoint = this.userStorage.API_URL || "";
    this.currentIoTHubEndpoint = this.userStorage.IOT_HUB || "";

    try {
      this.currentUser = JSON.parse(this.userStorage.REMEMBER || "{}").email || "";
    } catch (e) {
      this.currentUser = "";
    }
  }

  ngOnInit() {
    this.appVersion = environment.version;
    this.noDisturb = this.settings.getDisturbMode();
    this.panic = this.settings.getPanicMode();
    this.nodeService.blockDevicesStatus().subscribe((response: any) => {
      this.blockDevices = Boolean(response);
    });
    this.settings.doorbellRingtone().subscribe((ringtone) => {
      this.currentDoorbell = ringtone;
    });
    if (this.translateService.currentLang !== undefined) {
      this.translateService
        .get(this.languages[this.translateService.currentLang])
        .subscribe((val) => {
          this.currentLanguage = val;
        });
    } else {
      this.translateService.get("SELECT_LANGUAGE").subscribe((val) => {
        this.currentLanguage = val;
      });
    }
  }

  updateDisturbState(value: boolean) {
    this.noDisturb = value;
    this.settings.updateDisturbState(this.noDisturb);
  }

  updatePanicState(value: any) {
    this.panic = value;
    this.settings.updatePanicState(this.panic);
  }

  updateBlockDevices(value: any) {
    this.settings.updateBlockDevices(value);
  }

  async updateLanguage(event: any) {
    const value = event.detail.value;
    this.isLoading = true;
    const loader = await this.loadingCtrl.create({
      message: this.translateService.instant("LOAD_LANGUAGE"),
      backdropDismiss: false
    });
    await loader.present();
    
    try {
      this.settings.updateCurrentLanguage(value);
      moment.locale(value);
      await this.translateService.use(value);
      
      setTimeout(() => {
        this.isLoading = false;
        loader.dismiss();
        this.router.navigate(['/dashboard']);
      }, 500);
    } catch (error) {
      console.error('Language update error:', error);
      this.isLoading = false;
      loader.dismiss();
    }
  }

  updateRingtone(event: any) {
    const value = event.detail.value;
    this.settings.updateDoorbellTone(value);
  }

  async accessAdvanced() {
    let confirmation = await this.alertCtrl.create({
      header: this.settingsConfirmTitle,
      subHeader: this.serverUrlChanged ? this.settingsConfirmMessage + ' Please restart the tablet.' : this.settingsConfirmMessage,
      buttons: [
        {
          text: this.acceptButtonString,
          handler: (data) => {
            if (!this.serverUrlChanged) {
              return true;
            }
            this.logoutAction();
            return true;
          },
        },
      ],
    });

    let alert2 = await this.alertCtrl.create({
      header: this.advancedSettingsModalTitle,
      inputs: [
        {
          name: "server",
          placeholder: "GZRE Server",
          type: "text",
          value:
            this.currentServerEndpoint !== "" &&
            this.currentServerEndpoint !== undefined &&
            this.currentServerEndpoint !== null
              ? this.currentServerEndpoint
              : "https://gzre.gozmart.ch",
          label: "GZRE Server",
        },
        {
          name: "iot_hub",
          placeholder: "GZIH Server",
          type: "text",
          value:
            this.currentIoTHubEndpoint !== "" &&
            this.currentIoTHubEndpoint !== undefined &&
            this.currentIoTHubEndpoint !== null
              ? this.currentIoTHubEndpoint
              : "gzih.gozmart.ch",
          label: "GZIH Server",
        },
      ],
      buttons: [
        {
          text: this.cancelButtonString,
          role: "cancel",
          handler: (data) => { return false; },
        },
        {
          text: this.acceptButtonString,
          handler: async (data) => {
            if (
              data.server !== "" &&
              data.server !== this.userStorage.API_URL
            ) {
              this.serverUrlChanged = true;
              this.userStorage.API_URL = data.server;
              this.currentServerEndpoint = data.server;
            }
            if (
              data.iot_hub !== "" &&
              data.iot_hub !== this.userStorage.IOT_HUB
            ) {
              this.userStorage.IOT_HUB = data.iot_hub;
              this.currentIoTHubEndpoint = data.iot_hub;
            }
            await confirmation.present();
            return true;
          },
        },
      ],
    });

    let alert = await this.alertCtrl.create({
      header: this.enterAdvancedPasswordTitle,
      inputs: [
        {
          name: "password",
          placeholder: this.passwordString,
          type: "password",
        },
      ],
      buttons: [
        {
          text: this.cancelButtonString,
          role: "cancel",
          handler: (data) => { return false; },
        },
        {
          text: this.acceptButtonString,
          handler: async (data) => {
            if (data.password === "DP-Dietikon2018") {
              await alert2.present();
              return true;
            } else {
              return false;
            }
          },
        },
      ],
    });

    alert.present();
  }

  async logout() {
    let alert = await this.alertCtrl.create({
      header: this.enterLogoutPasswordTitleString,
      inputs: [
        {
          name: "password",
          placeholder: this.passwordString,
          type: "password",
        },
      ],
      buttons: [
        {
          text: this.cancelButtonString,
          role: "cancel",
          handler: (data) => { return false; },
        },
        {
          text: this.acceptButtonString,
          handler: (data) => {
            if (data.password === "DP-Dietikon2018") {
              this.logoutAction();
              return true;
            } else {
              return false;
            }
          },
        },
      ],
    });

    if (this.deviceService.isWallTablet()) {
      await alert.present();
    } else {
      this.logoutAction();
    }
  }

  logoutAction() {
    this.auth.logout();
    this.router.navigate(['/login']); 
  }

  push(page: string, section: string) {
      this.router.navigate(['/global-settings/in-toggles', section],{ replaceUrl: true });
  }

  goToScenes() {
    this.router.navigate(['/global-settings/scenes']);
  }
}
