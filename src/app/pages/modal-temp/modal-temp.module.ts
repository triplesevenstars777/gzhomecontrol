import { NgModule } from '@angular/core';
import { IonicPageModule } from '@ionic/angular';
import { ModalTempPage } from './modal-temp';

@NgModule({
  declarations: [
    ModalTempPage,
  ],
  imports: [
    IonicPageModule.forChild(ModalTempPage)
  ],
})
export class ModalTempPageModule { }
