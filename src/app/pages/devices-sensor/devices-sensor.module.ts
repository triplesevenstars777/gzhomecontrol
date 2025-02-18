import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DevicesSensorPage } from './devices-sensor';
import { ComponentsModule } from '../../components/components.module';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    DevicesSensorPage,
  ],
  imports: [
    CommonModule,
    IonicModule,
    ComponentsModule,
    TranslateModule.forChild(),
    RouterModule.forChild([
      {
        path: '',
        component: DevicesSensorPage
      }
    ])
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DevicesSensorPageModule { }
