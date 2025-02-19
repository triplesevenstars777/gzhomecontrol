import { Component, OnInit, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NavController, LoadingController } from '@ionic/angular';
import { zip } from 'rxjs';
import { Router } from "@angular/router";
import { AuthService } from '../../../../providers/api/auth.service';
import { NodeAvailabilityProvider } from '../../../../providers/node-availability/node-availability';
import { ScenesService } from '../../../../providers/api/scenes.service';
import { Scene } from '../../../../models/scene.model';

interface Endpoint {
  id: string;
  stateOn: string;
  stateOff: string;
  defaultState: string;
  value: string;
}

interface Device {
  id: string;
  active: boolean;
  available: boolean;
  endpoints: Endpoint[];
}

interface DevicesMap {
  [key: string]: Device;
}

@Component({
  selector: 'page-scenes-add',
  styleUrls: ['./scenes-add.scss'],
  templateUrl: 'scenes-add.html',
  standalone: false
})
export class ScenesAddPage implements OnInit {
  @ViewChild(IonContent) content: IonContent;
  isButtonVisible = false;

  public sceneModel: Scene;
  public scene: Scene;
  public currentNodes: any[] = [];
  public localNodes: DevicesMap;
  public lightNodes: any[] = [];
  public blindNodes: any[] = [];
  public awningNodes: any[] = [];
  public climaNodes: any[] = [];
  private userID: string;
  public validation_messages: any;
  public form: FormGroup;
  private devicesMap: DevicesMap = {};

  constructor(
    private availability: NodeAvailabilityProvider,
    public loadingCtrl: LoadingController,
    public navCtrl: NavController,
    private auth: AuthService,
    public formBuilder: FormBuilder,
    private scenesService: ScenesService,
    private router: Router) {
    
      this.form = this.formBuilder.group({
        name: [''] 
      });
  }

  async ngOnInit() {
    const loader = await this.loadingCtrl.create({
      message: "Loading devices...",
      backdropDismiss: false
    });
    await loader.present();

    if(this.auth.getAuthUser()) {
      this.userID = this.auth.getAuthUser()._id;
    }

    this.scene = {
      name: '',
      user: this.userID,
      active: false,
      devices: []
    };

    zip(
      this.availability.getSpecificNodes('light'),
      this.availability.getSpecificNodes('blind'), 
      this.availability.getSpecificNodes('awning'),
      this.availability.getSpecificNodes('clima')
    ).subscribe(async ([lights, blinds, awnings, clima]) => {
      lights.forEach(node => {
        node.scheme.endpoints = node.scheme.endpoints.filter(endpoint => endpoint.type === 'stateful')
      });
      blinds.forEach(node => {
        node.scheme.endpoints = node.scheme.endpoints.filter(endpoint => endpoint.type === 'stateful')
      });
      awnings.forEach(node => {
        node.scheme.endpoints = node.scheme.endpoints.filter(endpoint => endpoint.type === 'stateful')
      });
      clima.forEach(node => {
        node.scheme.endpoints = node.scheme.endpoints.filter(endpoint => endpoint.type === 'stateful')
      });

      this.currentNodes = [...lights, ...blinds, ...awnings, ...clima];
      this.devicesMap = this.loadCurrentNodes(this.currentNodes);
      this.localNodes = this.devicesMap;
      this.scene.devices = this._mapToArray(this.devicesMap);
      this.lightNodes = lights;
      this.blindNodes = blinds;
      this.awningNodes = awnings;
      this.climaNodes = clima;
      await loader.dismiss();
    }, async err => {
      await loader.dismiss();
      console.log('error', err);
    });
  }

  loadCurrentNodes(nodes: any[]): DevicesMap {
    const actualNodes:any = [];

    for (let i = 0; i < nodes.length; i++) {
      let nodeId = nodes[i]._id;
      actualNodes[nodeId] = {
        id: nodeId,
        availability: false,
        active: false,
        endpoints: []
      };
      const endpoints = nodes[i].scheme.endpoints.filter(item => item.dir !== 'input');

      for (let j = 0; j < endpoints.length; j++) {
        actualNodes[nodeId].endpoints[j] = {
          id: endpoints[j]._id,
          name: endpoints[j].name,
          stateOn: "On",
          stateOff: "Off",
          defaultState: false,
          value: "Off"
        };
      }
    }

    return actualNodes;
  }

  changeState(deviceId: string, endpointId: string, active: boolean, onlyOne = false) {
    if (this.devicesMap[deviceId]) {
      for (let i = 0; i < this.devicesMap[deviceId].endpoints.length; i++) {
        if (this.devicesMap[deviceId].endpoints[i].id === endpointId) {
          this.devicesMap[deviceId].endpoints[i].defaultState = active ? "On" : "Off";
          this.devicesMap[deviceId].endpoints[i].value = active ? 
            this.devicesMap[deviceId].endpoints[i].stateOn : 
            this.devicesMap[deviceId].endpoints[i].stateOff;
        } else if (onlyOne && active) {
          this.devicesMap[deviceId].endpoints[i].defaultState = "Off";
          this.devicesMap[deviceId].endpoints[i].value = this.devicesMap[deviceId].endpoints[i].stateOff;
        }
      }
      this.scene.devices = this._mapToArray(this.devicesMap);
    }
  }

  changeAvailability(deviceId: string, available: boolean) {
    if (this.devicesMap[deviceId]) {
      this.devicesMap[deviceId].available = available;
      for (let i = 0; i < this.devicesMap[deviceId].endpoints.length; i++) {
        this.devicesMap[deviceId].endpoints[i].defaultState = "Off";
        this.devicesMap[deviceId].endpoints[i].value = this.devicesMap[deviceId].endpoints[i].stateOff;
      }
      this.scene.devices = this._mapToArray(this.devicesMap);
    }
  }

  get isSaveButtonDisabled() {
    return this.form.get('name')?.value.trim() === '';
  }

  async save() {
    const name = this.form.get('name')?.value || 'New Scene'; // Provide default name if empty
    this.scene.name = name;
    
    const temp = {
      ...this.scene,

    }

    this.scenesService.create(this.scene).subscribe(async (res) => {
      this.router.navigate(["global-settings/scenes"], {replaceUrl: true});
    }, (err) => {
      console.error('Created error:::', err);
    });
  }

  private _mapToArray(devicesMap: DevicesMap): Device[] {
    return Object.values(devicesMap);
  }

  onScroll(event) {
    this.isButtonVisible = event.detail.scrollTop > 100;
  }
}
