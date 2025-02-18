import { Component } from '@angular/core';
import {FormGroup,FormBuilder,Validators} from '@angular/forms';
import { IonicPage, NavController, NavParams, LoadingController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../providers/api/auth.service';
import { NodeAvailabilityProvider } from '../../../../providers/node-availability/node-availability';
import { ScenesService } from '../../../../providers/api/scenes.service';
import { Scene } from '../../../../models/scene.model';

/**
 * Generated class for the ScenesAddPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-scenes-add',
  styleUrl: './scenes-add.scss',
  templateUrl: 'scenes-add.html',
})
export class ScenesAddPage {

  public sceneModel: Scene;
  public scene:any;
  public currentNodes: any[] = [];
  public localNodes: any;
  public lightNodes: any[] = [];
  public blindNodes: any[] = [];
  public awningNodes: any[] = [];
  public climaNodes: any[] = [];
  private userID;
  public validation_messages: any;
  public form: FormGroup;

  constructor(
    private availability: NodeAvailabilityProvider,
    public loadingCtrl: LoadingController,
    public navCtrl: NavController,
    public navParams: NavParams,
    private auth: AuthService,
    public formBuilder: FormBuilder,
    private scenesService: ScenesService) {
    
      this.form = this.formBuilder.group({
        name:['', Validators.required] 
      });
  }

  ionViewDidLoad() {
    let loader = this.loadingCtrl.create({
      content: "Loading devices...",
      dismissOnPageChange: false
    });
    loader.present();
    if(this.auth.getAuthUser())
    {
      this.userID = this.auth.getAuthUser()._id;
    }
    this.scene = 
    {
      name:'',
      user:this.userID,
      active:false,
      devices:[]
    };
    Observable.zip(
      this.availability.getSpecificNodes('light'),
      this.availability.getSpecificNodes('blind'), 
      this.availability.getSpecificNodes('awning'),
      this.availability.getSpecificNodes('clima')
    ).subscribe(([lights, blinds, awnings, clima]) => {

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
      this.scene.devices = this.loadCurrentNodes(this.currentNodes);
      this.localNodes = this.scene.devices;
      this.lightNodes = lights;
      this.blindNodes = blinds;
      this.awningNodes = awnings;
      this.climaNodes = clima;
      loader.dismissAll();
    }, err => {
      loader.dismissAll();
      console.log('error')
    });
  }

  loadCurrentNodes(nodes:any[])
  {
    let actualNodes = [];

    for (let i = 0; i < nodes.length; i++) {
      let nodeId = nodes[i]._id;
      actualNodes[nodeId] = {
        id:nodeId,
        availability:false,
        active:false,
        endpoints:[]
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

  changeState(deviceId, endpointId, active, onlyOne = false) {
    if (this.scene.devices[deviceId]) {
      for (let i = 0; i < this.scene.devices[deviceId].endpoints.length; i++) {
        if (this.scene.devices[deviceId].endpoints[i].id === endpointId) {
          this.scene.devices[deviceId].endpoints[i].defaultState = active;
          if (active) {
            this.scene.devices[deviceId].endpoints[i].value = this.scene.devices[deviceId].endpoints[i].stateOn;
          } else {
            this.scene.devices[deviceId].endpoints[i].value = this.scene.devices[deviceId].endpoints[i].stateOff;
          }
        } else if (onlyOne && active) {
          this.scene.devices[deviceId].endpoints[i].defaultState = false;
          this.scene.devices[deviceId].endpoints[i].value = this.scene.devices[deviceId].endpoints[i].stateOff;
        }
      }
    }
  }

  changeAvailability(deviceId, available) {
    if (this.scene.devices[deviceId]) {
      this.scene.devices[deviceId].available = available;
      for (let i = 0; i < this.scene.devices[deviceId].endpoints.length; i++) {
        this.scene.devices[deviceId].endpoints[i].defaultState = false;
        this.scene.devices[deviceId].endpoints[i].value = this.scene.devices[deviceId].endpoints[i].stateOff;
      }
    }
  }

  save()
  {
    if(this.form.valid)
    {
      let data;
      const name = this.form.controls.name.value;
      this.scene.name = name;
      this._setDevices(this.scene.devices);
      data = this.scene;
      this.scenesService.create(data).subscribe((res) => {
        this.navCtrl.setRoot('GlobalSettingsPage');
        this.navCtrl.push('ScenesPage');
      }, (err) => {
        console.error('Created error:::', err);
      });
    }
  }

  _setDevices(devices:any){
    let auxDevices = [];
    for (let id in devices) {
      auxDevices.push(devices[id]);
    }
    this.scene.devices = auxDevices;
  }
}
