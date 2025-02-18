import { Component, OnInit, OnDestroy } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AlertController, NavController } from "@ionic/angular";
import { Observable, Subscription, interval } from "rxjs";
import { map, mergeMap, scan } from "rxjs/operators";
import * as _ from "underscore";
import moment from "moment";

import { Constants, SocketService } from "../../providers";
import { NodeService } from "../../providers/api/node.service";
import { NodeAvailabilityProvider } from "../../providers/node-availability/node-availability";
import { NodePeriodicityProvider } from "../../providers/node-periodicity/node-periodicity";
import { DeviceService } from "../../providers/device/device.service";

@Component({
  selector: "page-devices-doorlock",
  templateUrl: "devices-doorlock.html",
  styleUrl: "./devices-doorlock.scss",
  standalone: false
})
export class DevicesDoorlockPage implements OnInit, OnDestroy {
  private ioConnection$: Subscription;
  private ioConnectionDevice$: Subscription;
  private ioMeasure$: Subscription;
  private nodes$: Subscription;
  private periodicity$: Subscription;

  // Array of Devices shown on this section
  public currentDevices: any[] = [];
  // Array of Devices Ids shown on this section, used to find ids more quickly
  public currentDevicesIds: string[] = [];
  // Array of Climate Nodes, used to construct fakes nodes from Climate nodes
  public smartClimateNodes: any[] = [];

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
    public navCtrl: NavController
  ) {
    this.isWallTablet = this.deviceService.isWallTablet();
  }

  ngOnInit() {
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
      .getSpecificNodes("doorlock", reset)
      .pipe(
        mergeMap((items) => items),
        map((item) => this.enableRelayStatus(item)),
        map((item) => this.pushOnCurrentDevicesIds(item)),
        scan((acc, curr) => acc.concat(curr), [] as any[])
      )
      .subscribe(
        (nodes) => {
          this.smartClimateNodes = [];
          nodes.map((node: any, index: number) => {
            switch (node.scheme.code) {
              case this.TYPE_NODE.SMART_CLIMATE:
              case this.TYPE_NODE.SMART_CLIMATE_2:
              case this.TYPE_NODE.SMART_CLIMATE_3:
                // Make node from parent
                this.pushOnSmartClimateNodes(node);
                // Remove parent node
                nodes.splice(index, 1);
                break;
              case this.TYPE_NODE.TRUST_EXTENDED_LIGHT:
                node.last_update = moment(new Date());
                node.active = true;
            }
          });

          this.currentDevices = nodes.concat(this.smartClimateNodes);
          this.currentDevices = this.periodicity.updatePeriodicity(
            this.currentDevices
          );
        },
        (err) => {
          console.log(err);
        }
      );
  }

  enableRelayStatus(node: any) {
    const relay0 = node.scheme.endpoints.find(
      (e: any) => e.id === this.TYPE_ENDPOINTS.RELAY_0
    );
    const relay1 = node.scheme.endpoints.find(
      (e: any) => e.id === this.TYPE_ENDPOINTS.RELAY_1
    );
    node.relay0 = null;
    node.relay1 = null;
    if (relay0) {
      node.relay0 = relay0.current;
    }
    if (relay1) {
      node.relay1 = relay1.current;
    }

    return node;
  }

  pushOnCurrentDevicesIds(device: any) {
    if (
      this.currentDevicesIds.findIndex((node) => node === device._id) === -1
    ) {
      this.currentDevicesIds.push(device._id);
    }

    return device;
  }

  pushOnSmartClimateNodes(node: any) {
    const endpoints = node.scheme.endpoints;
    const hasLight = _.findWhere(endpoints, { assigned_id: "light_relay" });

    if (hasLight) {
      const displayNameEndpoint = _.findWhere(endpoints, {
        id: "light_display_name",
      });
      const roomEndpoint = _.findWhere(endpoints, { id: "light_room" });

      const fakeNode: any = {
        smartClimate: {
          parent: node,
          displayNameEndpoint: null,
        },
        status: node.status,
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
        _id: node._id,
      };

      if (displayNameEndpoint) {
        fakeNode.scheme.endpoints.push(displayNameEndpoint);
        fakeNode.smartClimate.displayNameEndpoint = displayNameEndpoint._id;
        fakeNode.display_name = displayNameEndpoint.display_name;
        fakeNode.name = displayNameEndpoint.name;
      }
      if (roomEndpoint) {
        fakeNode.room.name = roomEndpoint.name;
      }

      let numOfRelays: number | null = null;
      for (const endpoint of endpoints) {
        switch (endpoint.id) {
          case this.TYPE_ENDPOINTS.IP:
          case this.TYPE_ENDPOINTS.RSSI:
          case this.TYPE_ENDPOINTS.UPTIME:
          case this.TYPE_ENDPOINTS.UPTIME2:
          case this.TYPE_ENDPOINTS.VERSION:
          case this.TYPE_ENDPOINTS.VCC:
            fakeNode.scheme.endpoints.push(endpoint);
            break;
        }
        switch (endpoint.assigned_id) {
          case "light_relay":
            if (numOfRelays === null) {
              endpoint.fake_id = this.TYPE_ENDPOINTS.RELAY_0;
              fakeNode.relay0 = endpoint.current;
              numOfRelays = 0;
            } else if (numOfRelays === 0) {
              endpoint.fake_id = this.TYPE_ENDPOINTS.RELAY_1;
              fakeNode.relay1 = endpoint.current;
              numOfRelays = 1;
            }
            fakeNode.scheme.endpoints.push(endpoint);
            break;
        }
      }

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

        switch (measure.id) {
          case this.TYPE_ENDPOINTS.IP:
          case this.TYPE_ENDPOINTS.RSSI:
          case this.TYPE_ENDPOINTS.UPTIME:
          case this.TYPE_ENDPOINTS.UPTIME2:
          case this.TYPE_ENDPOINTS.VERSION:
          case this.TYPE_ENDPOINTS.VCC:
            break;
          default:
            this.updateDeviceLastUpdate(measure);
            this.updateEndpointStatus(measure);
        }
      });
  }

  updateDeviceLastUpdate(measure: any) {
    const matchItem = this.currentDevices.find((e) => e._id == measure.device);
    if (!matchItem) {
      return;
    }

    matchItem.last_update = measure.created_at;
  }

  updateEndpointStatus(measure: any) {
    const matchItem = this.currentDevices.find((e) => e._id == measure.device);
    if (!matchItem) {
      return;
    }

    if (matchItem.smartClimate) {
      const relay = matchItem.scheme.endpoints.find((e: any) => e.id === measure.id);
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
          const relay0 = matchItem.scheme.endpoints.find(
            (e: any) => e.id === this.TYPE_ENDPOINTS.RELAY_0
          );
          if (relay0) {
            matchItem.relay0 = measure.value;
            relay0.current = measure.value;
          }
          break;
        case this.TYPE_ENDPOINTS.RELAY_1:
          const relay1 = matchItem.scheme.endpoints.find(
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

  async updateNodeName(event: any, node: any) {
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: this.updateNodeTitleString,
      inputs: [
        {
          name: "nodeName",
          placeholder: event.currentName,
          type: "text"
        },
      ],
      buttons: [
        { text: this.cancelButtonString, role: 'cancel' },
        {
          text: this.updateButtonString,
          handler: async (promptData) => {
            if (promptData.nodeName.length !== 0) {
              node.display_name = promptData.nodeName;
              const updatedNode = {
                display_name: promptData.nodeName,
                building: node.building._id,
                organization: node.organization,
              };
              try {
                await this.nodeService.update(node._id, updatedNode).toPromise();
                event.currentName = promptData.nodeName;
                this.updatedName = event;
                this.getNodes(true);
                return true;
              } catch (err) {
                console.warn("Node not updated!!");
                return false;
              }
            }
            return false;
          },
        },
      ],
    });

    await alert.present();
  }

  openItem(device: any) {
    this.navCtrl.navigateForward("/device-detail", {
      state: { device }
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
