import { Component } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AlertController, ModalController, NavController } from "@ionic/angular";
import { Observable, interval, Subscription, zip, of } from "rxjs";
import { Router } from "@angular/router";
import * as _ from "underscore";

import { NodeService } from "../../providers/api/node.service";
import { Constants, SocketService } from "../../providers";
import { NodeAvailabilityProvider } from "../../providers/node-availability/node-availability";
import { NodePeriodicityProvider } from "../../providers/node-periodicity/node-periodicity";
import { RuleService } from "../../providers/api/rule.service";
import { DeviceService } from "../../providers/device/device.service";

@Component({
  selector: "page-devices-temp",
  templateUrl: "devices-temp.html",
  styleUrl: "./devices-temp.scss",
  standalone: false
})
export class DevicesTempPage {
  private ioConnection$: Subscription;
  private ioConnectionDevice$: Subscription;
  private ioMeasure$: Subscription;
  private nodes$: Subscription;
  private periodicity$: Subscription;

  public currentDevices: any[] = [];
  public currentDevicesIds: string[] = [];
  public smartModbusNodes: any[] = [];
  public smartClimateNodes: any[] = [];

  public TYPE_ENDPOINTS = Constants.TYPE_ENDPOINTS;
  public TYPE_NODE = Constants.TYPE_NODE;

  public rules: any;
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
    public modalCtrl: ModalController,
    public navCtrl: NavController,
    public rulesService: RuleService,
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
        this.updateNodeTitleString = values["UPDATE_NODE_TITLE"];
        this.updateButtonString = values["UPDATE_BUTTON"];
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
      this.availability.getSpecificNodes("temp", reset),
      this.availability.getSpecificNodes("temperature", reset),
      this.getRules()
    ).subscribe(([temp, temperature, rules]) => {
      temp.map((node: any) => {
        node.subType = "temp";
      });
      temperature.map((node: any) => {
        node.subType = "temperature";
      });

      const nodes = temp.concat(temperature);

      let activeDeviceRules = rules.docs.map((rule: any) => rule.source.device);
      let activeEndpointRules = rules.docs.map((rule: any) => rule.source.endpoint);

      nodes.map((node: any) => {
        this.pushOnCurrentDevicesIds(node);

        let tempEndpoint = _.findWhere(node.scheme.endpoints, {
          id: "temperature",
        });
        if (tempEndpoint) {
          if (
            _.contains(activeDeviceRules, node._id) &&
            _.contains(activeEndpointRules, tempEndpoint._id)
          ) {
            node.hasRule = true;
            node.rule = rules.docs.find(
              (a: any) => a.source.endpoint === tempEndpoint._id
            );
          } else {
            node.hasRule = false;
          }

          node.currentTemp = parseFloat(tempEndpoint.current).toFixed(1);
        } else {
          node.currentTemp = null;
        }

        let targetTempEndpoint = _.findWhere(node.scheme.endpoints, {
          id: "display_targettemperature",
        });
        node.targetTemp = targetTempEndpoint
          ? parseFloat(targetTempEndpoint.current).toFixed(1)
          : null;
      });

      this.smartModbusNodes = [];
      this.smartClimateNodes = [];
      nodes.map((node: any, index: number) => {
        switch (node.scheme.code) {
          case this.TYPE_NODE.SMART_MODBUS:
            this.pushOnSmartModbusNodes(node);
            nodes.splice(index, 1);
            break;
          case this.TYPE_NODE.SMART_CLIMATE:
          case this.TYPE_NODE.SMART_CLIMATE_2:
          case this.TYPE_NODE.SMART_CLIMATE_3:
            this.pushOnSmartClimateNodes(node);
            nodes.splice(index, 1);
            break;
        }
      });

      this.currentDevices = nodes
        .concat(this.smartModbusNodes)
        .concat(this.smartClimateNodes);
      this.currentDevices = this.periodicity.updatePeriodicity(
        this.currentDevices
      );
      this.rules = rules;
    });
  }

  getRules(): Observable<any> {
    try {
      return this.rulesService.showAll({ limit: 100 });
    } catch (e) {
      return of([]);
    }
  }

  pushOnCurrentDevicesIds(device: any) {
    if (
      this.currentDevicesIds.findIndex((node) => node === device._id) === -1
    ) {
      this.currentDevicesIds.push(device._id);
    }
    return device;
  }

  pushOnSmartModbusNodes(node: any) {
    const endpoints = node.scheme.endpoints;
    let totalDevices = _.findWhere(endpoints, { id: "total" });

    for (let i = 0; i < totalDevices.current; i++) {
      let displayNameEndpoint = _.findWhere(endpoints, {
        id: "display_name_" + i,
      });
      let roomEndpoint = _.findWhere(endpoints, { id: "room_name_" + i });

      if (displayNameEndpoint && roomEndpoint) {
        let fakeNode: any = {
          smartModbus: {
            parent: node,
            displayNameEndpoint: displayNameEndpoint._id,
          },
          status: node.status,
          active: node.active,
          display_name: displayNameEndpoint.display_name,
          name: displayNameEndpoint.name,
          room: {
            name: roomEndpoint.name,
          },
          scheme: {
            code: node.scheme.code,
            name: node.scheme.name,
            endpoints: [],
          },
          currentTemp: '0',
          last_update: node.last_update,
          _id: node._id,
        };

        let displayTempEndpoint = _.findWhere(endpoints, {
          id: this.TYPE_ENDPOINTS.TARGET_TEMPERATURE + "_" + i,
        });
        if (displayTempEndpoint) fakeNode.scheme.endpoints.push(displayTempEndpoint);

        let modeEndpoint = _.findWhere(endpoints, {
          id: this.TYPE_ENDPOINTS.TEMPERATURE_MODE + "_" + i,
        });
        if (modeEndpoint) fakeNode.scheme.endpoints.push(modeEndpoint);

        let fanSpeedEndpoint = _.findWhere(endpoints, {
          id: this.TYPE_ENDPOINTS.FAN_SPEED + "_" + i,
        });
        if (fanSpeedEndpoint) fakeNode.scheme.endpoints.push(fanSpeedEndpoint);

        let statusTempEndpoint = _.findWhere(endpoints, {
          id: this.TYPE_ENDPOINTS.STATUS_SWITCH + "_" + i,
        });
        if (statusTempEndpoint) fakeNode.scheme.endpoints.push(statusTempEndpoint);

        let tempEndpoint = _.findWhere(endpoints, {
          id: this.TYPE_ENDPOINTS.TEMPERATURE + "_" + i,
        });
        if (tempEndpoint) {
          fakeNode.scheme.endpoints.push(tempEndpoint);
          fakeNode.currentTemp = parseFloat(tempEndpoint.current).toFixed(1);
        }

        if (displayNameEndpoint) fakeNode.scheme.endpoints.push(displayNameEndpoint);

        this.smartModbusNodes.push(fakeNode);
      }
    }
  }

  pushOnSmartClimateNodes(node: any) {
    const endpoints = node.scheme.endpoints;

    let fakeNode: any = {
      smartClimate: {
        parent: node,
        displayNameEndpoint: null,
      },
      status: node.status,
      display_name: node.display_name,
      active: node.active,
      name: node.name,
      room: {
        name: node.room ? node.room.name : "",
      },
      scheme: {
        code: node.scheme.code,
        name: node.scheme.name,
        endpoints: [],
      },
      last_update: node.last_update,
      _id: node._id,
    };

    endpoints.forEach(endpoint => {
      if (!['blind_relay_0', 'blind_relay_1', 'light_relay'].includes(endpoint.assigned_id)) {
        fakeNode.scheme.endpoints.push(endpoint);
      }
    });

    this.smartClimateNodes.push(fakeNode);
  }

  subscribers() {
    this.unsubscribers();

    this.ioConnection();
    this.ioConnectionDevice();
    this.ioMeasure();

    this.periodicity$ = interval(15 * 1000).subscribe(() => {
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

        if ([
          this.TYPE_ENDPOINTS.IP,
          this.TYPE_ENDPOINTS.RSSI,
          this.TYPE_ENDPOINTS.UPTIME,
          this.TYPE_ENDPOINTS.UPTIME2,
          this.TYPE_ENDPOINTS.VERSION,
          this.TYPE_ENDPOINTS.VCC
        ].includes(measure.id)) {
          return;
        }

        if (measure.id === this.TYPE_ENDPOINTS.TEMPERATURE || 
            measure.id.indexOf(this.TYPE_ENDPOINTS.TEMPERATURE + "_") === 0) {
          this.updateDeviceTemperature(measure);
        }
        
        this.updateDeviceLastUpdate(measure);
      });
  }

  updateDeviceTemperature(measure: any) {
    this.currentDevices.forEach((node: any) => {
      if (node._id == measure.device) {
        let tempEndpoint = _.findWhere(node.scheme.endpoints, {
          id: measure.id,
        });
        if (tempEndpoint) {
          tempEndpoint.current = measure.value;
          node.currentTemp = parseFloat(measure.value).toFixed(1);
        }
      }
    });
  }

  updateDeviceLastUpdate(measure: any) {
    let matchItem = this.currentDevices.find(
      (node) => node._id == measure.device
    );

    if (matchItem) {
      matchItem.last_update = measure.created_at;
      if (matchItem.smartModbus) {
        matchItem.smartModbus.parent.last_update = measure.created_at;
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
          type: 'text',
          placeholder: node.display_name || node.name,
        },
      ],
      buttons: [
        { text: this.cancelButtonString },
        {
          text: this.updateButtonString,
          handler: (promptData) => {
            if (promptData.nodeName.length !== 0) {
              let updatedNode;
              if (node.smartModbus) {
                let displayNameEndpointId = node.smartModbus.displayNameEndpoint;
                let displayNameEndpoint = _.findWhere(node.scheme.endpoints, {
                  _id: displayNameEndpointId,
                });
                node.display_name = promptData.nodeName;
                node = node.smartModbus.parent;

                displayNameEndpoint = _.findWhere(node.scheme.endpoints, {
                  _id: displayNameEndpointId,
                });
                if (displayNameEndpoint) {
                  displayNameEndpoint.display_name = promptData.nodeName;
                }
                updatedNode = {
                  display_name: promptData.nodeName,
                  building: node.building._id,
                  organization: node.organization,
                };
              } else {
                node.display_name = promptData.nodeName;
                updatedNode = {
                  display_name: promptData.nodeName,
                  building: node.building._id,
                  organization: node.organization,
                };
              }
              this.nodeService.update(node._id, updatedNode).subscribe(
                () => {
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

  async openModal(item: any) {
    const modal = await this.modalCtrl.create({
      component: 'ModalTempPage',
      componentProps: { data: item },
      cssClass: 'tiny-modal'
    });

    modal.onDidDismiss().then((data) => {
    });

    await modal.present();
  }

  openItem(device: any) {
    this.router.navigate(['device-temp/device-temp-detail'], {
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
