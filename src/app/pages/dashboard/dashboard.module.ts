import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DashboardPage } from './dashboard.page';
import { ComponentsModule } from '../../components/components.module';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NewsProvider } from "../../providers/news/news";
import { WeatherProvider } from "../../providers/weather/weather";
import { TransportsProvider } from "../../providers/transports/transports";
import { Settings } from "../../providers";
import { DoorBellProvider } from "../../providers/door-bell/door-bell";
import { AuthService } from "../../providers/api/auth.service";
import { UserStorage } from '../../providers/user/user-storage';
import { Geolocation } from "@awesome-cordova-plugins/geolocation/ngx";

const routes: Routes = [
  {
    path: '',
    component: DashboardPage
  }
];

@NgModule({
  declarations: [
    DashboardPage
  ],
  imports: [
    CommonModule,
    ComponentsModule,
    IonicModule,
    TranslateModule.forChild(),
    RouterModule.forChild(routes)
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    NewsProvider,
    WeatherProvider,
    TransportsProvider,
    Settings,
    DoorBellProvider,
    AuthService,
    UserStorage,
    Geolocation
  ]
})
export class DashboardPageModule { }
