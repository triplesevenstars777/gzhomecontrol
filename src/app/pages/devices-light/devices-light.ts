import { Component } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AlertController, NavController } from "@ionic/angular";
import { Observable, Subscription, interval } from "rxjs";
import { map, mergeMap, scan } from "rxjs/operators";
import { Router } from "@angular/router";
import * as _ from "underscore";
import moment from "moment";

import { Constants, SocketService } from "../../providers";
import { NodeService } from "../../providers/api/node.service";
import { NodeAvailabilityProvider } from "../../providers/node-availability/node-availability";
import { NodePeriodicityProvider } from "../../providers/node-periodicity/node-periodicity";
import { DeviceService } from "../../providers/device/device.service";

interface LightNode {
  smartClimate?: {
    parent: any;
    displayNameEndpoint: string | null;
  };
  status: any;
  active: boolean;
  display_name: string;
  name: string;
  room: {
    name: string;
  };
  scheme: {
    code: string;
    name: string;
    endpoints: any[];
  };
  last_update: any;
  relay0: string | null;
  relay1: string | null;
  relay2: string | null;
  relay3: string | null;
  power?: string | null;
  _id: string;
  building?: any;
  organization?: any;
}

@Component({
  selector: "page-devices-light",
  templateUrl: "devices-light.html",
  styleUrl: "./devices-light.scss",
  standalone: false
})
export class DevicesLightPage {
  private ioConnection$: Subscription;
  private ioConnectionDevice$: Subscription;
  private ioMeasure$: Subscription;
  private nodes$: Subscription;
  private periodicity$: Subscription;

  public currentDevices: LightNode[] = [];
  public currentDevicesIds: string[] = [];
  public smartClimateNodes: LightNode[] = [];

  public TYPE_ENDPOINTS = Constants.TYPE_ENDPOINTS;
  public TYPE_NODE = Constants.TYPE_NODE;
  public updatedName: any = null;

  public cancelButtonString: string; 
  public updateButtonString: string;
  public updateNodeTitleString: string;
  public nodeNameEdit: string;
  public isWallTablet = false;

  constructor(
    private alertCtrl: AlertController,
    private availability: NodeAvailabilityProvider,
    private deviceService: DeviceService,
    private nodeService: NodeService,
    private periodicity: NodePeriodicityProvider,
    private socketService: SocketService,
    private translateService: TranslateService,
    public navCtrl: NavController,
    private router: Router
  ) {
    this.isWallTablet = this.deviceService.isWallTablet();
    this.translateService
      .get([
        "CANCEL_BUTTON",
        "PLEASE_CHOOSE_NODE_NAME",
        "UPDATE_BUTTON",
        "UPDATE_NODE_TITLE",
      ])
      .subscribe((values) => {
        this.cancelButtonString = values["CANCEL_BUTTON"];
        this.nodeNameEdit = values["PLEASE_CHOOSE_NODE_NAME"];
        this.updateButtonString = values["UPDATE_BUTTON"];
        this.updateNodeTitleString = values["UPDATE_NODE_TITLE"];
      });
  }

  ionViewDidLoad() {
    this.socketService.initSocket();

    this.socketService.isSocketConnected().subscribe((res: any) => {
      if (res) {
        this.getNodes();
        this.subscribers();
      }
    });
  }

  ionViewDidEnter() {
    this.getNodes();
    this.subscribers();
  }

  getNodes(reset?: boolean) {
    this.nodes$ = this.availability
      .getSpecificNodes("light", reset)
      .pipe(
        map((items) => items),
        mergeMap((items) => items),
        map((item: any) => this.enableRelayStatus(item as LightNode)),
        map((item) => this.pushOnCurrentDevicesIds(item)),
        scan((acc: LightNode[], curr: LightNode) => [...acc, curr], [] as LightNode[])
      )
      .subscribe(
        (nodes) => {
          this.smartClimateNodes = [];
          nodes.forEach((node: LightNode, index: number) => {
            switch (node.scheme.code) {
              case this.TYPE_NODE.SMART_CLIMATE:
              case this.TYPE_NODE.SMART_CLIMATE_2:
              case this.TYPE_NODE.SMART_CLIMATE_3:
                this.pushOnSmartClimateNodes(node);
                nodes.splice(index, 1);
                break;
              case this.TYPE_NODE.TRUST_EXTENDED_LIGHT:
                node.last_update = moment(new Date());
                node.active = true;
            }
          });

          this.currentDevices = [...nodes, ...this.smartClimateNodes];
          this.currentDevices = this.periodicity.updatePeriodicity(
            this.currentDevices
          );
        },
        (err) => {
          console.log(err);
        }
      );
  }

  enableRelayStatus(node: LightNode): LightNode {
    let relay0 = node.scheme.endpoints.find(
      (e: any) => e.id === this.TYPE_ENDPOINTS.RELAY_0
    );
    let relay1 = node.scheme.endpoints.find(
      (e: any) => e.id === this.TYPE_ENDPOINTS.RELAY_1
    );
    let power = node.scheme.endpoints.find(
      (e: any) => e.id === this.TYPE_ENDPOINTS.POWER_DIMMER
    );
    node.relay0 = null;
    node.relay1 = null;
    node.power = null;

    if (relay0) {
      node.relay0 = relay0.current;
    }
    if (relay1) {
      node.relay1 = relay1.current;
    }
    if (power) {
      node.power = power.current;
    }
    return node;
  }

  pushOnCurrentDevicesIds(device: LightNode): LightNode {
    if (
      this.currentDevicesIds.findIndex((node) => node === device._id) === -1
    ) {
      this.currentDevicesIds.push(device._id);
    }
    return device;
  }

  pushOnSmartClimateNodes(node: LightNode) {
    const endpoints = node.scheme.endpoints;
    let hasLight = _.findWhere(endpoints, { assigned_id: "light_relay" });
    if (hasLight) {
      let displayNameEndpoint = _.findWhere(endpoints, {
        id: "light_display_name",
      });
      let roomEndpoint = _.findWhere(endpoints, { id: "light_room" });

      let fakeNode: LightNode = {
        smartClimate: {
          parent: node,
          displayNameEndpoint: null,
        },
        status: node.status,
        active: node.active,
        display_name: node.display_name,
        name: node.name,
        room: {
          name: node.room ? node.room.name : "",
        },
        scheme: {
          code: this.TYPE_NODE.LIGHT,
          name: node.scheme.name,
          endpoints: [],
        },
        last_update: node.last_update,
        relay0: null,
        relay1: null,
        relay2: null,
        relay3: null,
        power: null,
        _id: node._id,
        building: node.building,
        organization: node.organization
      };

      if (displayNameEndpoint) {
        fakeNode.scheme.endpoints.push(displayNameEndpoint);
        if (fakeNode.smartClimate) {
          fakeNode.smartClimate.displayNameEndpoint = displayNameEndpoint._id;
        }
        fakeNode.display_name = displayNameEndpoint.display_name;
        fakeNode.name = displayNameEndpoint.name;
      }

      if (roomEndpoint) {
        fakeNode.room.name = roomEndpoint.name;
      }

      let numOfRelays = 0;
      endpoints.forEach(endpoint => {
        if ([
          this.TYPE_ENDPOINTS.IP,
          this.TYPE_ENDPOINTS.RSSI,
          this.TYPE_ENDPOINTS.UPTIME,
          this.TYPE_ENDPOINTS.UPTIME2,
          this.TYPE_ENDPOINTS.VERSION,
          this.TYPE_ENDPOINTS.VCC
        ].includes(endpoint.id)) {
          fakeNode.scheme.endpoints.push(endpoint);
        }

        if (endpoint.assigned_id === "light_relay") {
          switch (numOfRelays) {
            case 0:
              endpoint.fake_id = this.TYPE_ENDPOINTS.RELAY_0;
              fakeNode.relay0 = endpoint.current;
              break;
            case 1:
              endpoint.fake_id = this.TYPE_ENDPOINTS.RELAY_1;
              fakeNode.relay1 = endpoint.current;
              break;
            case 2:
              endpoint.fake_id = this.TYPE_ENDPOINTS.RELAY_2;
              fakeNode.relay2 = endpoint.current;
              break;
            case 3:
              endpoint.fake_id = this.TYPE_ENDPOINTS.RELAY_3;
              fakeNode.relay3 = endpoint.current;
              break;
          }
          fakeNode.scheme.endpoints.push(endpoint);
          numOfRelays++;
        }
      });

      this.smartClimateNodes.push(fakeNode);
    }
  }

  subscribers() {
    this.unsubscribers();

    this.ioConnection();
    this.ioConnectionDevice();
    this.ioMeasure();

    this.periodicity$ = interval(10 * 1000).subscribe(() => {
      this.currentDevices = this.periodicity.updatePeriodicity(
        this.currentDevices
      );
    });
  }

  ioConnection() {
    this.ioConnection$ = this.socketService
      .onEvent("connect")
      .subscribe((res: any) => {
        this.getNodes();
      });
  }

  ioConnectionDevice() {
    this.ioConnectionDevice$ = this.socketService
      .onDeviceCreated()
      .subscribe((newDevice: any) => {
        if (this.currentDevicesIds.indexOf(newDevice.device) === -1) {
          return;
        }

        const device = this.enableRelayStatus(newDevice);
        this.pushOnCurrentDevicesIds(device);
        this.currentDevices = this.periodicity.updateDevice(
          this.currentDevices,
          device
        );
      });
  }

  ioMeasure() {
    this.ioMeasure$ = this.socketService
      .onMeasureCreated()
      .subscribe((measure: any) => {
        if (this.currentDevicesIds.indexOf(measure.device) === -1) {
          return;
        }

        if (![
          this.TYPE_ENDPOINTS.IP,
          this.TYPE_ENDPOINTS.RSSI,
          this.TYPE_ENDPOINTS.UPTIME,
          this.TYPE_ENDPOINTS.UPTIME2,
          this.TYPE_ENDPOINTS.VERSION,
          this.TYPE_ENDPOINTS.VCC
        ].includes(measure.id)) {
          this.updateDeviceLastUpdate(measure);
          this.updateEndpointStatus(measure);
        }
      });
  }

  updateDeviceLastUpdate(measure: any) {
    let matchItem = this.currentDevices.find((e) => e._id == measure.device);
    if (!matchItem) {
      return;
    }

    matchItem.last_update = measure.created_at;
  }

  updateEndpointStatus(measure: any) {
    let matchItem = this.currentDevices.find((e) => e._id == measure.device);
    if (!matchItem) {
      return;
    }

    if (matchItem.smartClimate) {
      let relay = matchItem.scheme.endpoints.find((e: any) => e.id === measure.id);
      if (relay) {
        switch (relay.fake_id) {
          case this.TYPE_ENDPOINTS.RELAY_0:
            matchItem.relay0 = measure.value;
            break;
          case this.TYPE_ENDPOINTS.RELAY_1:
            matchItem.relay1 = measure.value;
            break;
        }

        relay.current = measure.value;
      }
    } else {
      switch (measure.id) {
        case this.TYPE_ENDPOINTS.RELAY_0:
          let relay0 = matchItem.scheme.endpoints.find(
            (e: any) => e.id === this.TYPE_ENDPOINTS.RELAY_0
          );
          if (relay0) {
            matchItem.relay0 = measure.value;
            relay0.current = measure.value;
          }
          break;
        case this.TYPE_ENDPOINTS.RELAY_1:
          let relay1 = matchItem.scheme.endpoints.find(
            (e: any) => e.id === this.TYPE_ENDPOINTS.RELAY_1
          );
          if (relay1) {
            matchItem.relay1 = measure.value;
            relay1.current = measure.value;
          }
          break;
      }
    }
  }

  async updateNodeName(event: any, node: LightNode) {
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: this.updateNodeTitleString,
      inputs: [
        {
          name: "nodeName",
          type: 'text',
          placeholder: event.currentName,
        },
      ],
      buttons: [
        { text: this.cancelButtonString },
        {
          text: this.updateButtonString,
          handler: (promptData) => {
            if (promptData.nodeName.length !== 0) {
              node.display_name = promptData.nodeName;
              const updatedNode = {
                display_name: promptData.nodeName,
                building: node.building?._id,
                organization: node.organization,
              };
              this.nodeService.update(node._id, updatedNode).subscribe(
                () => {
                  event.currentName = promptData.nodeName;
                  this.updatedName = event;
                  this.getNodes(true);
                },
                (err) => {
                  console.warn("Node not updated:", err);
                }
              );
              return true;
            }
            return false;
          },
        },
      ],
    });

    await alert.present();
  }

  openItem(device: LightNode) {
    this.router.navigate(['device-detail'], {
      state: {
        device: device,
        previousPage: '/devices-light'
       },
      replaceUrl: true 
    });
  }

  unsubscribers() {
    if (this.ioConnection$) {
      this.ioConnection$.unsubscribe();
    }
    if (this.ioConnectionDevice$) {
      this.ioConnectionDevice$.unsubscribe();
    }
    if (this.ioMeasure$) {
      this.ioMeasure$.unsubscribe();
    }
    if (this.periodicity$) {
      this.periodicity$.unsubscribe();
    }
  }

  ngOnDestroy() {
    if (this.nodes$) {
      this.nodes$.unsubscribe();
    }
    this.unsubscribers();
  }
}
