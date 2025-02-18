import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { DeviceTempGraphsPage } from './devices-temp-graphs';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../../../components/components.module';
import { FormsModule } from '@angular/forms';

const routes: Routes = [
  {
    path: '',
    component: DeviceTempGraphsPage
  }
];

@NgModule({
  declarations: [
    DeviceTempGraphsPage
  ],
  imports: [
    ComponentsModule,
    IonicModule,
    RouterModule.forChild(routes),
    TranslateModule.forChild(),
    FormsModule
  ],
  exports: [
    DeviceTempGraphsPage
  ]
})
export class DeviceTempGraphsPageModule {}
