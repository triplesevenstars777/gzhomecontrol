import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DeviceDetailPage } from './device-detail';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../components/components.module';
import { DeviceDetailPageRoutingModule } from './device-detail-routing.module';

@NgModule({
  declarations: [
    DeviceDetailPage,
  ],
  imports: [
    CommonModule,
    IonicModule,
    ComponentsModule,
    DeviceDetailPageRoutingModule,
    TranslateModule.forChild()
  ]
})
export class DeviceDetailPageModule {}
