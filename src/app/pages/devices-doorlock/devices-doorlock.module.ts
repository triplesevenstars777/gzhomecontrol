import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { DevicesDoorlockPage } from "./devices-doorlock";
import { ComponentsModule } from "../../components/components.module";
import { TranslateModule } from "@ngx-translate/core";
import { RouterModule, Routes } from "@angular/router";

const routes: Routes = [
  {
    path: '',
    component: DevicesDoorlockPage
  }
];

@NgModule({
  declarations: [DevicesDoorlockPage],
  imports: [
    CommonModule,
    IonicModule,
    ComponentsModule,
    TranslateModule.forChild(),
    RouterModule.forChild(routes)
  ]
})
export class DevicesDoorlockPageModule {}
