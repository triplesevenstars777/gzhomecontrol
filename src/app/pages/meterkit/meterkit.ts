import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../providers/api/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'page-meterkit',
  templateUrl: 'meterkit.html',
  styleUrl: "./meterkit.scss",
  standalone: false
})
export class MeterkitPage {
  private url = 'https://cloud.meterkit.com/login';
  private user: any;
  public meterkitUrl: SafeResourceUrl;

  constructor(
    public navCtrl: NavController,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    auth: AuthService
  ) {
    this.user = auth.getAuthUser();
    const params = `?email=${this.user.email}&password=meterkit`; 
    // Initialize URL in constructor
    this.meterkitUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.url + params);
  }
}
