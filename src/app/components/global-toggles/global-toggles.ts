import { Component } from '@angular/core';
import { Constants } from '../../providers';
import { ActuatorService } from '../../providers/api/actuator.service';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { InTogglesPage } from '../../pages/global-settings/in-toggles/in-toggles.component';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'global-toggles',
  templateUrl: 'global-toggles.html',
  styleUrl: './global-toggles.scss',
  standalone: false
})
export class GlobalTogglesComponent { 

  public nodesToActuate: any;
  private KEY_NODES:string;
  public section: string;
  public leavingHomeActionsBeingRunString:string;
  public arrivingAtHomeActionsBeingRunString:string;
  public leavingHomeConfigMissingRedirectingToItString :string;
  public AtHomeConfigMissingRedirectingToItString: string;
  public acceptButtonString:string;
  public cancelButtonString:string;

  constructor(
    private alertCtrl: AlertController,
    private actuatorService: ActuatorService,
    public translateService: TranslateService,
    public navCtrl:NavController,
    // public navParams: NavParams
  ) {
    this.translateService.get('LEAVING_HOME_ACTIONS_BEING_RUN').subscribe((value) => {
      this.leavingHomeActionsBeingRunString = value;
    });
    this.translateService.get('ARRIVING_AT_HOME_ACTIONS_BEING_RUN').subscribe((value) => {
      this.arrivingAtHomeActionsBeingRunString = value;
    });
    this.translateService.get('ACCEPT_BUTTON').subscribe((value) => {
      this.acceptButtonString = value;
    });
    this.translateService.get('CANCEL_BUTTON').subscribe((value) => {
      this.cancelButtonString = value;
    });
    this.translateService.get('LEAVING_HOME_CONFIG_NOT_FOUND').subscribe((value) => {
      this.leavingHomeConfigMissingRedirectingToItString = value;
    });
    this.translateService.get('AT_HOME_CONFIG_NOT_FOUND').subscribe((value) => {
      this.AtHomeConfigMissingRedirectingToItString = value;
    });
  }

  ngOnInit(){
    this.KEY_NODES = Constants.APP_KEY+ ':toggle_nodes'; 

  }

  async leavingAction() {
    const nodesString = localStorage.getItem(`${this.KEY_NODES}:out`);
    let availability = 0;
    let nodes = {};
    if(nodesString) {
      nodes = JSON.parse(nodesString);
    }
    for(let key in nodes) {
      if (nodes[key].available === true) {
        availability++;
      }
      if(nodes[key].available) {
        for(let i=0; i<nodes[key].endpoints.length; i++) {
          const data = nodes[key].endpoints[i].data;
          if(data.value === null) { continue }
          this.actuatorService.create(data).subscribe((res) => {
          }, (err) => {
            console.error('Update error:::', err);
          });
        }
      }
    } 

    if (availability == 0) {
      await this.preRedirect('out', this.leavingHomeConfigMissingRedirectingToItString);
    } else {
      await this.actionDone(this.leavingHomeActionsBeingRunString);
    } 
  }

  async arrivingAction() {
    const nodesString = localStorage.getItem(`${this.KEY_NODES}:in`);
    let availability = 0;
    let nodes = {};
    if(nodesString) {
      nodes = JSON.parse(nodesString);
    }
    for(let key in nodes) {
      if (nodes[key].available === true) {
        availability++;
      }
      if(nodes[key].available) {
        for(let i=0; i<nodes[key].endpoints.length; i++) {
          const data = nodes[key].endpoints[i].data;
          if(data.value === null) { continue }

          this.actuatorService.create(data).subscribe((res) => {
          }, (err) => {
            console.error('Update error:::', err);
          });
        }
      }
    }
    if (availability == 0) {
      await this.preRedirect('in', this.AtHomeConfigMissingRedirectingToItString);
    } else {
      await this.actionDone(this.arrivingAtHomeActionsBeingRunString);
    } 
  }

  async preRedirect(section: string, message: string) {
    const alert = await this.alertCtrl.create({
      header: message,
      buttons: [
        { 
          text: this.cancelButtonString,
          role: 'cancel'
        },
        {
          text: this.acceptButtonString,
          handler: () => {
            this.navCtrl.navigateForward('/in-toggles', {
              state: { section }
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async actionDone(text: string) {
    const alert = await this.alertCtrl.create({
      header: text,
      buttons: [{
        text: this.acceptButtonString 
      }]
    });
    await alert.present();
  }
}
