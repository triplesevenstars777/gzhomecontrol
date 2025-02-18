import { Component, OnInit, OnDestroy, ViewEncapsulation } from "@angular/core";
import { NavController, ModalController } from "@ionic/angular";
import { Observable, interval } from "rxjs";
import * as moment from "moment";
import mqtt from "mqtt";
import { Network } from "@awesome-cordova-plugins/network/ngx";
import { Router } from "@angular/router";

import { AuthService } from "../../providers/api/auth.service";
import { NewsProvider } from "../../providers/news/news";
import { WeatherProvider } from "../../providers/weather/weather";
import { WEATHER_ICONS } from "../../providers/weather/weather.enum";
import { TransportsProvider } from "../../providers/transports/transports";
import { Settings } from "../../providers";
import { DoorBellProvider } from "../../providers/door-bell/door-bell";
import { environment } from "../../../environments/environment";
import { UserStorage } from '../../providers/user/user-storage';

interface ForecastItem {
  day: string;
  icon: string;
  max: number;
  min: number;
}

@Component({
  selector: "page-dashboard",
  templateUrl: "dashboard.page.html",
  styleUrls: ["./dashboard.page.scss"],
  encapsulation: ViewEncapsulation.None,
  standalone: false
})
export class DashboardPage implements OnInit, OnDestroy {
  private connectSubscription$: any;
  private disconnectSubscription$: any;
  private forecastSubscription$: any;
  private forecastSubscriptionInterval: number = 60 * 60 * 1000;

  public forecast: ForecastItem[] = [];
  public WEATHER_ICONS: any = WEATHER_ICONS;
  public newsObj: any[] = [];
  public transportsObj: any[] = [];
  private userID: string = '';

  constructor(
    public modalCtrl: ModalController,
    public navCtrl: NavController,
    public weather: WeatherProvider,
    private auth: AuthService,
    private network: Network,
    private news: NewsProvider,
    private transports: TransportsProvider,
    public settings: Settings,
    private doorBellProvider: DoorBellProvider,
    private userStorage: UserStorage,
    private router: Router
  ) {
    if (this.auth.getAuthUser()) {
      this.userID = this.auth.getAuthUser()._id;
    }

    this.disconnectSubscription$ = this.network.onDisconnect().subscribe(() => {
      if (this.forecastSubscription$) {
        this.forecastSubscription$.unsubscribe();
      }
    });

    this.connectSubscription$ = this.network.onConnect().subscribe(() => {
      // Wait a bit to be sure connection has restablished
      setTimeout(() => {
        if (this.network.type === "ethernet") {
          this.forecastSubscription$ = interval(
            this.forecastSubscriptionInterval
          ).subscribe(() => {
            this.updateForecast();
          });
        }
      }, 3000);
    });
  }

  ionViewDidEnter() {
    this.getNews(this.userID, 3);
    this.getTransports(this.userID, 3);
  }

  ngOnInit() {
    this.updateForecast();
    this.forecastSubscription$ = interval(
      this.forecastSubscriptionInterval
    ).subscribe(() => {
      this.updateForecast();
    });
  }

  getNews(id: string, limit: number) {
    this.news.getNewsByID(id, limit).subscribe((data: any) => {
      if (!data.error) {
        this.newsObj = data;
      }
    });
  }

  getTransports(id: string, limit: number) {
    this.transports.getTransportsByID(id, limit).subscribe((data: any) => {
      if (!data.error) {
        this.transportsObj = data;
      }
    });
  }

  updateForecast() {
    this.weather.getCoordinates().subscribe((res: any) => {
      this.weather.getForecast().subscribe((data: any) => {
        if (data && data.list) {
          const arrayTemp: ForecastItem[] = [];
          for (let i = 1; i < 5; i++) {
            const item = data.list[i];
            if (item) {
              arrayTemp.push({
                day: moment.unix(item.dt).format("dddd"),
                icon: item.weather[0].icon,
                max: Math.round(item.temp.max),
                min: Math.round(item.temp.min),
              });
            }
          }
          this.forecast = arrayTemp;
        }
      });
    });
  }

  ionViewDidLoad() {
    this.mqttActivate();
  }

  goNews(PIDnumber: any) {
    this.router.navigate(['/news'], { queryParams: { PID: PIDnumber } });
  }

  goTransports(PIDnumber: any) {
    this.router.navigate(['/transports'], { queryParams: { PID: PIDnumber } });
  }

  mqttActivate() {
    this.doorBellProvider.storeDoorBellTopic();
    this.settings.doorbellTopic().subscribe((topic) => {
      if (topic !== null && topic !== undefined) {
        if (!this.userStorage.IOT_HUB) {
          this.userStorage.IOT_HUB = 'gzih.gozmart.ch';
        }
        const options = {
          host: environment.production
            ? this.userStorage.IOT_HUB
            : "gzih-dev.gozmart.ch",
          port: 9001,
          reconnectPeriod: 1000,
        };
        const client = mqtt.connect(options);

        client.on("connect", function () {
          client.subscribe(topic, function (err) {
            if (err) {
              console.log(err);
            }
          });
        });

        const doorbell = this.doorBellProvider;

        client.on("message", function (topic, message) {
          if (message.toString() === "1") {
            doorbell.activateDoorBell();
          }
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.forecastSubscription$) {
      this.forecastSubscription$.unsubscribe();
    }
    if (this.connectSubscription$) {
      this.connectSubscription$.unsubscribe();
    }
    if (this.disconnectSubscription$) {
      this.disconnectSubscription$.unsubscribe();
    }
  }
}
