import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DeviceDetailPage } from './device-detail';

const routes: Routes = [
  {
    path: '',
    component: DeviceDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DeviceDetailPageRoutingModule {}
