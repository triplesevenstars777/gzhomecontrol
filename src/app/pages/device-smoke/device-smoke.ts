import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from '@ionic/angular';

@IonicPage()
@Component({
  selector: 'page-device-smoke',
  templateUrl: 'device-smoke.html',
})
export class DeviceSmokePage {

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController) {
  }

  ionViewDidLoad() {
  }

  accept() {
    this.viewCtrl.dismiss(true);
  }

  cancel() {
    this.viewCtrl.dismiss(false);
  }

}

