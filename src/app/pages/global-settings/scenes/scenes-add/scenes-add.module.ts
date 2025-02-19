import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { ScenesAddPage } from './scenes-add';
import { ComponentsModule } from '../../../../components/components.module';
import { TranslateModule } from '@ngx-translate/core';
import { NodeEndpointsOutputPipe } from './node-endpoints-output.pipe';

const routes: Routes = [
  {
    path: '',
    component: ScenesAddPage
  }
];

@NgModule({
  declarations: [
    ScenesAddPage,
    NodeEndpointsOutputPipe,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ComponentsModule,
    TranslateModule.forChild(),
    RouterModule.forChild(routes)
  ]
})
export class ScenesAddPageModule {}
