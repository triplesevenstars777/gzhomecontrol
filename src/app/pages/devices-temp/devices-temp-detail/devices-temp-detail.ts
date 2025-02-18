import { Component } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { ActivatedRoute, Router } from '@angular/router';
import moment from "moment";
import { AlertController } from "@ionic/angular";
import { Node } from "../../../models/node.model";
import { Constants, SocketService } from "../../../providers";
import { NodeService } from "../../../providers/api/node.service";
import { Subscription } from "rxjs";


interface ExtendedEndpoint {
  id: string;
  _id: string;
  show_in_mobile: boolean;
  iconClass?: string;
  rowClass?: string;
  current?: any;
  display_name?: string;
}

@Component({
  selector: "page-devices-temp-detail",
  templateUrl: "devices-temp-detail.html",
  styleUrl: "./devices-temp-detail.scss",
  standalone: false
})
export class DeviceTempDetailPage {
  public data: Node | null = null; // Initialize as null
  public nodeUpdated: Node | null = null; // Initialize as null
  public device: string | null = null; // Initialize as null
  public status: any;
  public interval: any;
  public endpointName: any = null;
  public updatedNotification: any = null;
  public TYPE_ENDPOINTS = Constants.TYPE_ENDPOINTS;
  public TYPE_NODE = Constants.TYPE_NODE;
  public displayEndpoints: any[] = [];
  public lastUpdate: string = moment(new Date()).format("hh:mm:ss DD-MM-Y");

  private ioMeasure: Subscription | null = null; // Initialize as null

  public cancelButtonString: string;
  public updateButtonString: string;
  public updateEndpointTitleString: string;
  public endpointNameEdit: string;

  public comfortLabel: string;
  public comfortValue: number | null = null; // Initialize as null
  public comfortLabelColor: string;

  constructor(
    private alertCtrl: AlertController,
    private nodeService: NodeService,
    private socketService: SocketService,
    private router: Router,
    public route: ActivatedRoute,
    public translateService: TranslateService
  ) {
    const deviceParam = this.route.snapshot.paramMap.get("device");
    if (deviceParam) {
      try {
        this.data = JSON.parse(deviceParam) as Node;
      } catch {
        this.data = null;
      }
    }
  
    this.translateService.get([
      'CANCEL_BUTTON',
      'PLEASE_CHOOSE_ENDPOINT_NAME',
      'UPDATE_BUTTON',
      'UPDATE_ENDPOINT_TITLE'
    ]).subscribe(values => {
      this.cancelButtonString = values['CANCEL_BUTTON'];
      this.endpointNameEdit = values['PLEASE_CHOOSE_ENDPOINT_NAME'];
      this.updateEndpointTitleString = values['UPDATE_BUTTON'];
      this.updateButtonString = values['UPDATE_ENDPOINT_TITLE'];
    });
  }

  ionViewCanEnter() {
    return this.data !== null;
  }

  ionViewDidLoad() {
    this.initSocketIO();
    this.setDisplayEndpoints();
  }

  setDisplayEndpoints() {
    if (!this.data?.scheme?.endpoints) {
      return; // Ensure data is valid
    }
  
    for (const endpoint of this.data.scheme.endpoints) {
      const extendedEndpoint = endpoint as unknown as ExtendedEndpoint;
      if (extendedEndpoint.show_in_mobile) {
        console.log(`Icon class: ${extendedEndpoint.id.toLowerCase()}`);
        extendedEndpoint.iconClass = extendedEndpoint.id.toLowerCase();
        extendedEndpoint.rowClass = '';
  
        switch (true) {
          case extendedEndpoint.iconClass == this.TYPE_ENDPOINTS.HUMIDITY:
            extendedEndpoint.iconClass = 'icon-gz-' + extendedEndpoint.iconClass;
            extendedEndpoint.rowClass = 'text-blue';
            break;
          case extendedEndpoint.iconClass.indexOf(this.TYPE_ENDPOINTS.TEMPERATURE + '_') == 0:
          case extendedEndpoint.iconClass == this.TYPE_ENDPOINTS.TEMPERATURE:
            extendedEndpoint.iconClass = "icon-gz-temperature";
            extendedEndpoint.rowClass = "text-orange";
            break;
          case extendedEndpoint.iconClass.indexOf(this.TYPE_ENDPOINTS.TARGET_TEMPERATURE + '_') == 0:
          case extendedEndpoint.iconClass == this.TYPE_ENDPOINTS.TARGET_TEMPERATURE:
            extendedEndpoint.iconClass = "icon-gz-temperature";
            break;
          case extendedEndpoint.iconClass == this.TYPE_ENDPOINTS.CO2:
            extendedEndpoint.iconClass = "icon-gz-co2-cloud";
            break;
          case extendedEndpoint.iconClass == this.TYPE_ENDPOINTS.PRESSURE:
            extendedEndpoint.iconClass = "icon-gz-barometer";
            break;
          case extendedEndpoint.iconClass == 'battery':
            extendedEndpoint.iconClass = 'icon-gz-half';
            break;
          default:
            extendedEndpoint.iconClass = "icon-gz-" + extendedEndpoint.iconClass;
        }
  
        this.displayEndpoints.push(extendedEndpoint);
        this.lastUpdate = moment(new Date()).format("hh:mm:ss DD-MM-Y");
      }
    }
  
    this.findComfortOperators();
  }

  initSocketIO() {
    this.ioMeasure = this.socketService.onMeasureCreated().subscribe((measure: any) => {
      this.updateMeasure(measure);
    });
  }

  updateMeasure(measure: any) {
    if (!this.data || measure.device !== this.data._id) {
      return;
    }

    const updatedData = { ...this.data } as Node;
    if (updatedData.scheme?.endpoints) {
      updatedData.last_update = measure.created_at;
      for (let i = 0; i < updatedData.scheme.endpoints.length; i++) {
        const endpointId = updatedData.scheme.endpoints[i]._id;
        if (endpointId === measure.endpoint) {
          updatedData.scheme.endpoints[i].current = measure.value;
        }
      }
    }

    this.findComfortOperators();
    this.data = updatedData;
  }

  findComfortOperators() {
    const tempEndpoint = this.displayEndpoints.find((item: any) => {
      return item.id == this.TYPE_ENDPOINTS.TEMPERATURE && item.show_in_mobile;
    });

    const humEndpoint = this.displayEndpoints.find((item: any) => {
      return item.id == this.TYPE_ENDPOINTS.HUMIDITY && item.show_in_mobile;
    });

    if (tempEndpoint && humEndpoint) {
      this.comfortValue = this.getComfort(tempEndpoint.current, humEndpoint.current);

      if (this.comfortValue < 26) {
        this.comfortLabel = 'Bad';
        this.comfortLabelColor = 'red';
      } else if (this.comfortValue < 51) {
        this.comfortLabel = 'Medium';
        this.comfortLabelColor = 'orange';
      } else if (this.comfortValue < 76) {
        this.comfortLabel = 'Good';
        this.comfortLabelColor = 'blue';
      } else {
        this.comfortLabel = 'Excellent';
        this.comfortLabelColor = 'green';
      }
    }
  }

  getComfort(temp: number, hum: number) {
    let tempMean = 22.5;
    let humidityMean = 40;
    let tempTH = 2.5;
    let humTH = 15;

    let tempG = this.getGaussian(temp, tempMean, tempTH);
    let humG = this.getGaussian(hum, humidityMean, humTH);

    let real = Math.sqrt(tempG * humG);
    return Math.ceil(real / 10) * 10;
  }

  getGaussian(x: number, u: number, t: number) {
    return 100 * Math.exp(-((x - u) * (x - u)) / (2 * t * t));
  }

  openItem(endpoint: any) {
    this.router.navigate(["DeviceTempGraphsPage"], {
      queryParams: {
        device: this.data,
        endpoint: endpoint
      }
    });
  }

  async updateName(dataUpdate: any) {
    const alert = await this.alertCtrl.create({
      header: this.updateEndpointTitleString,
      inputs: [
        {
          name: "endpointName",
          placeholder: dataUpdate.currentName
        }
      ],
      buttons: [
        { text: this.cancelButtonString },
        {
          text: this.updateButtonString,
          handler: (promptData: { endpointName: string }) => {
            if (promptData.endpointName !== "") {
              if (this.data?.scheme?.endpoints) {
                const index = this.data.scheme.endpoints.findIndex(
                  item => item._id == dataUpdate.endpoint
                );
                if (index !== -1 && this.data._id) {
                  this.data.scheme.endpoints[index].display_name = promptData.endpointName;
                  this.nodeService.update(this.data._id, this.data).subscribe(
                    data => {
                      dataUpdate.currentName = promptData.endpointName;
                      this.endpointName = dataUpdate;
                    },
                    err => {
                      console.warn("endpoint not updated!!");
                    }
                  );
                }
              }
              return true;
            }
            return false;
          }
        }
      ]
    });
  
    await alert.present();
  }

  unsubscribers() {
    if (this.ioMeasure) {
      this.ioMeasure.unsubscribe();
    }
  }

  ionViewWillLeave() {
    this.unsubscribers();
  }
}