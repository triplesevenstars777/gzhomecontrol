import { Injectable, InjectionToken, Inject } from "@angular/core";
import { Storage } from "@ionic/storage";
import { Subject, BehaviorSubject } from "rxjs";
import { environment } from '../../../environments/environment';
import { UserStorage } from '../user/user-storage';

// Define an injection token for the defaults
export const SETTINGS_DEFAULTS = new InjectionToken<any>('settings.defaults');

/**
 * A simple settings/config class for storing key/value pairs with persistence.
 */
@Injectable({
  providedIn: 'root'
})
export class Settings {
  private SETTINGS_KEY: string = "_settings";

  settings: any;
  private disturbMode$: Subject<any> = new Subject();
  private panicMode$: Subject<any> = new Subject();
  private blockDevicesMode$: Subject<any> = new Subject();
  private doorbellRingTone$: BehaviorSubject<any> = new BehaviorSubject(
    this.getDoorbellTone()
  );
  private doorbellTopic$: Subject<any> = new Subject();
  private currentLanguage$: BehaviorSubject<any> = new BehaviorSubject(
    this.getCurrentLanguage()
  );

  _defaults: any;
  _readyPromise: Promise<any> = Promise.resolve();

  constructor(
    public storage: Storage,
    @Inject(SETTINGS_DEFAULTS) defaults: any // Use @Inject to specify the injection token
  ) {
    this._defaults = defaults;
  }

  getDisturbMode() {
    const noDisturb = localStorage.getItem("noDisturb");
    if (noDisturb === "true") {
      return true;
    } else {
      return false;
    }
  }

  getPanicMode() {
    const panic = localStorage.getItem("panic");
    if (panic === "true") {
      return true;
    } else {
      return false;
    }
  }

  getBlockDevices() {
    const blockDevices = localStorage.getItem("blockDevices");
    if (blockDevices === "true") {
      return true;
    } else {
      return false;
    }
  }

  getDoorbellTone() {
    return localStorage.getItem("doorbellTone");
  }

  getDoorbellTopic() {
    return localStorage.getItem("doorbellTopic");
  }

  getCurrentLanguage() {
    return localStorage.getItem("currentLanguage");
  }

  updateDisturbState(val) {
    localStorage.setItem("noDisturb", `${val}`);
    this.disturbMode$.next(val);
  }

  updatePanicState(val) {
    localStorage.setItem("panic", `${val}`);
    this.panicMode$.next(val);
  }

  updateBlockDevices(val) {
    localStorage.setItem("blockDevices", `${val}`);
    this.blockDevicesMode$.next(val);
  }

  updateDoorbellTone(val) {
    localStorage.setItem("doorbellTone", `${val}`);
    this.doorbellRingTone$.next(val);
  }

  updateDoorbellTopic(val) {
    localStorage.setItem("doorbellTopic", `${val}`);
    this.doorbellTopic$.next(val);
  }

  updateCurrentLanguage(val: string) {
    if (val && ["en", "de", "fr", "es", "it", "pos"].includes(val)) {
      localStorage.setItem("currentLanguage", val);
      this.currentLanguage$.next(val);
    }
  }

  disturbModeListener() {
    return this.disturbMode$.asObservable();
  }

  panicModeListener() {
    return this.panicMode$.asObservable();
  }

  blockDevicesModeListener() {
    return this.blockDevicesMode$.asObservable();
  }

  doorbellRingtone() {
    return this.doorbellRingTone$.asObservable();
  }

  doorbellTopic() {
    return this.doorbellTopic$.asObservable();
  }

  currentLang() {
    return this.currentLanguage$.asObservable();
  }

  load() {
    return this.storage.get(this.SETTINGS_KEY).then((value) => {
      if (value) {
        this.settings = value;
        return this._mergeDefaults(this._defaults);
      } else {
        return this.setAll(this._defaults).then((val) => {
          this.settings = val;
        });
      }
    });
  }

  _mergeDefaults(defaults: any) {
    for (let k in defaults) {
      if (!(k in this.settings)) {
        this.settings[k] = defaults[k];
      }
    }
    return this.setAll(this.settings);
  }

  merge(settings: any) {
    for (let k in settings) {
      this.settings[k] = settings[k];
    }
    return this.save();
  }

  setValue(key: string, value: any) {
    this.settings[key] = value;
    return this.storage.set(this.SETTINGS_KEY, this.settings);
  }

  setAll(value: any) {
    return this.storage.set(this.SETTINGS_KEY, value);
  }

  getValue(key: string) {
    return this.storage.get(this.SETTINGS_KEY).then((settings) => {
      return settings[key];
    });
  }

  save() {
    return this.setAll(this.settings);
  }

  get allSettings() {
    return this.settings;
  }
}
