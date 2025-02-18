import { Component, OnDestroy, OnInit } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { NavController } from "@ionic/angular";
import { Router } from "@angular/router";
import moment from "moment";

import { AlertController } from "@ionic/angular";
import { Node, Endpoint } from "../../../models/node.model";
import { Constants, SocketService } from "../../../providers";
import { NodeService } from "../../../providers/api/node.service";
import { Subscription } from "rxjs";

interface DisplayEndpoint extends Endpoint {
  iconClass: string;
  rowClass: string;
  show_in_mobile: boolean;
  units?: { name: string; factor?: number; offset?: number; }[];
}

function isMobileEndpoint(endpoint: Endpoint): endpoint is DisplayEndpoint {
  return 'show_in_mobile' in endpoint && endpoint.show_in_mobile === true;
}

interface NavigationState {
  device: Node;
}

interface Measure {
  device: string;
  endpoint: string;
  value: number;
  created_at: string;
}

interface UpdateData {
  currentName: string;
  endpoint: string;
}

@Component({
  selector: "page-devices-temp-detail",
  templateUrl: "devices-temp-detail.html",
  styleUrl : "./devices-temp-detail.scss",
  standalone: false
})
export class DeviceTempDetailPage implements OnInit, OnDestroy {
  public data: Node | null = null;
  public nodeUpdated: Node | null = null;
  public device: string | null = null;
  public status: string | null = null;
  public interval: number | null = null;
  public endpointName: UpdateData | null = null;
  public updatedNotification: string | null = null;
  public TYPE_ENDPOINTS = Constants.TYPE_ENDPOINTS;
  public TYPE_NODE = Constants.TYPE_NODE;
  public displayEndpoints: DisplayEndpoint[] = [];
  public lastUpdate: string = moment(new Date()).format("hh:mm:ss DD-MM-Y");

  private ioMeasure: Subscription = new Subscription();

  public cancelButtonString: string = '';
  public updateButtonString: string = '';
  public updateEndpointTitleString: string = '';
  public endpointNameEdit: string = '';

  public comfortLabel: string = '';
  public comfortValue: number = 0;
  public comfortLabelColor: string = '';

  constructor(
    private alertCtrl: AlertController,
    private nodeService: NodeService,
    private socketService: SocketService,
    public navCtrl: NavController,
    private router: Router,
    public translateService: TranslateService
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as NavigationState | undefined;
    this.data = state?.device ?? null;

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

  canActivate(): boolean {
    return this.data !== null;
  }

  ngOnInit() {
    this.initSocketIO();
    this.setDisplayEndpoints();
  }

  ngOnDestroy() {
    this.unsubscribers();
  }

  /*
   * Method to override the default back button action
   */
  setBackButtonAction(): void {
    this.router.navigate(['devices-temp'], {
      replaceUrl: true
    });
  }

  setDisplayEndpoints(): void {
    if (!this.data?.scheme?.endpoints) {
      return;
    }
    
    const endpoints = this.data.scheme.endpoints
      .filter((endpoint): endpoint is DisplayEndpoint => isMobileEndpoint(endpoint))
      .map(endpoint => {
      const { id } = endpoint;
      const baseIconClass = id.toLowerCase();
      let finalIconClass = baseIconClass;
      let rowClass = '';

      switch (true) {
        case id === this.TYPE_ENDPOINTS.HUMIDITY:
          finalIconClass = `icon-gz-${baseIconClass}`;
          rowClass = 'text-blue';
          break;
        case id.indexOf(this.TYPE_ENDPOINTS.TEMPERATURE+'_') === 0:
        case id === this.TYPE_ENDPOINTS.TEMPERATURE:
          finalIconClass = "icon-gz-temperature";
          rowClass = "text-orange";
          break;
        case id.indexOf(this.TYPE_ENDPOINTS.TARGET_TEMPERATURE+'_') === 0:
        case id === this.TYPE_ENDPOINTS.TARGET_TEMPERATURE:
          finalIconClass = "icon-gz-temperature";
          break;
        case id === this.TYPE_ENDPOINTS.CO2:
          finalIconClass = "icon-gz-co2-cloud";
          break;
        case id === this.TYPE_ENDPOINTS.PRESSURE:
          finalIconClass = "icon-gz-barometer";
          break;
        case id === 'battery':
          finalIconClass = 'icon-gz-half';
          break;
        default:
          finalIconClass = `icon-gz-${baseIconClass}`;
      }

      return {
        ...endpoint,
        iconClass: finalIconClass,
        rowClass,
        units: endpoint.units || []
      } as DisplayEndpoint;
    });

    this.displayEndpoints = endpoints;
    this.lastUpdate = moment(new Date()).format("hh:mm:ss DD-MM-Y");
    this.findComfortOperators();
  }

  initSocketIO(): void {
    this.ioMeasure = this.socketService.onMeasureCreated().subscribe((measure: Measure) => {
      this.updateMeasure(measure);
    });
  }

  updateMeasure(measure: Measure): void {
    if (!this.data || measure.device !== this.data._id || !this.data.scheme?.endpoints) {
      return;
    }

    const data = { ...this.data };
    data.last_update = measure.created_at;
    
    if (data.scheme?.endpoints) {
      for (let i = 0; i < data.scheme.endpoints.length; i++) {
        let endpointId = data.scheme.endpoints[i]._id;
        if (endpointId === measure.endpoint) {
          data.scheme.endpoints[i].current = measure.value;
        }
      }
    }

    this.findComfortOperators();
    this.data = data;
  }

  findComfortOperators(): void {
  const tempEndpoint = this.displayEndpoints.find(item => 
      item.id === this.TYPE_ENDPOINTS.TEMPERATURE
    );

  const humEndpoint = this.displayEndpoints.find(item => 
      item.id === this.TYPE_ENDPOINTS.HUMIDITY
    );

    if (tempEndpoint && humEndpoint) {

      this.comfortValue = this.getComfort( tempEndpoint.current, humEndpoint.current);

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
        this.comfortLabel = 'Excelent';
        this.comfortLabelColor = 'green';
      }
    }
  }

  /**
   * Returns percent value of confort index, based on internal temperature & humidity
   *
   * @param temp
   * @param hum
   */
  getComfort(temp: number, hum: number): number {
  const tempMean = 22.5;
  const humidityMean = 40;
  // Temperature threshold, minimum temperature at home
  const tempTH = 2.5;
  // Humidity threshold, minimum humidity at home
  const humTH = 15;

  const tempG = this.getGaussian(temp, tempMean, tempTH);
  const humG = this.getGaussian(hum, humidityMean, humTH);
  const real = Math.sqrt(tempG * humG);

    return Math.ceil(real / 10) * 10;
  }

  getGaussian(x: number, u: number, t: number): number {
    return 100 * Math.exp(-((x - u) * (x - u)) / (2 * t * t));
  }

openItem(endpoint: DisplayEndpoint) {
    this.router.navigate(["device-temp/device-temp-graphs"], {
      state: {
        device: this.data, // Ensure this.data is the correct device object
        endpoint: endpoint // Ensure the endpoint is correctly passed
      },
      replaceUrl: true
    });
}

  async updateName(dataUpdate: UpdateData): Promise<void> {
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
          handler: async (promptData): Promise<boolean> => {
            if (!promptData.endpointName) {
              const alert = await this.alertCtrl.create({
                message: this.endpointNameEdit,
                buttons: ['OK']
              });
              await alert.present();
              return false;
            }

            if (!this.data?.scheme?.endpoints || !this.data._id) {
              return false;
            }

            const index = this.data.scheme.endpoints.findIndex(
              item => item._id === dataUpdate.endpoint
            );
            
            if (index === -1) {
              return false;
            }

            this.data.scheme.endpoints[index].display_name = promptData.endpointName;

            return new Promise<boolean>(resolve => {
              this.nodeService.update(this.data!._id!, this.data!).subscribe({
                next: () => {
                  dataUpdate.currentName = promptData.endpointName;
                  this.endpointName = dataUpdate;
                  resolve(true);
                },
                error: err => {
                  console.warn("endpoint not updated!!", err);
                  resolve(false);
                }
              });
            });
          }
        }
      ]
    });

    await alert.present();
  }

  unsubscribers(): void {
    if (this.ioMeasure) {
      this.ioMeasure.unsubscribe();
    }
  }

}
