import { WeatherProvider } from "./../providers/weather/weather";
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ModalMenuPageModule } from "../pages/modal-menu/modal-menu.module";
import { NodeActuatorComponent } from "./node-actuator/node-actuator";
import { ActuatorBlindComponent } from "./node-actuator/actuator-blind/actuator-blind";
import { ActuatorSensorComponent } from "./node-actuator/actuator-sensor/actuator-sensor";
import { ActuatorSmartlightSwitchComponent } from "./node-actuator/actuator-smartlight-switch/actuator-smartlight-switch";
import { BrightnessActuatorComponent } from "./node-actuator/actuators/brightness-actuator/brightness-actuator";
import { DimmerActuatorComponent } from "./node-actuator/actuators/dimmer-actuator/dimmer-actuator";
import { FanActuatorComponent } from "./node-actuator/actuators/fan-actuator/fan-actuator";
import { FanSpeedActuatorComponent } from "./node-actuator/actuators/fan-speed-actuator/fan-speed-actuator";
import { ActuatorSmartClimateComponent } from "./node-actuator/actuator-smart-climate/actuator-smart-climate";
import { SwitchActuatorComponent } from "./node-actuator/actuators/switch-actuator/switch-actuator";
import { NodeActuatorAutoComponent } from "./node-actuator/node-actuator-auto/node-actuator-auto";
import { DoorSensorComponent } from "./node-actuator/sensors/door-sensor/door-sensor";
import { MovementSensorComponent } from "./node-actuator/sensors/movement-sensor/movement-sensor";
import { RemoteSensorComponent } from "./node-actuator/sensors/remote-sensor/remote-sensor";
import { TemperatureActuatorComponent } from "./node-actuator/actuators/temperature-actuator/temperature-actuator";
import { TemperatureModeActuatorComponent } from "./node-actuator/actuators/temperature-mode-actuator/temperature-mode-actuator";
import { ButtonGroupAutoComponent } from "./node-actuator/actuators/button-group-auto/button-group-auto";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { FabMenuComponent } from "./fab-menu/fab-menu";
import { MainHeaderComponent } from "./main-header/main-header";
import { MainFooterComponent } from "./main-footer/main-footer";
import { CustomSwitchComponent } from "./custom-switch/custom-switch";
import { DoorBellComponent } from "./door-bell/door-bell";
import { PanicComponent } from "./panic/panic";
import { OfflineComponent } from "./offline/offline";
import { UnknowFailureComponent } from "./unknow-failure/unknow-failure";
import { TranslateModule } from "@ngx-translate/core";
import { GlobalTogglesComponent } from "./global-toggles/global-toggles";
import { SmokeComponent } from "./smoke/smoke";
import { ActuatorSmart4ChannelComponent } from "./node-actuator/actuator-smart-4-channel/actuator-smart-4-channel";
import { ScenesComponent } from "./scenes/scenes";
import { CustomButtonComponent } from "./custom-button/custom-button";

@NgModule({
  declarations: [
    ActuatorBlindComponent,
    ActuatorSensorComponent,
    ActuatorSmartClimateComponent,
    ActuatorSmartlightSwitchComponent,
    BrightnessActuatorComponent,
    ActuatorSmart4ChannelComponent,
    DimmerActuatorComponent,
    FanActuatorComponent,
    FanSpeedActuatorComponent,
    SwitchActuatorComponent,
    NodeActuatorAutoComponent,
    NodeActuatorComponent,
    DoorSensorComponent,
    MovementSensorComponent,
    RemoteSensorComponent,
    FabMenuComponent,
    MainHeaderComponent,
    MainFooterComponent,
    CustomSwitchComponent,
    CustomButtonComponent,
    DoorBellComponent,
    PanicComponent,
    OfflineComponent,
    UnknowFailureComponent,
    GlobalTogglesComponent,
    SmokeComponent,
    TemperatureActuatorComponent,
    TemperatureModeActuatorComponent,
    ScenesComponent,
    ButtonGroupAutoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule.forChild(),
    ModalMenuPageModule
  ],
  exports: [
    NodeActuatorComponent,
    FabMenuComponent,
    MainHeaderComponent,
    MainFooterComponent,
    DoorBellComponent,
    PanicComponent,
    OfflineComponent,
    UnknowFailureComponent,
    GlobalTogglesComponent,
    SmokeComponent,
    ScenesComponent
  ],
  providers: [],

  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ComponentsModule {}
