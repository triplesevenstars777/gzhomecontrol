import { NgModule } from '@angular/core';
import { IonicPageModule } from '@ionic/angular';
import { DeviceSmokePage } from './device-smoke';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    DeviceSmokePage,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(DeviceSmokePage),
  ],
  exports: [
    DeviceSmokePage
  ]
})
export class DeviceSmokePageModule { }
