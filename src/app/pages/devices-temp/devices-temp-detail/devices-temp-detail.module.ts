import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { DeviceTempDetailPage } from './devices-temp-detail';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../../components/components.module';
import { TransformEndpointValues } from '../../../../shared/pipes/transformEndpointValues.pipe';
import { NodeService } from '../../../providers/api/node.service';
import { SocketService } from '../../../providers';

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
    FormsModule,
    ComponentsModule,
    IonicModule,
    RouterModule.forChild(routes),
    TranslateModule.forChild(),
    TransformEndpointValues // Import the standalone pipe
  ],
  exports: [
    DeviceTempDetailPage
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    NodeService,
    SocketService
  ]
})
export class DeviceTempDetailPageModule {}
