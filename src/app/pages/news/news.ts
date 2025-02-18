import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../providers/api/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'page-news',
  templateUrl: 'news.html',
  styleUrl: './news.scss',
  standalone: false
})
export class NewsPage {

  private url = 'https://news.gozmart.ch/';
  private UID: number;
  public iframeURL;

  constructor(
    public navCtrl: NavController,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    auth: AuthService
  ) {
    this.UID = auth.getAuthUser()._id;
    // Initialize iframeURL in constructor
    this.iframeURL = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.url + 'news.php?uid=' + this.UID
    );
  }

  ionViewDidEnter() {
    const PID = this.route.snapshot.paramMap.get('PID');
    if (PID) {
      this.iframeURL = this.sanitizer.bypassSecurityTrustResourceUrl(this.url + 'post.php?uid=' + this.UID + '&pid=' + PID);
    } else {
      this.iframeURL = this.sanitizer.bypassSecurityTrustResourceUrl(this.url + 'news.php?uid=' + this.UID);
    }
  }

  ionViewDidLeave() {
    this.iframeURL = this.sanitizer.bypassSecurityTrustResourceUrl(this.url + 'news.php?uid=' + this.UID);
  }

}
