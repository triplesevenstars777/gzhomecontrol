import { Component } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AlertController, NavController } from "@ionic/angular";
import { Observable, interval, Subscription } from "rxjs";
import { mergeMap, map, scan } from "rxjs/operators";
import { Router } from "@angular/router";

import { Constants, SocketService } from "../../providers";
import { NodeService } from "../../providers/api/node.service";
import { DeviceService } from "../../providers/device/device.service";
import { NodeAvailabilityProvider } from "../../providers/node-availability/node-availability";
import { NodePeriodicityProvider } from "../../providers/node-periodicity/node-periodicity";

@Component({
  selector: "page-devices-clima",
  templateUrl: "devices-clima.html",
  styleUrl: './devices-clima.scss',
  standalone: false
})
export class DevicesClimaPage {
  private ioConnection$: Subscription;
  private ioConnectionDevice$: Subscription;
  private ioMeasure$: Subscription;
  private nodes$: Subscription;
  private periodicity$: Subscription;

  public currentDevicesIds: string[] = [];
  public currentDevices: any[] = [];
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
      .getSpecificNodes("clima", reset)
      .pipe(
        mergeMap((items) => items),
        map((item) => this.pushOnCurrentDevicesIds(item)),
        scan((acc, curr) => acc.concat(curr), [])
      )
      .subscribe(
        (nodes) => {
          this.currentDevices = nodes;
          this.currentDevices = this.periodicity.updatePeriodicity(
            this.currentDevices
          );
        },
        (err) => {
          console.log(err);
        }
      );
  }

  pushOnCurrentDevicesIds(device) {
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
        }
      });
  }

  updateDeviceLastUpdate(measure) {
    let matchItem = this.currentDevices.find((e) => e._id == measure.device);
    if (!matchItem) {
      return;
    }
    matchItem.last_update = measure.created_at;
  }

  async updateNodeName(ev, item) {
    ev.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: this.updateNodeTitleString,
      inputs: [
        {
          name: "nodeName",
          placeholder: ev.currentName,
          type: 'text'
        },
      ],
      buttons: [
        { text: this.cancelButtonString },
        {
          text: this.updateButtonString,
          handler: (promptData) => {
            if (promptData.nodeName.length !== 0) {
              item.display_name = promptData.nodeName;
              const updatedNode = {
                display_name: promptData.nodeName,
                building: item.building._id,
                organization: item.organization,
              };
              this.nodeService.update(item._id, updatedNode).subscribe(
                (data) => {
                  ev.currentName = promptData.nodeName;
                  this.updatedName = ev;
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

  openItem(device: any) {
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
