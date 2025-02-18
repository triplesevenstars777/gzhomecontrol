import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import {
  LoadingController,
  IonicModule
} from "@ionic/angular";
import { Observable, zip, firstValueFrom } from "rxjs";
import { FormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../../components/components.module';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NodeEndpointsOutputPipe } from './node-endpoints-output.pipe';

import { Constants } from "../../../providers";
import { NodeAvailabilityProvider } from "../../../providers/node-availability/node-availability";

@Component({
  selector: "page-in-toggles",
  templateUrl: "in-toggles.html",
  standalone: true,
  imports: [
    IonicModule,
    FormsModule,
    TranslateModule,
    ComponentsModule,
    CommonModule,
    NodeEndpointsOutputPipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class InTogglesPage {
  public currentNodes: any[] = [];
  public localNodes: any;
  public lightNodes: any[] = [];
  public blindNodes: any[] = [];
  public awningNodes: any[] = [];
  public climaNodes: any[] = [];
  public tempNodes: any[] = [];
  public temperatureNodes: any[] = [];
  public mailboxNodes: any[] = [];
  public heatersNodes: any[] = [];
  public section: string;

  private toggle_nodes = Constants.APP_KEY + ":toggle_nodes";

  constructor(
    private availability: NodeAvailabilityProvider,
    public loadingCtrl: LoadingController,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Subscribe to route params changes
    this.route.params.subscribe(params => {
      this.section = params['section']; //in|out
      this.toggle_nodes = Constants.APP_KEY + ":toggle_nodes:" + this.section;
      this.loadData(); // Reload data when params change
    });

    // Subscribe to navigation end events
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.section) {
        this.loadData(); // Reload data on navigation end
      }
    });
  }

  private async loadData() {
    const loader = await this.loadingCtrl.create({
      message: "Loading devices...",
      spinner: 'crescent'
    });
    await loader.present();

    try {
      const [
        lights,
        blinds,
        awnings,
        clima,
        temp,
        temperature,
        heaters,
        mailbox
      ] = await firstValueFrom(zip(
        this.availability.getSpecificNodes("light"),
        this.availability.getSpecificNodes("blind"),
        this.availability.getSpecificNodes("awning"),
        this.availability.getSpecificNodes("clima"),
        this.availability.getSpecificNodes("temp"),
        this.availability.getSpecificNodes("temperature"),
        this.availability.getSpecificNodes("heater"),
        this.availability.getSpecificNodes("mailbox")
      ));

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
      temp.forEach(node => {
        node.scheme.endpoints = node.scheme.endpoints.filter(endpoint => endpoint.type === 'stateful')
      });
      temperature.forEach(node => {
        node.scheme.endpoints = node.scheme.endpoints.filter(endpoint => endpoint.type === 'stateful')
      });
      heaters.forEach(node => {
        node.scheme.endpoints = node.scheme.endpoints.filter(endpoint => endpoint.type === 'stateful')
      });
      mailbox.forEach(node => {
        node.scheme.endpoints = node.scheme.endpoints.filter(endpoint => endpoint.type === 'stateful')
      });
      
      this.currentNodes = [
        ...lights,
        ...blinds,
        ...awnings,
        ...clima,
        ...temp,
        ...temperature,
        ...heaters,
        ...mailbox
      ];

      this.removeFromStorage(this.currentNodes);
      this.localNodes = this.updateStorage(this.currentNodes);

      this.lightNodes = lights;
      this.blindNodes = blinds;
      this.awningNodes = awnings;
      this.climaNodes = clima;
      this.tempNodes = temp;
      this.temperatureNodes = temperature;
      this.heatersNodes = heaters;
      this.mailboxNodes = mailbox;

    } catch (err) {
      console.log("error", err);
    } finally {
      await loader.dismiss();
    }
  }

  ionViewWillEnter() {
    // Data loading is now handled in loadData()
  }

  removeFromStorage(nodes: any[]) {
    let stringNodes = localStorage.getItem(this.toggle_nodes);
    let storageNodes = {};
    if (stringNodes) {
      storageNodes = JSON.parse(stringNodes);
    }
    for (let key in storageNodes) {
      if (!nodes.filter(item => item._id === key).length) {
        delete storageNodes[key];
      }
    }
    localStorage.setItem(this.toggle_nodes, JSON.stringify(storageNodes));
    this.localNodes = storageNodes;
  }

  updateStorage(nodes: any[]) {
    let stringNodes = localStorage.getItem(this.toggle_nodes);
    let storageNodes = {};
    if (stringNodes) {
      storageNodes = JSON.parse(stringNodes);
    }
    for (let i = 0; i < nodes.length; i++) {
      if (!storageNodes[nodes[i]._id]) {
        storageNodes[nodes[i]._id] = {
          active: false,
          available: false,
          endpoints: []
        };

        if (nodes[i].scheme.endpoints.length) {
          for (let j = 0; j < nodes[i].scheme.endpoints.length; j++) {
            if (nodes[i].scheme.endpoints[j].dir !== "input") {
              let stateOn = null;
              let stateOff = null;
              let device = nodes[i]._id;
              let endpoint = nodes[i].scheme.endpoints[j]._id;

              switch (nodes[i].scheme.endpoints[j].type) {
                case "stateful":
                  const stateLength =
                    nodes[i].scheme.endpoints[j].states.length;
                  if (stateLength > 0) {
                    const stateOffFound = nodes[i].scheme.endpoints[
                      j
                    ].states.filter(
                      item => item.value == 0 || item.value == "false"
                    )[0];
                    const stateOnFound = nodes[i].scheme.endpoints[
                      j
                    ].states.filter(
                      item => item.value == 1 || item.value == "true"
                    )[0];
                    stateOff = stateOffFound ? stateOffFound.name : null;
                    stateOn = stateOnFound ? stateOnFound.name : null;
                    break;
                  }
                  continue;
                case "stateless":
                  const valueLength = nodes[i].scheme.endpoints[j].value.length;
                  if (valueLength > 0) {
                    stateOff = nodes[i].scheme.endpoints[j].value[0].min;
                    stateOn = nodes[i].scheme.endpoints[j].value[0].max;
                    break;
                  }
                  continue;
              }
              storageNodes[nodes[i]._id].endpoints.push({
                stateOn: stateOn,
                stateOff: stateOff,
                defaultState: false,
                data: {
                  device: device,
                  endpoint: endpoint,
                  value: stateOff
                }
              });
            }
          }
        }
      }
    }
    localStorage.setItem(this.toggle_nodes, JSON.stringify(storageNodes));

    return storageNodes;
  }

  changeState(deviceId, endpointId, active, onlyOne = false) {
    let stringNodes = localStorage.getItem(this.toggle_nodes);
    let storageNodes = {};
    if (stringNodes) {
      storageNodes = JSON.parse(stringNodes);
    }

    if (storageNodes[deviceId]) {
      for (let i = 0; i < storageNodes[deviceId].endpoints.length; i++) {
        if (storageNodes[deviceId].endpoints[i].data.endpoint === endpointId) {
          storageNodes[deviceId].endpoints[i].defaultState = active;
          if (active) {
            storageNodes[deviceId].endpoints[i].data.value =
              storageNodes[deviceId].endpoints[i].stateOn;
          } else {
            storageNodes[deviceId].endpoints[i].data.value =
              storageNodes[deviceId].endpoints[i].stateOff;
          }
        } else if (onlyOne && active) {
          storageNodes[deviceId].endpoints[i].defaultState = false;
          storageNodes[deviceId].endpoints[i].data.value =
            storageNodes[deviceId].endpoints[i].stateOff;
        }
      }
      localStorage.setItem(this.toggle_nodes, JSON.stringify(storageNodes));
      this.localNodes = storageNodes;
    }
  }

  changeAvailability(deviceId, available) {
    let stringNodes = localStorage.getItem(this.toggle_nodes);
    let storageNodes = {};
    if (stringNodes) {
      storageNodes = JSON.parse(stringNodes);
    }
    if (storageNodes[deviceId]) {
      storageNodes[deviceId].available = available;
      for (let i = 0; i < storageNodes[deviceId].endpoints.length; i++) {
        storageNodes[deviceId].endpoints[i].defaultState = false;
        storageNodes[deviceId].endpoints[i].data.value =
          storageNodes[deviceId].endpoints[i].stateOff;
      }
      localStorage.setItem(this.toggle_nodes, JSON.stringify(storageNodes));
      this.localNodes = storageNodes;
    }
  }

  updateNodeLocal(id, ev) {
    const storedData = localStorage.getItem(this.toggle_nodes);
    let tempObject = storedData ? JSON.parse(storedData) : {};
    tempObject[id].stateArrive = ev.checked;
    localStorage.setItem(this.toggle_nodes, JSON.stringify(tempObject));
  }
}
