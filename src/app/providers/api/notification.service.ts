import { Injectable, Inject, InjectionToken } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { LocalNotifications } from "@awesome-cordova-plugins/local-notifications";
import * as moment from "moment";
import {sprintf} from "sprintf-js";

export const LOCALNOTIFICATIONS_TOKEN_FOR_SERVICE = new InjectionToken<typeof LocalNotifications>('localnotifications.token');

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private fillValue:any = null;
  constructor(
    private translate: TranslateService,
    @Inject(LOCALNOTIFICATIONS_TOKEN_FOR_SERVICE)private localNotifications: typeof LocalNotifications,
  ) {}

  public setFillValue(value)
  {
    this.fillValue = value;
  }

  public sendNotification(message: string) {
    this.translate.get(message).subscribe(translation => {
      if(this.fillValue)
      {
        translation = sprintf(translation, this.fillValue);
      }
      this.localNotifications.schedule({
        id: moment().unix(),
        text: translation,
        sound: undefined,
        icon: 'res://icon',
        smallIcon: 'res://warning'
      });
    });
  }
}
