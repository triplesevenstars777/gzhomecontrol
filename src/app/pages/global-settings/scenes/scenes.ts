import { Component, OnInit } from "@angular/core";
import { NavController } from "@ionic/angular";
import { ScenesService } from "../../../providers/api/scenes.service";
import { Scene } from "../../../models/scene.model";
import { Constants } from "../../../providers";
import { Router } from "@angular/router";

@Component({
  selector: "app-scenes",
  styleUrls: ['./scenes.scss'],
  templateUrl: "scenes.html",
  standalone: false
})
export class ScenesPage {
  public scene: Scene;
  public scenes: any[] = [];

  constructor(
    public navCtrl: NavController,
    private router: Router,
    private scenesService: ScenesService
  ) {}

  ionViewDidLoad() {
    this.loadScenes();
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
    this.router.navigate(['global-settings/scenes/add'], { replaceUrl: true });
  }

  async editScene(id: string) {
    await localStorage.setItem(
      Constants.APP_KEY + ":edit-scene",
      JSON.stringify({ id: id })
    );
    this.router.navigate(['global-settings/scenes/edit', id], { replaceUrl: true });
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
        console.error("Delete error:::", err);
      }
    );
  }

  goBack() {
    this.router.navigate(['/global-settings'], {replaceUrl: true});
  }
}
