import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { DevicesMailboxPage } from "./devices-mailbox";
import { ComponentsModule } from "../../components/components.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [DevicesMailboxPage],
  imports: [
    CommonModule,
    ComponentsModule,
    IonicModule,
    TranslateModule.forChild()
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DevicesMailboxPageModule {}
