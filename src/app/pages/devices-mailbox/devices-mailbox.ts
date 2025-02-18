import { Component, OnDestroy } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AlertController, NavController } from "@ionic/angular";
import { Observable, Subscription, interval, map } from "rxjs";
import * as _ from "underscore";
import moment from "moment";

import { Constants, SocketService } from "../../providers";
import { NodeService } from "../../providers/api/node.service";
import { NodeAvailabilityProvider } from "../../providers/node-availability/node-availability";
import { NodePeriodicityProvider } from "../../providers/node-periodicity/node-periodicity";
import { DeviceService } from "../../providers/device/device.service";

interface FakeNode {
  smartClimate: {
    parent: any;
    displayNameEndpoint: string | null;
  };
  status: any;
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
  relay0: any;
  relay1: any;
  _id: string;
}

interface Device {
  _id: string;
  scheme: {
    endpoints: any[];
    code: string;
    name: string;
  };
  status?: any;
  display_name?: string;
  name?: string;
  room?: {
    name: string;
  };
  last_update?: any;
  relay0?: any;
  relay1?: any;
  active?: boolean;
  building?: {
    _id: string;
  };
  organization?: any;
}

@Component({
  selector: "page-devices-mailbox",
  templateUrl: "devices-mailbox.html",
  styleUrl: "./devices-mailbox.scss",
  standalone: false
})
export class DevicesMailboxPage implements OnDestroy {
  private ioConnection$: Subscription;
  private ioConnectionDevice$: Subscription;
  private ioMeasure$: Subscription;
  private nodes$: Subscription;
  private periodicity$: Subscription;

  public currentDevices: Device[] = [];
  public currentDevicesIds: string[] = [];
  public smartClimateNodes: FakeNode[] = [];

  public TYPE_ENDPOINTS = Constants.TYPE_ENDPOINTS;
  public TYPE_NODE = Constants.TYPE_NODE;
  public updatedName: any = null;

  public cancelButtonString: string = '';
  public updateButtonString: string = '';
  public updateNodeTitleString: string = '';
  public nodeNameEdit: string = '';
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
      .getSpecificNodes("mailbox", reset)
      .pipe(
        map((items: Device[]) => {
          return items.map(item => {
            return this.enableRelayStatus(this.pushOnCurrentDevicesIds(item));
          });
        })
      )
      .subscribe(
        (nodes: Device[]) => {
          this.smartClimateNodes = [];
          const remainingNodes: Device[] = [];
          
          nodes.forEach(node => {
            switch (node.scheme.code) {
              case this.TYPE_NODE.SMART_CLIMATE:
              case this.TYPE_NODE.SMART_CLIMATE_2:
              case this.TYPE_NODE.SMART_CLIMATE_3:
                this.pushOnSmartClimateNodes(node);
                break;
              case this.TYPE_NODE.TRUST_EXTENDED_LIGHT:
                node.last_update = moment(new Date());
                node.active = true;
                remainingNodes.push(node);
                break;
              default:
                remainingNodes.push(node);
            }
          });

          this.currentDevices = [...remainingNodes, ...this.smartClimateNodes];
          this.currentDevices = this.periodicity.updatePeriodicity(
            this.currentDevices
          );
        },
        (err) => {
          console.log(err);
        }
      );
  }

  enableRelayStatus(node: Device): Device {
    const relay0 = node.scheme.endpoints.find(
      (e) => e.id === this.TYPE_ENDPOINTS.RELAY_0
    );
    const relay1 = node.scheme.endpoints.find(
      (e) => e.id === this.TYPE_ENDPOINTS.RELAY_1
    );
    node.relay0 = relay0?.current || null;
    node.relay1 = relay1?.current || null;
    return node;
  }

  pushOnCurrentDevicesIds(device: Device): Device {
    if (!this.currentDevicesIds.includes(device._id)) {
      this.currentDevicesIds.push(device._id);
    }
    return device;
  }

  pushOnSmartClimateNodes(node: Device) {
    const endpoints = node.scheme.endpoints;
    const hasLight = _.findWhere(endpoints, { assigned_id: "light_relay" });

    if (hasLight) {
      const displayNameEndpoint = _.findWhere(endpoints, {
        id: "light_display_name",
      });
      const roomEndpoint = _.findWhere(endpoints, { id: "light_room" });

      const fakeNode: FakeNode = {
        smartClimate: {
          parent: node,
          displayNameEndpoint: null,
        },
        status: node.status,
        display_name: node.display_name || '',
        name: node.name || '',
        room: {
          name: node.room?.name || "",
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

      let relayCount = 0;
      endpoints.forEach(endpoint => {
        if (endpoint.id === this.TYPE_ENDPOINTS.IP ||
            endpoint.id === this.TYPE_ENDPOINTS.RSSI ||
            endpoint.id === this.TYPE_ENDPOINTS.UPTIME ||
            endpoint.id === this.TYPE_ENDPOINTS.UPTIME2 ||
            endpoint.id === this.TYPE_ENDPOINTS.VERSION ||
            endpoint.id === this.TYPE_ENDPOINTS.VCC) {
          fakeNode.scheme.endpoints.push(endpoint);
        }
        
        if (endpoint.assigned_id === "light_relay") {
          if (relayCount === 0) {
            endpoint.fake_id = this.TYPE_ENDPOINTS.RELAY_0;
            fakeNode.relay0 = endpoint.current;
          } else if (relayCount === 1) {
            endpoint.fake_id = this.TYPE_ENDPOINTS.RELAY_1;
            fakeNode.relay1 = endpoint.current;
          }
          fakeNode.scheme.endpoints.push(endpoint);
          relayCount++;
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

    this.periodicity$ = interval(10000).subscribe(() => {
      this.currentDevices = this.periodicity.updatePeriodicity(
        this.currentDevices
      );
    });
  }

  ioConnection() {
    this.ioConnection$ = this.socketService
      .onEvent("connect")
      .subscribe(() => {
        this.getNodes();
      });
  }

  ioConnectionDevice() {
    this.ioConnectionDevice$ = this.socketService
      .onDeviceCreated()
      .subscribe((newDevice: Device) => {
        if (!this.currentDevicesIds.includes(newDevice._id)) {
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
        if (!this.currentDevicesIds.includes(measure.device)) {
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
    const matchItem = this.currentDevices.find((e) => e._id === measure.device);
    if (matchItem) {
      matchItem.last_update = measure.created_at;
    }
  }

  updateEndpointStatus(measure: any) {
    const matchItem = this.currentDevices.find((e) => e._id === measure.device);
    if (!matchItem) return;

    if ('smartClimate' in matchItem) {
      const relay = matchItem.scheme.endpoints.find((e) => e.id === measure.id);
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
        case this.TYPE_ENDPOINTS.RELAY_0: {
          const relay0 = matchItem.scheme.endpoints.find(
            (e) => e.id === this.TYPE_ENDPOINTS.RELAY_0
          );
          if (relay0) {
            matchItem.relay0 = measure.value;
            relay0.current = measure.value;
          }
          break;
        }
        case this.TYPE_ENDPOINTS.RELAY_1: {
          const relay1 = matchItem.scheme.endpoints.find(
            (e) => e.id === this.TYPE_ENDPOINTS.RELAY_1
          );
          if (relay1) {
            matchItem.relay1 = measure.value;
            relay1.current = measure.value;
          }
          break;
        }
      }
    }
  }

  async updateNodeName(event: Event, node: Device) {
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: this.updateNodeTitleString,
      inputs: [
        {
          name: "nodeName",
          placeholder: (event as any).currentName,
          type: 'text'
        },
      ],
      buttons: [
        { text: this.cancelButtonString, role: 'cancel' },
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
                  (event as any).currentName = promptData.nodeName;
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

  openItem(device: Device) {
    this.navCtrl.navigateForward('device-detail', {
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
