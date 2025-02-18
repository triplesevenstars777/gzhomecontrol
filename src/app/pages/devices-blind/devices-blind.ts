import { Component } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AlertController, NavController } from "@ionic/angular";
import { Observable, Subscription, interval, zip } from "rxjs";
import { Router } from "@angular/router";
import * as _ from "underscore";

import { Constants, SocketService } from "../../providers";
import { NodeService } from "../../providers/api/node.service";
import { DeviceService } from "../../providers/device/device.service";
import { NodeAvailabilityProvider } from "../../providers/node-availability/node-availability";
import { NodePeriodicityProvider } from "../../providers/node-periodicity/node-periodicity";

@Component({
  selector: "page-devices-blind",
  templateUrl: "devices-blind.html",
  styleUrl: "./devices-blind.scss",
  standalone: false
})
export class DevicesBlindPage {
  private ioConnection$: Subscription;
  private ioConnectionDevice$: Subscription;
  private ioMeasure$: Subscription;
  private nodes$: Subscription;
  private periodicity$: Subscription;

  public currentDevices: any[] = [];
  public currentDevicesIds: string[] = [];
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
    this.nodes$ = zip(
      this.availability.getSpecificNodes("blind", reset),
      this.availability.getSpecificNodes("awning", reset)
    ).subscribe(([blinds, awnings]) => {
      blinds.map((node: any) => (node.iconType = "blind"));
      awnings.map((node: any) => (node.iconType = "awning"));

      let nodes = blinds.concat(awnings);

      this.smartClimateNodes = [];
      nodes.map((node: any, index: number) => {
        this.pushOnCurrentDevicesIds(node);

        switch (node.scheme.code) {
          case this.TYPE_NODE.SMART_CLIMATE:
          case this.TYPE_NODE.SMART_CLIMATE_2:
          case this.TYPE_NODE.SMART_CLIMATE_3:
            this.pushOnSmartClimateNodes(node);
            nodes.splice(index, 1);
            break;
        }
      });

      this.currentDevices = nodes.concat(this.smartClimateNodes);
      this.currentDevices = this.periodicity.updatePeriodicity(
        this.currentDevices
      );
    });
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
    let hasBlindDown = _.findWhere(endpoints, { assigned_id: "blind_relay_0" });
    let hasBlindUp = _.findWhere(endpoints, { assigned_id: "blind_relay_1" });

    if (hasBlindDown && hasBlindUp) {
      let displayNameEndpoint = _.findWhere(endpoints, {
        id: "blind_display_name",
      });
      let roomEndpoint = _.findWhere(endpoints, { id: "blind_room" });

      let fakeNode: any = {
        smartClimate: {
          parent: node,
          displayNameEndpoint: null,
        },
        iconType: "blind",
        status: node.status,
        display_name: node.display_name,
        name: node.name,
        room: {
          name: node.room ? node.room.name : "",
        },
        scheme: {
          code: this.TYPE_NODE.BLIND,
          name: node.scheme.name,
          endpoints: [] as any[],
        },
        last_update: node.last_update,
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

        if (endpoint.assigned_id === "blind_relay_0") {
          endpoint.id = "relay_0";
          fakeNode.scheme.endpoints.push(endpoint);
        } else if (endpoint.assigned_id === "blind_relay_1") {
          endpoint.id = "relay_1";
          fakeNode.scheme.endpoints.push(endpoint);
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

    this.periodicity$ = interval(30 * 1000).subscribe(() => {
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

        this.pushOnCurrentDevicesIds(newDevice);
        this.currentDevices = this.periodicity.updateDevice(
          this.currentDevices,
          newDevice
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

  async updateNodeName(event: any, node: any) {
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
                building: node.building._id,
                organization: node.organization,
              };
              this.nodeService.update(node._id, updatedNode).subscribe(
                () => {
                  event.currentName = promptData.nodeName;
                  this.updatedName = event;
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

  openItem(device: any) {
    this.router.navigate(['device-detail'], {
      state: { device: device },
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
