import { NgModule } from '@angular/core';
import { IonicPageModule } from '@ionic/angular';
import { DevicePanicPage } from './device-panic';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    DevicePanicPage,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(DevicePanicPage),
  ],
  exports: [
    DevicePanicPage
  ]
})
export class DevicePanicPageModule { }
