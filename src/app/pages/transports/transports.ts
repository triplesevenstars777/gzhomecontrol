import { Component } from "@angular/core";
import { NavController } from "@ionic/angular";
import { DomSanitizer } from "@angular/platform-browser";
import { AuthService } from "../../providers/api/auth.service";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "page-transports",
  templateUrl: "transports.html",
  styleUrl: './transports.scss',
  standalone: false
})
export class TransportsPage {
  private url = "https://timetable.gozmart.ch/";
  private UID: number;
  public iframeURL;

  constructor(
    public navCtrl: NavController,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    auth: AuthService
  ) {
    this.UID = auth.getAuthUser()._id;
    const PID = this.route.snapshot.paramMap.get("PID");
    
    // Handle all URL construction in constructor
    if (PID) {
      this.iframeURL = this.sanitizer.bypassSecurityTrustResourceUrl(
        `${this.url}post.php?uid=${this.UID}&pid=${PID}`
      );
    } else {
      this.iframeURL = this.sanitizer.bypassSecurityTrustResourceUrl(
        `${this.url}transports.php?uid=${this.UID}`
      );
    }
  }

  ionViewDidEnter() {
    const PID = this.route.snapshot.paramMap.get("PID");
    if (PID) {
      this.iframeURL = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.url + "post.php?uid=" + this.UID + "&pid=" + PID
      );
    } else {
      this.iframeURL = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.url + this.UID
      );
    }
  }

  ionViewDidLeave() {
    
    this.iframeURL = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.url + "transports.php?uid=" + this.UID
    );
  }
}
