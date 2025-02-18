import { Component, Input, SimpleChanges } from "@angular/core";
import { Constants } from "../../providers";
import { ActuatorService } from "../../providers/api/actuator.service";
import { Node } from "../../models/node.model";
import { AlertController } from "@ionic/angular";
import { NodeService } from "../../providers/api/node.service";
import { TranslateService } from "@ngx-translate/core";
import { CacheService } from "ionic-cache";

@Component({
  selector: "node-actuator",
  templateUrl: "node-actuator.html",
  styleUrl : './node-actuator.scss',
  standalone: false
})
export class NodeActuatorComponent {
  public device: any;
  public endpoints: any[];
  public transducers: any[];

  public TYPE_NODE: any = Constants.TYPE_NODE;

  public realTimeData: Node;
  public updatedName: any = null;
  public updatedNotification: any = null;
  /*
   * Strings variables used to set text translations
   */
  public cancelButtonString: string;
  public endpointNameEdit: string;
  public updateButtonString: string;
  public updateEndpointTitleString: string;

  @Input() name: any;
  @Input() data: Node;
  @Input() status: string;

  constructor(
    private actuatorService: ActuatorService,
    private alertCtrl: AlertController,
    private nodeService: NodeService,
    private cacheService: CacheService,
    public translateService: TranslateService
  ) {
    this.translateService
      .get([
        "CANCEL_BUTTON",
        "PLEASE_CHOOSE_ENDPOINT_NAME",
        "UPDATE_ENDPOINT_TITLE",
        "UPDATE_BUTTON",
      ])
      .subscribe((values) => {
        this.cancelButtonString = values["CANCEL_BUTTON"];
        this.endpointNameEdit = values["PLEASE_CHOOSE_ENDPOINT_NAME"];
        this.updateEndpointTitleString = values["UPDATE_ENDPOINT_TITLE"];
        this.updateButtonString = values["UPDATE_BUTTON"];
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log("this is change of node-actuator");
    console.log(changes);
    if (changes['data']) {
      if (changes['data'].currentValue) {
        this.device = changes['data'].currentValue;
        if (this.device.scheme) {
          this.transducers = [
            ...this.device.scheme.endpoints.filter(
              (item) => item.dir === "input"
            ),
          ];
          this.endpoints = [
            ...this.device.scheme.endpoints.filter(
              (item) => item.dir !== "input"
            ),
          ];
        }
      }
    }
  }

  ngOnInit() {}

  updateNotification(data) {
    let index = this.device.scheme.endpoints.findIndex(
      (item) => item._id == data.endpoint
    );
    this.device.scheme.endpoints[index].mobile_notification =
      data.currentNotifications;

    this.nodeService.update(this.device._id, this.device).subscribe(
      (data) => {
        this.updatedNotification = data;
      },
      (err) => {
        console.warn("failed to update!!");
      }
    );
  }

  async updateName(data) {
    const alert = await this.alertCtrl.create({
      header: this.updateEndpointTitleString,
      cssClass: 'accessible-alert',
      inputs: [
        {
          name: "endpointName",
          type: 'text',
        }
      ],
      buttons: [
        { 
          text: this.cancelButtonString,
          role: 'cancel'
        },
        {
          text: this.updateButtonString,
          handler: (value) => {
            if (!value.endpointName) {
              return false;
            }
            
            this.nodeService.show(this.device._id).subscribe(
              (node: any) => {
                let index = node.scheme.endpoints.findIndex(
                  (item) => item._id == data.endpoint
                );
                node.scheme.endpoints[index].display_name = value.endpointName;
                const nodeToUpdate = {
                  building: node.building,
                  apartment: node.apartment,
                  organization: node.organization,
                  room: node.room,
                  "scheme.endpoints": node.scheme.endpoints,
                };

                this.nodeService.update(this.device._id, nodeToUpdate).subscribe(
                  () => {
                    this.cacheService.clearAll();
                    data.currentName = value.endpointName;
                    this.updatedName = data;
                    
                    console.log(data);

                    requestAnimationFrame(() => {
                      const editButton = document.querySelector('.edit-button');
                      if (editButton) {
                        (editButton as HTMLElement).focus();
                      }
                    });
                  },
                  (err) => {
                    console.warn("endpoint not updated!!", err);
                  }
                );
              }
            );
            return true;
          }
        }
      ],
      backdropDismiss: true
    });
    
    await alert.present();
  }

  updateEndpoint(params) {
    const isDali = params.device.scheme
      ? params.device.scheme.code === "010005"
      : false;
    if (params.device._id && typeof params.device !== "string") {
      params = {
        ...params,
        device: params.device._id,
      };
    }
    this.actuatorService.create(params, isDali).subscribe(
      (res) => {
        this.cacheService.clearAll();
        if (res !== false && isDali) {
          this.actuatorService.release();
        }
      },
      (err) => {
        console.error("Update error:::", err);
      }
    );
  }
}
