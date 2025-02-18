import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { DeviceTempDetailPage } from './devices-temp-detail';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ComponentsModule } from '../../../components/components.module';

const routes: Routes = [
  {
    path: '',
    component: DeviceTempDetailPage
  }
];

@NgModule({
  declarations: [
    DeviceTempDetailPage
  ],
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    RouterModule.forChild(routes),
    SharedModule,
    ComponentsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DeviceTempDetailPageModule {}
