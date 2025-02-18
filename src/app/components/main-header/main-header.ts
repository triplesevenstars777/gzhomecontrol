import { Component, Input, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'main-header',
  templateUrl: 'main-header.html',
  styleUrls: ["./main-header.scss"],
  standalone: false
})
export class MainHeaderComponent implements OnInit {
  @Input() section: string;
  @Input() icon: string;
  @Input() homeVisible: boolean = true;
  @Input() showBackButton: boolean = true;
  @Input() showMenuButton: boolean = true;
  @Input() defaultHref: string = '/';

  dateDay: string;
  dateMonth: string;
  dateTime: string;
  dateDayName: string;
  tempDegrees: string;
  tempIcon: string;
  @Input() noDisturb: boolean = false;
  @Input() panic: boolean = false;
  WEATHER_ICONS: { [key: string]: string } = {
    'sunny': 'icon-gz-sun',
    'cloudy': 'icon-gz-cloud',
    'rainy': 'icon-gz-rain'
  };

  constructor(
    private navCtrl: NavController,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
  }

  private updateDateTime() {
    const now = new Date();
    this.dateDay = now.getDate().toString();
    this.dateMonth = now.toLocaleString('default', { month: 'short' });
    this.dateTime = now.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' });
    this.dateDayName = now.toLocaleString('default', { weekday: 'long' });
    
    // Default values for temperature (these should be updated from a weather service)
    this.tempDegrees = '25';
    this.tempIcon = 'sunny';
  }

  goBack() {
    this.navCtrl.back();
  }

  openMenu() {
    // Implement menu opening logic if needed
  }

  goToDashboard() {
    this.navCtrl.navigateRoot('/dashboard');
  }

  // Add a method to handle state changes
  updateState(state: { noDisturb: boolean; panic: boolean }) {
    this.noDisturb = state.noDisturb;
    this.panic = state.panic;
  }
}
