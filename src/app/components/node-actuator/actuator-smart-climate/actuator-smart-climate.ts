import { Component, Input, Output, EventEmitter } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AlertController } from "@ionic/angular";
import { Subscription } from "rxjs";
import * as _ from "underscore";

import { Constants, SocketService } from '../../../providers';
import { ActuatorService } from "../../../providers/api/actuator.service";
import { NodeService } from "../../../providers/api/node.service";

@Component({
  selector: "actuator-smart-climate",
  templateUrl: "actuator-smart-climate.html",
  styleUrl : './actuator-smart-climate.scss',
  standalone: false
})
export class ActuatorSmartClimateComponent {
  @Output() setAction: EventEmitter<any> = new EventEmitter();
  @Output() endpointUpdateName: EventEmitter<any> = new EventEmitter();
  @Output() endpointUpdateNotification: EventEmitter<any> = new EventEmitter();
  
  @Input() device: any;
  @Input() endpoints: any;
  @Input() updatedName: any;
  @Input() updatedNotification: any;

  @Output() setEndpointNotification: EventEmitter<any> = new EventEmitter();

  public TYPE_ENDPOINTS: any = Constants.TYPE_ENDPOINTS;
  public endpointsUnassigneds: any = [];
  public lowEndpoint: any;
  public mediumEndpoint: any;
  public highEndpoint: any;

  public notificationsUp: boolean = false;
  public notificationsDown: boolean = false;

  private ioMeasure$: Subscription;
  /*
   * Strings variables used to set text translations
   */
  public cancelButtonString: string;
  public endpointNameEdit: string;
  public updateButtonString: string;
  public updateEndpointTitleString: string;

  constructor(
    private actuatorService: ActuatorService,
    private alertCtrl: AlertController,
    private nodeService: NodeService,
    private socketService: SocketService,
    public translateService: TranslateService
  ) {
    this.translateService.get([
      'CANCEL_BUTTON',
      'PLEASE_CHOOSE_ENDPOINT_NAME',
      'UPDATE_ENDPOINT_TITLE',
      'UPDATE_BUTTON'
    ]).subscribe(values => {
      this.cancelButtonString = values['CANCEL_BUTTON'];
      this.endpointNameEdit = values['PLEASE_CHOOSE_ENDPOINT_NAME'];
      this.updateEndpointTitleString = values['UPDATE_ENDPOINT_TITLE'];
      this.updateButtonString = values['UPDATE_BUTTON'];
    });
  }

  ngOnInit() {
    this.lowEndpoint = _.findWhere(this.endpoints, { id: this.TYPE_ENDPOINTS.RELAY_0 });
    this.mediumEndpoint = _.findWhere(this.endpoints, { id: this.TYPE_ENDPOINTS.RELAY_1 });
    this.highEndpoint = _.findWhere(this.endpoints, { id: this.TYPE_ENDPOINTS.RELAY_2 });

    for (let i = 0; i < this.endpoints.length; i++) {
      let endpoint = this.endpoints[i];
      if (!endpoint.assigned_id) {
        if(endpoint._id != this.lowEndpoint._id &&
          endpoint._id != this.mediumEndpoint._id &&
          endpoint._id != this.highEndpoint._id){
            this.endpointsUnassigneds.push(endpoint);
        }
      }
    }
  }

  ionViewDidLoad() {
    this.initSocketIO();
  }

  initSocketIO() {
    this.ioMeasure$ = this.socketService.onMeasureCreated().subscribe((measure: any) => {
      this.updateMeasure(measure);
    });
  }

  updateMeasure(measure: any) {
    if (measure.device !== this.device._id) {
      return;
    }

    this.device.last_update = measure.created_at;
    for (let i = 0; i < this.device.scheme.endpoints.length; i++) {
      if (this.device.scheme.endpoints[i]._id === measure.endpoint) {
        this.device.scheme.endpoints[i].current = measure.value;
      }
    }
  }

  onChangeEndpoint(endpoint: any) {
    this.setAction.emit({
      device: this.device._id,
      endpoint: endpoint._id,
      value: endpoint.current == 'Off' ? 'On' : 'Off'
    });
  }

  updateNotification(data) {
    let index = this.device.scheme.endpoints.findIndex(
      item => item._id == data.endpoint
    );
    this.device.scheme.endpoints[index].mobile_notification = data.currentNotifications;

    this.nodeService.update(this.device._id, this.device).subscribe(
      data => {
        this.updatedNotification = data;
      },
      err => {
        console.warn("failed to update!!");
      }
    );
  }

  async updateName(data) {
    const alert = await this.alertCtrl.create({
      header: this.updateEndpointTitleString,
      inputs: [
        {
          name: "endpointName",
          placeholder: data.currentName
        }
      ],
      buttons: [
        { text: this.cancelButtonString },
        {
          text: this.updateButtonString,
          handler: async (value) => {
            if (value.endpointName !== "") {
              this.nodeService.show(this.device._id).subscribe((node: any) => {
                //Update device
                let index = node.scheme.endpoints.findIndex(item => item._id == data.endpoint);
                node.scheme.endpoints[index].display_name = value.endpointName;

                this.nodeService.update(this.device._id, node).subscribe(
                  response => {
                    data.currentName = value.endpointName;
                    this.updatedName = data;
                  },
                  err => {
                    console.warn("endpoint no updated!!");
                  }
                );
              });
              return true;
            } else {
              alert.message = this.endpointNameEdit;
              return false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  updateEndpoint(params) {

    if( params.device._id && typeof params.device !== 'string'){
      params = {
        ...params,
        device: params.device._id
      };
    }
    this.actuatorService.create( params ).subscribe(
      res => {},
      err => {
        console.error("Update error:::", err);
      }
    );
  }

  unsubscribers() {
    if (this.ioMeasure$) {
      this.ioMeasure$.unsubscribe();
    }
  }

  ionViewWillLeave() {
    this.unsubscribers();
  }
}
