import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { TransportsPage } from "./transports";
import { ComponentsModule } from "../../components/components.module";
import { TranslateModule } from "@ngx-translate/core";
import { RouterModule } from "@angular/router";

@NgModule({
  declarations: [TransportsPage],
  imports: [
    CommonModule,
    IonicModule,
    ComponentsModule,
    TranslateModule.forChild(),
    RouterModule.forChild([
      {
        path: '',
        component: TransportsPage
      }
    ])
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TransportsPageModule {}
