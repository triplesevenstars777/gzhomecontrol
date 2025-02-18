import { Component, OnInit } from '@angular/core';
import { Scene } from '../../../models/scene.model';
import { ActuatorService } from '../../providers/api/actuator.service';
import { ScenesService } from '../../providers/api/scenes.service';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ScenesEditPage } from '../../pages/global-settings/scenes/scenes-edit/scenes-edit';
import { NavController } from '@ionic/angular';

interface ApiResponse {
  docs: Scene[];
}

interface NodeType {
  id: string;
  available: boolean;
  active: boolean;
  endpoints: Scene['devices'][number]['endpoints'];
}

@Component({
  selector: 'scenes',
  templateUrl: 'scenes.html',
  styleUrl : './scenes.scss',
  standalone: false
})
export class ScenesComponent implements OnInit {
  public scenes: Scene[] = [];
  public scene!: Scene;
  public nodesToActuate: { [key: string]: NodeType } = {};
  public acceptButtonString: string = '';
  public cancelButtonString: string = '';
  public SceneConfigMissingRedirectingToItString: string = '';
  public SceneActionsBeingRunString: string = '';

  constructor(
    private alertCtrl: AlertController,
    private actuatorService: ActuatorService,
    private scenesService: ScenesService,
    public translateService: TranslateService,
    public navCtrl: NavController,
    // public navParams: NavParams
  ) {
    this.translateService.get('ACCEPT_BUTTON').subscribe((value) => {
      this.acceptButtonString = value;
    });
    this.translateService.get('CANCEL_BUTTON').subscribe((value) => {
      this.cancelButtonString = value;
    });
    this.translateService.get('SCENE_CONFIG_NOT_FOUND').subscribe((value) => {
      this.SceneConfigMissingRedirectingToItString = value;
    });
    this.translateService.get('SCENE_ACTIONS_BEING_RUN').subscribe((value) => {
      this.SceneActionsBeingRunString = value;
    });
  }

  ngOnInit() {
    this.scenesService.showAll({}).subscribe((response: any) => {
      this.scenes = (response as ApiResponse).docs.filter(scene => scene.active === true);
    });
  }

  async configScene(id: string) {
    if (!id) return;
    
    let availability = 0;
    let nodes: { [key: string]: NodeType } = {};
    
    try {
      const res = await this.scenesService.show(id).toPromise();
      this.scene = res as Scene;

      if(this.scene) {
        nodes = this.loadCurrentNodes(this.scene.devices);
      }
      
      for(const key in nodes) {
        if (nodes[key].available === true) {
          availability++;
        }
        if(nodes[key].available) {
          for(const endpoint of nodes[key].endpoints) {
            if(endpoint.value === null) continue;
            
            const data = {
              device: nodes[key].id,
              endpoint: endpoint.id,
              value: endpoint.value
            };
            
            try {
              const updateRes = await this.actuatorService.create(data).toPromise();
            } catch (err) {
              console.error('Update error:::', err);
            }
          }
        }
      }
      
      if (availability === 0) {
        await this.preRedirect(this.scene.name, this.SceneConfigMissingRedirectingToItString);
      } else {
        await this.actionDone(this.scene.name, this.SceneActionsBeingRunString);
      }
    } catch (err) {
      console.error('Config error:', err);
    }
  }

  loadCurrentNodes(nodes: Scene['devices']) {    
    let actualNodes: { [key: string]: NodeType } = {};

    for (let i = 0; i < nodes.length; i++) {
      delete nodes[i]._id;
      let nodeId = nodes[i].id;
      actualNodes[nodeId] = {
        id: nodeId,
        available: nodes[i].available,
        active: nodes[i].active,
        endpoints: nodes[i].endpoints
      };
      for (let j = 0; j < nodes[i].endpoints.length; j++) {
        delete nodes[i].endpoints[j]._id;
      }
    }
    return actualNodes;
  }

  async preRedirect(name: string, message: string) {
    const alert = await this.alertCtrl.create({
      header: message.replace("$1", name),
      buttons: [
        { 
          text: this.cancelButtonString,
          role: 'cancel'
        },
        {
          text: this.acceptButtonString,
          handler: () => {
            this.navCtrl.navigateForward('/global-settings/scenes/scenes-edit', {
              state: { scene: this.scene }
            });
          }
        }
      ],
      cssClass: 'alertCustom'
    });
    await alert.present();
  }
  
  async actionDone(name: string, message: string) {
    const alert = await this.alertCtrl.create({
      header: message.replace("$1", name),
      buttons: [{
        text: this.acceptButtonString 
      }],
      cssClass: 'alertCustom'
    });
    await alert.present();
  }
}
