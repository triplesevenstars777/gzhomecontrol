import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ModalMenuPage } from './modal-menu';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    ModalMenuPage
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule,
    TranslateModule.forChild()
  ],
  exports: [
    ModalMenuPage
  ]
})
export class ModalMenuPageModule { }
