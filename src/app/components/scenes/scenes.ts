import { Component, OnInit } from '@angular/core';
import { Scene } from '../../../models/scene.model';
import { ActuatorService } from '../../providers/api/actuator.service';
import { ScenesService } from '../../providers/api/scenes.service';
import { AlertController, NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ScenesEditPage } from '../../pages/global-settings/scenes/scenes-edit/scenes-edit';

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
  public loadingSceneId: string | null = null;

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

  configScene(id: string) {
    if (!id) return;
    
    // console.log('Starting scene configuration for ID:', id);
    
    // Get scene details using subscribe instead of toPromise
    this.scenesService.show(id).subscribe({
      next: (sceneData: any) => {
        // console.log('Scene data received:', sceneData);
        this.scene = sceneData as Scene;
        
        if (!this.scene) {
          console.error('Scene not found');
          return;
        }

        // Show confirmation dialog
        this.showConfirmDialog(id);
      },
      error: (err) => {
        // console.error('Failed to load scene:', err);
        // this.showErrorAlert('Failed to load scene. Please try again.');
      }
    });
  }

  private async showConfirmDialog(id: string) {
    const confirmAlert = await this.alertCtrl.create({
      header: 'Confirm Scene',
      message: `Do you want to activate scene "${this.scene.name}"?`,
      buttons: [
        {
          text: this.cancelButtonString,
          role: 'cancel'
        },
        {
          text: this.acceptButtonString,
          handler: () => {
            this.executeSceneConfig(id);
          }
        }
      ],
      cssClass: 'alertCustom'
    });
    await confirmAlert.present();
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message: message,
      buttons: [this.acceptButtonString],
      cssClass: 'alertCustom'
    });
    await alert.present();
  }

  private async executeSceneConfig(id: string) {
    this.loadingSceneId = id;
    let availability = 0;
    let nodes: { [key: string]: NodeType } = {};
    
    // try {
    //   // Load and process nodes
    //   nodes = this.loadCurrentNodes(this.scene.devices);
      
    //   // Process each node
    //   for (const key in nodes) {
    //     const node = nodes[key];
    //     if (node.available) {
    //       availability++;
          
    //       // Process each endpoint for available nodes
    //       for (const endpoint of node.endpoints) {
    //         if (endpoint.value === null) continue;
            
    //         const data = {
    //           device: node.id,
    //           endpoint: endpoint.id,
    //           value: endpoint.value
    //         };
            
    //         try {
    //           console.log(`Executing scene '${this.scene.name}': Configuring device ${node.id}, endpoint ${endpoint.id} with value ${endpoint.value}`);
    //           await new Promise((resolve, reject) => {
    //             this.actuatorService.create(data).subscribe({
    //               next: (result) => {
    //                 console.log(`Successfully configured endpoint ${endpoint.id}`);
    //                 resolve(result);
    //               },
    //               error: (err) => {
    //                 console.error(`Error updating endpoint ${endpoint.id} for device ${node.id}:`, err);
    //                 reject(err);
    //               }
    //             });
    //           });
    //         } catch (err) {
    //           console.error(`Error updating endpoint ${endpoint.id} for device ${node.id}:`, err);
    //           const alert = await this.alertCtrl.create({
    //             header: 'Error',
    //             message: `Failed to configure endpoint ${endpoint.id}. Please try again.`,
    //             buttons: [this.acceptButtonString],
    //             cssClass: 'alertCustom'
    //           });
    //           await alert.present();
    //           throw err; // Propagate error to main error handler
    //         }
    //       }
    //     }
    //   }
      
    //   // Show appropriate alert based on availability
    //   if (availability === 0) {
    //     await this.preRedirect(this.scene.name, this.SceneConfigMissingRedirectingToItString);
    //   } else {
    //     await this.actionDone(this.scene.name, this.SceneActionsBeingRunString);
    //   }
    // } catch (err) {
    //   console.error('Scene configuration error:', err);
    //   // Show error alert to user
    //   const alert = await this.alertCtrl.create({
    //     header: 'Error',
    //     message: 'Failed to configure scene. Please try again.',
    //     buttons: [this.acceptButtonString],
    //     cssClass: 'alertCustom'
    //   });
    //   await alert.present();
    // } finally {
    //   // Clear loading state
    //   this.loadingSceneId = null;
    // }
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
