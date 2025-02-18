import { Component } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AlertController, NavController } from "@ionic/angular";
import { Observable, Subscription, interval } from "rxjs";
import { mergeMap, map, scan } from "rxjs/operators";
import { Router } from "@angular/router";

import { Constants, SocketService } from "../../providers";
import { NodeService } from "../../providers/api/node.service";
import { DeviceService } from "../../providers/device/device.service";
import { NodeAvailabilityProvider } from "../../providers/node-availability/node-availability";
import { NodePeriodicityProvider } from "../../providers/node-periodicity/node-periodicity";

interface SensorNode {
  _id: string;
  display_name: string;
  name: string;
  active: boolean;
  last_update: any;
  building: {
    _id: string;
  };
  organization: any;
  room?: {
    name: string;
  };
}

@Component({
  selector: "page-devices-sensor",
  templateUrl: "devices-sensor.html",
  styleUrl: "./devices-sensor.scss",
  standalone: false
})
export class DevicesSensorPage {
  private ioConnection$: Subscription;
  private ioConnectionDevice$: Subscription;
  private ioMeasure$: Subscription;
  private nodes$: Subscription;
  private periodicity$: Subscription;

  public currentDevicesIds: string[] = [];
  public currentDevices: SensorNode[] = [];
  public TYPE_ENDPOINTS = Constants.TYPE_ENDPOINTS;
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
      .getSpecificNodes("sensor", reset)
      .pipe(
        map((items: any[]) => items as SensorNode[]),
        mergeMap((items: SensorNode[]) => items),
        map((item: SensorNode) => this.pushOnCurrentDevicesIds(item)),
        scan((acc: SensorNode[], curr: SensorNode) => [...acc, curr], [] as SensorNode[])
      )
      .subscribe(
        (nodes) => {
          this.currentDevices = this.periodicity.updatePeriodicity(nodes);
        },
        (err) => {
          console.log(err);
        }
      );
  }

  pushOnCurrentDevicesIds(device: SensorNode): SensorNode {
    if (
      this.currentDevicesIds.findIndex((node) => node === device._id) === -1
    ) {
      this.currentDevicesIds.push(device._id);
    }
    return device;
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
      .subscribe((newDevice: SensorNode) => {
        if (this.currentDevicesIds.indexOf(newDevice._id) === -1) {
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

  async updateNodeName(event: any, node: SensorNode) {
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

  openItem(device: SensorNode) {
    this.router.navigate(['device-detail'], {
      state: { device: device }
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
