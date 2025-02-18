import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Geolocation } from "@awesome-cordova-plugins/geolocation/ngx";
import { TranslateService } from "@ngx-translate/core";

import { Platform } from "@ionic/angular";
import { Observable } from "rxjs";

import { BuildingService } from "./../api/building.service";
import { UserStorage } from "../user/user-storage";

@Injectable({
  providedIn: 'root'
})
export class WeatherProvider {
  private weatherApiURl: string =
    "https://api.openweathermap.org/data/2.5/weather?";
  private forecastApiURl: string =
    "https://api.openweathermap.org/data/2.5/forecast/daily?";
  private lat: any = "47.4511846";
  private lng: any = "8.5796954";
  private applang: any = "en";
  private appid: any = "87be36d2471b99a1571e63d0233dff4c";
  private storageUser: any;
  private params: any;

  constructor(
    public http: HttpClient,
    private translate: TranslateService,
    private buildingService: BuildingService,
    private geolocation: Geolocation,
    private platform: Platform,
    private userStorage: UserStorage
  ) {
    this.applang = this.translate.getBrowserLang();
    this.platform.ready().then(() => {
      const options = { timeout: 20000 };
      this.geolocation
        .getCurrentPosition(options)
        .then((resp) => {
          this.lat = resp.coords.latitude;
          this.lng = resp.coords.longitude;
        })
        .catch((error) => {
          console.log("Error getting location", error);
        });
    });
  }

  getCoordinates() {
    return new Observable((subscriber) => {
      const userToken = this.userStorage.USER_TOKEN || "";
      if (userToken) {
        this.storageUser = JSON.parse(userToken);
      }


      // TODO: Cambiar a show() cuando se actualicen los permisos
      this.buildingService.showAll().subscribe({
        next: (res: any) => {
          if (res.docs.length) {
            this.setCoordinates(res.docs[0].location.coordinates);
          } else {
            this.setCoordinates([this.lat, this.lng]);
          }
          subscriber.next(200);
          subscriber.complete();
        },
        error: (err) => {
          console.log("error", err);
          subscriber.error(err);
        }
      }
      );
    });
  }

  setCoordinates(coordinates) {
    this.params =
      "lat=" +
      coordinates[0].toString() +
      "&lon=" +
      coordinates[1].toString() +
      "&lang=" +
      this.applang +
      "&appid=" +
      this.appid +
      "&units=metric";
  }
  getWeather() {
    return this.http.get(this.weatherApiURl + this.params);
  }

  getForecast() {
    return this.http.get(this.forecastApiURl + this.params);
  }
}
