import { Component, ViewChild } from "@angular/core";
import { IonicPage, NavController, NavParams, Navbar } from "@ionic/angular";
import { ScenesService } from "../../../providers/api/scenes.service";
import { Scene } from "../../../models/scene.model";
import { Constants } from "../../../providers";

/**
 * Generated class for the ScenesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: "page-scenes",
  styleUrl: './sences.scss',
  templateUrl: "scenes.html",
})
export class ScenesPage {
  @ViewChild(Navbar) navBar: Navbar;
  public scene: Scene;
  public scenes: any[] = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private scenesService: ScenesService
  ) {}

  ionViewDidLoad() {
    this.loadScenes();
    this.navBar.backButtonClick = (e: UIEvent) => {
      /// add this event
      this.navCtrl.pop();
    };
  }

  ionViewDidEnter() {
    this.loadScenes();
  }

  ionViewWillEnter() {
    this.loadScenes();
  }

  loadScenes() {
    this.scenesService.showAll({}).subscribe((response: any) => {
      this.scenes = response.docs;
    });
  }

  addScene() {
    this.navCtrl.push("ScenesAddPage");
  }

  async editScene(id: string) {
    await localStorage.setItem(
      Constants.APP_KEY + ":edit-scene",
      JSON.stringify({ id: id })
    );
    this.navCtrl.push("ScenesEditPage", { id: id });
  }

  changeActive(id: string, active: boolean) {
    this.scenesService.update(id, { active: active }).subscribe(
      (res) => {
        this.loadScenes();
      },
      (err) => {
        console.error("Update error:::", err);
      }
    );
  }

  deleteScene(id: string) {
    this.scenesService.delete(id).subscribe(
      (res) => {
        this.loadScenes();
      },
      (err) => {
        console.error("Created error:::", err);
      }
    );
  }
}
