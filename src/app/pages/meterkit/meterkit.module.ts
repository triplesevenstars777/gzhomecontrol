import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MeterkitPage } from './meterkit';
import { ComponentsModule } from '../../components/components.module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    MeterkitPage,
  ],
  imports: [
    CommonModule,
    IonicModule,
    ComponentsModule,
    RouterModule.forChild([
      {
        path: '',
        component: MeterkitPage
      }
    ])
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MeterkitPageModule {}
