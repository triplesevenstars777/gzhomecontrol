import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DevicesHeaterPage } from './devices-heater';
import { ComponentsModule } from '../../components/components.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    DevicesHeaterPage,
  ],
  imports: [
    CommonModule,
    IonicModule,
    ComponentsModule,
    TranslateModule.forChild()
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DevicesHeaterPageModule { }
