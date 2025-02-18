import { Component, OnDestroy } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AlertController, NavController } from "@ionic/angular";
import { Observable, Subscription, interval } from "rxjs";
import { mergeMap, map, scan } from 'rxjs/operators';
import * as _ from "underscore";
import moment from "moment";

import { Constants, SocketService } from "../../providers";
import { NodeService } from "../../providers/api/node.service";
import { NodeAvailabilityProvider } from "../../providers/node-availability/node-availability";
import { NodePeriodicityProvider } from "../../providers/node-periodicity/node-periodicity";
import { DeviceService } from "../../providers/device/device.service";

@Component({
  selector: "page-devices-heater",
  templateUrl: "devices-heater.html",
  styleUrl: "./devices-heater.scss",
  standalone: false
})
export class DevicesHeaterPage implements OnDestroy {
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

  /**
   * Fired only when a view is stored in memory. This event is NOT fired on entering a view that is already cached. It's a nice place for init related tasks.
   */
  ionViewDidLoad() {
    this.socketService.initSocket();

    this.socketService.isSocketConnected().subscribe((res: any) => {
      if (res) {
        this.getNodes();
        this.subscribers();
      }
    });
  }

  /**
   * Fired when entering a page, after it becomes the active page.
   */
  ionViewDidEnter() {
    this.getNodes();
    this.subscribers();
  }

  /**
   * Get node list
   */
  getNodes(reset?: boolean) {
    this.nodes$ = this.availability
      .getSpecificNodes("heater", reset)
      .pipe(
        mergeMap((items: any[]) => items),
        map((item) => this.enableRelayStatus(item)),
        map((item) => this.pushOnCurrentDevicesIds(item)),
        scan((acc: any[], curr) => acc.concat(curr), [])
      )
      .subscribe(
        (nodes) => {
          this.smartClimateNodes = [];
          nodes.map((node, index) => {
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

  /**
   * Set on node, relay0 & relay1 parameter, to enable status of this relays
   * @param node
   */
  enableRelayStatus(node) {
    let relay0 = node.scheme.endpoints.find(
      (e) => e.id === this.TYPE_ENDPOINTS.RELAY_0
    );
    let relay1 = node.scheme.endpoints.find(
      (e) => e.id === this.TYPE_ENDPOINTS.RELAY_1
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

  /**
   * Push on array of device ids shown on this section
   * @param device
   */
  pushOnCurrentDevicesIds(device) {
    if (
      this.currentDevicesIds.findIndex((node) => node === device._id) === -1
    ) {
      this.currentDevicesIds.push(device._id);
    }

    return device;
  }

  /**
   * Push node on smartClimateNodes array
   * @param node
   */
  pushOnSmartClimateNodes(node) {
    const endpoints = node.scheme.endpoints;
    let hasLight = _.findWhere(endpoints, { assigned_id: "light_relay" });

    if (hasLight) {
      let displayNameEndpoint = _.findWhere(endpoints, {
        id: "light_display_name",
      });
      let roomEndpoint = _.findWhere(endpoints, { id: "light_room" });

      let fakeNode: any = {
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
      for (let i = 0; i < endpoints.length; i++) {
        let endpoint = endpoints[i];
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

  /**
   * Activate subscriptions for this section
   */
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

  /**
   * Subscribe Socket on connect meesage
   */
  ioConnection() {
    this.ioConnection$ = this.socketService
      .onEvent("connect")
      .subscribe((res: any) => {
        this.getNodes();
      });
  }

  /**
   * Subscribe Socket on device:created message
   */
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

  /**
   * Subscribe Socket on measure:created
   */
  ioMeasure() {
    this.ioMeasure$ = this.socketService
      .onMeasureCreated()
      .subscribe((measure) => {
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

  /**
   * Helper for ioMeasure Subscribe
   *
   * Update last_update field, used to keep node enabled
   *
   * @param measure
   */
  updateDeviceLastUpdate(measure) {
    let matchItem = this.currentDevices.find((e) => e._id == measure.device);
    if (!matchItem) {
      return;
    }

    matchItem.last_update = measure.created_at;
  }

  /**
   * Helper for ioMeasure Subscribe
   *
   * Update endpoints
   *
   * @param measure
   */
  updateEndpointStatus(measure) {
    let matchItem = this.currentDevices.find((e) => e._id == measure.device);
    if (!matchItem) {
      return;
    }

    if (matchItem.smartClimate) {
      let relay = matchItem.scheme.endpoints.find((e) => e.id === measure.id);
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
            (e) => e.id === this.TYPE_ENDPOINTS.RELAY_0
          );
          if (relay0) {
            matchItem.relay0 = measure.value;
            relay0.current = measure.value;
          }
          break;
        case this.TYPE_ENDPOINTS.RELAY_1:
          let relay1 = matchItem.scheme.endpoints.find(
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

  /**
   * Make alert controller & present
   *
   * Used to change display_name of node
   *
   * @param event
   * @param node
   */
  async updateNodeName(event, node) {
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: this.updateNodeTitleString,
      inputs: [
        {
          name: "nodeName",
          placeholder: event.currentName,
          type: 'text'
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
                building: node.building._id,
                organization: node.organization,
              };
              this.nodeService.update(node._id, updatedNode).subscribe(
                (data) => {
                  event.currentName = promptData.nodeName;
                  this.updatedName = event;
                  this.getNodes(true);
                },
                (err) => {
                  console.warn("Node no updated!!");
                }
              );
              return true;
            } else {
              return false;
            }
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Navigate to the detail page for this item.
   */
  openItem(device: any) {
    this.navCtrl.navigateForward("DeviceDetailPage", {
      state: { device: device }
    });
  }

  /**
   * Deactivate subscriptions for this section
   */
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

  /**
   * Is called in a component's lifecycle just before the instance of the component is finally destroyed
   */
  ngOnDestroy() {
    if (this.nodes$) {
      this.nodes$.unsubscribe();
    }

    this.unsubscribers();
  }
}
