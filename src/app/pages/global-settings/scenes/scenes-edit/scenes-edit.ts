import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
  NavController,
  LoadingController,
  IonicModule
} from "@ionic/angular";
import { ActivatedRoute } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { Observable, BehaviorSubject, zip } from "rxjs";
import { PipesModule } from "../../../../shared/pipes/pipes.module";
import { Constants } from "../../../../providers";
import { AuthService } from "../../../../providers/api/auth.service";
import { NodeAvailabilityProvider } from "../../../../providers/node-availability/node-availability";
import { ScenesService } from "../../../../providers/api/scenes.service";
import { Scene } from "../../../../models/scene.model";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

@Component({
  selector: "page-scenes-edit",
  templateUrl: "scenes-edit.html",
  styleUrl: './scenes-edit.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule,
    PipesModule
  ]
})
export class ScenesEditPage implements OnInit {
  public sceneModel: Scene = {} as Scene;
  public scene: any = {
    devices: [],
  };
  public localNodes: any;
  public lightNodes: any[] = [];
  public blindNodes: any[] = [];
  public awningNodes: any[] = [];
  public climaNodes: any[] = [];
  public userID: any;
  public validation_messages: any;
  public form: FormGroup;
  private ID: string = '';
  private isSceneLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    private availability: NodeAvailabilityProvider,
    public loadingCtrl: LoadingController,
    public navCtrl: NavController,
    private auth: AuthService,
    public formBuilder: FormBuilder,
    private scenesService: ScenesService,
    private route: ActivatedRoute
  ) {
    this.form = this.formBuilder.group({
      name: ["", Validators.required],
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.ID = params['id'];
        this.getScene();
      }
    });
  }

  async initializeScene() {
    const loader = await this.loadingCtrl.create({
      message: "Loading devices...",
      backdropDismiss: false
    });
    await loader.present();

    if (this.auth.getAuthUser()) {
      this.userID = this.auth.getAuthUser()._id;
    }

    this.isSceneLoaded.subscribe(async (loaded) => {
      if (loaded) {
        try {
          const result = await zip(
            this.availability.getSpecificNodes("light"),
            this.availability.getSpecificNodes("blind"),
            this.availability.getSpecificNodes("awning"),
            this.availability.getSpecificNodes("clima")
          ).toPromise() as [any[], any[], any[], any[]];

          const [lights, blinds, awnings, clima] = result;

          lights.forEach(node => {
            node.scheme.endpoints = node.scheme.endpoints.filter(endpoint => endpoint.type === 'stateful');
          });
          blinds.forEach(node => {
            node.scheme.endpoints = node.scheme.endpoints.filter(endpoint => endpoint.type === 'stateful');
          });
          awnings.forEach(node => {
            node.scheme.endpoints = node.scheme.endpoints.filter(endpoint => endpoint.type === 'stateful');
          });
          clima.forEach(node => {
            node.scheme.endpoints = node.scheme.endpoints.filter(endpoint => endpoint.type === 'stateful');
          });

          this.scene.devices = this.loadCurrentNodes(this.scene.devices);
          this.localNodes = this.scene.devices;
          this.lightNodes = lights;
          this.blindNodes = blinds;
          this.awningNodes = awnings;
          this.climaNodes = clima;
          
          await loader.dismiss();
        } catch (err) {
          await loader.dismiss();
          console.error("Error loading nodes:", err);
        }
      }
    });
  }

  getScene() {
    if (this.ID) {
      this.scenesService.show(this.ID).subscribe(
        (res) => {
          this.scene = res;
          delete this.scene._id;
          delete this.scene.created_at;
          this.isSceneLoaded.next(true);
          this.initializeScene();
        },
        (err) => {
          console.error("Edit error:", err);
        }
      );
    }
  }

  loadCurrentNodes(nodes: any[]) {
    const actualNodes = {};

    nodes.forEach((node) => {
      actualNodes[node.id] = {
        id: node.id,
        available: node.available,
        active: node.active,
        endpoints: node.endpoints,
      };
    });
    return actualNodes;
  }

  changeState(deviceId: string, endpointId: string, active: boolean, onlyOne = false) {
    if (this.scene.devices[deviceId]) {
      for (let i = 0; i < this.scene.devices[deviceId].endpoints.length; i++) {
        if (this.scene.devices[deviceId].endpoints[i].id === endpointId) {
          this.scene.devices[deviceId].endpoints[i].defaultState = active;
          this.scene.devices[deviceId].endpoints[i].value = active 
            ? this.scene.devices[deviceId].endpoints[i].stateOn
            : this.scene.devices[deviceId].endpoints[i].stateOff;
        } else if (onlyOne && active) {
          this.scene.devices[deviceId].endpoints[i].defaultState = false;
          this.scene.devices[deviceId].endpoints[i].value = this.scene.devices[deviceId].endpoints[i].stateOff;
        }
      }
    }
  }

  changeAvailability(deviceId: string, available: boolean) {
    if (this.scene.devices[deviceId]) {
      this.scene.devices[deviceId].available = available;
      this.scene.devices[deviceId].endpoints.forEach(endpoint => {
        endpoint.defaultState = false;
        endpoint.value = endpoint.stateOff;
      });
    }
  }

  async update() {
    if (this.form.valid) {
      const name = this.form.get('name')?.value;
      delete this.scene._id;
      this.scene.name = name;
      this._setDevices(this.scene.devices);
      
      try {
        await this.scenesService.update(this.ID, this.scene).toPromise();
        await this.navCtrl.navigateRoot('/global-settings');
        await this.navCtrl.navigateForward('/scenes');
      } catch (err) {
        console.error("Update error:", err);
      }
    }
  }

  private _setDevices(devices: any) {
    const auxDevices = Object.values(devices);
    this.scene.devices = auxDevices;
  }
}
