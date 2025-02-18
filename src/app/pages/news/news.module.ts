import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NewsPage } from './news';
import { ComponentsModule } from '../../components/components.module';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    NewsPage,
  ],
  imports: [
    CommonModule,
    IonicModule,
    ComponentsModule,
    TranslateModule.forChild(),
    RouterModule.forChild([
      {
        path: '',
        component: NewsPage
      }
    ])
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class NewsPageModule { }
