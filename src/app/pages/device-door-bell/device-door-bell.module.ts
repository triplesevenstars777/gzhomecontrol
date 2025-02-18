import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DeviceDoorBellPage } from './device-door-bell';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    DeviceDoorBellPage,
  ],
  imports: [
    ComponentsModule,
    IonicModule, // Corrected here
  ],
  exports: [
    DeviceDoorBellPage
  ]
})
export class DeviceDoorBellPageModule { }
