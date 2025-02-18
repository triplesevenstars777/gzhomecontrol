import { Component, Input } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'main-footer',
  templateUrl: 'main-footer.html',
  styleUrl : './main-footer.scss',
  standalone: false
})
export class MainFooterComponent {
@Input() menuVisible: boolean = true;
@Input() showHomeButton: boolean = true;
@Input() showSettingsButton: boolean = true;

  constructor(
    private navCtrl: NavController,
    private translateService: TranslateService
  ) {}

  goHome() {
    this.navCtrl.navigateRoot('/home');
  }

  goToSettings() {
    this.navCtrl.navigateForward('/settings');
  }
}
