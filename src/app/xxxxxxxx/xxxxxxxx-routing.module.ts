import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { XxxxxxxxPage } from './xxxxxxxx.page';

const routes: Routes = [
  {
    path: '',
    component: XxxxxxxxPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class XxxxxxxxPageRoutingModule {}
