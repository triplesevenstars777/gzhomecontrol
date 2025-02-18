import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Storage } from "@ionic/storage";
import { AppComponent } from './app.component';
import { ComponentsModule } from './components/components.module';
import { ModalMenuPageModule } from './pages/modal-menu/modal-menu.module';
import { AppRoutingModule } from './app-routing.module';
import { DeviceService, DEVICE_TOKEN } from './providers/device/device.service';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { NativeAudio } from '@awesome-cordova-plugins/native-audio/ngx';
import { BackgroundMode } from '@awesome-cordova-plugins/background-mode/ngx';
import { Insomnia } from '@awesome-cordova-plugins/insomnia/ngx';
import { LocalNotifications } from '@awesome-cordova-plugins/local-notifications/ngx';
import { ApiNew } from './providers/api/api-new';
import { NativeServices } from './providers/native-services';
import { Geolocation } from "@awesome-cordova-plugins/geolocation/ngx";
import { SETTINGS_DEFAULTS, Settings } from './providers/settings/settings';
import { 
  BACKGROUNDMODE_TOKEN,
  INSOMNIA_TOKEN,
  LOCALNOTIFICATIONS_TOKEN,
  NATIVEAUDIO_TOKEN
} from './providers/door-bell/door-bell';
import { LOCALNOTIFICATIONS_TOKEN_FOR_SERVICE } from './providers/api/notification.service';
import {
  HttpClient,
  HTTP_INTERCEPTORS,
} from "@angular/common/http";
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { CACHESERVICE_TOKEN, NodeAvailabilityProvider } from './providers/node-availability/node-availability';
import { CacheModule, CacheService } from 'ionic-cache';


export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

export function provideSettings(storage: Storage, translate: TranslateService) {
  return new Settings(storage, {
    option1: true,
    option2: "Ionitron J. Framework",
    option3: "3",
    option4: "Hello",
  });
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    IonicStorageModule.forRoot(),
    CacheModule.forRoot({ keyPrefix: 'gzhomecontrol-cache' }),
    ComponentsModule,
    ModalMenuPageModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [
    { provide: DEVICE_TOKEN, useClass: Device },
    CacheService,
    { provide: CACHESERVICE_TOKEN, useExisting: CacheService },
    NodeAvailabilityProvider,
    DeviceService,
    ApiNew,
    { provide: SETTINGS_DEFAULTS, useValue: { /* default settings here */ } },
    Network,
    NativeAudio,
    BackgroundMode,
    Insomnia,
    Geolocation,
    NativeServices,
    { 
      provide: NATIVEAUDIO_TOKEN, 
      deps: [NativeServices],
      useFactory: (services: NativeServices) => services.getNativeAudio()
    },
    { 
      provide: BACKGROUNDMODE_TOKEN, 
      deps: [NativeServices],
      useFactory: (services: NativeServices) => services.getBackgroundMode()
    },
    { 
      provide: INSOMNIA_TOKEN, 
      deps: [NativeServices],
      useFactory: (services: NativeServices) => services.getInsomnia()
    },
    { 
      provide: LOCALNOTIFICATIONS_TOKEN, 
      deps: [NativeServices],
      useFactory: (services: NativeServices) => services.getLocalNotifications()
    },
    { 
      provide: LOCALNOTIFICATIONS_TOKEN_FOR_SERVICE, 
      deps: [NativeServices],
      useFactory: (services: NativeServices) => services.getLocalNotifications()
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
