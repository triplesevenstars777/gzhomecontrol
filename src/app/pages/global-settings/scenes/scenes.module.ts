import { NgModule } from '@angular/core';
import { IonicPageModule } from '@ionic/angular';
import { ScenesPage } from './scenes';
import { ComponentsModule } from '../../../components/components.module';
import { TranslateModule } from '@ngx-translate/core'

@NgModule({
  declarations: [
    ScenesPage,
  ],
  imports: [
    IonicPageModule.forChild(ScenesPage),
    ComponentsModule,
    TranslateModule.forChild()
  ],
})
export class ScenesPageModule {}
