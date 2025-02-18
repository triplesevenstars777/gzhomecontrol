import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from '@ionic/angular';

@IonicPage()
@Component({
  selector: 'page-device-panic',
  templateUrl: 'device-panic.html',
})
export class DevicePanicPage {

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
