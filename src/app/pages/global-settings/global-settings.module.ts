import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { GlobalSettingsPage } from './global-settings';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../components/components.module';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { DEVICE_TOKEN } from '../../providers/device/device.service';

@NgModule({
  declarations: [
    GlobalSettingsPage,
  ],
  imports: [
    ComponentsModule,
    IonicModule,
    TranslateModule.forChild(),
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: GlobalSettingsPage
      }
    ])
  ],
  providers: [
    { provide: DEVICE_TOKEN, useClass: Device }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GlobalSettingsPageModule { }
