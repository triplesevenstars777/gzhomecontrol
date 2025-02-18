import { NgModule } from '@angular/core';
import { IonicPageModule } from '@ionic/angular';
import { DeviceTempGraphsPage } from './devices-temp-graphs';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../../../components/components.module';

@NgModule({
  declarations: [
    DeviceTempGraphsPage
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(DeviceTempGraphsPage),
    TranslateModule.forChild()
  ],
  exports: [
    DeviceTempGraphsPage
  ]
})
export class DeviceTempGraphsPageModule {}
