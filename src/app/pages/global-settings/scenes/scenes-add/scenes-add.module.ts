import { NgModule } from '@angular/core';
import { IonicPageModule } from '@ionic/angular';
import { ScenesAddPage } from './scenes-add';
import { ComponentsModule } from '../../../../components/components.module';
import { TranslateModule } from '@ngx-translate/core';
import { NodeEndpointsOutputPipe } from './node-endpoints-output.pipe';

@NgModule({
  declarations: [
    ScenesAddPage,
    NodeEndpointsOutputPipe,
  ],
  imports: [
    IonicPageModule.forChild(ScenesAddPage),
    ComponentsModule,
    TranslateModule.forChild()
  ],
})
export class ScenesAddPageModule {}
