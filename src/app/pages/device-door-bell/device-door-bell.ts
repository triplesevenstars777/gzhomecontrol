import { Component } from '@angular/core';
import { NavController, NavParams } from '@ionic/angular';

@Component({
  selector: 'page-device-door-bell',
  templateUrl: 'device-door-bell.html',
  standalone: false
})
export class DeviceDoorBellPage {

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams) {
  }

  ionViewDidLoad() {
  }

  accept() {
    this.navCtrl.pop(); // Dismiss the current page
  }

  cancel() {
    this.navCtrl.pop(); // Dismiss the current page
  }
}
