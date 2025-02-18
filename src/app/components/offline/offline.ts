import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'offline',
  templateUrl: 'offline.html',
  styleUrl : './offline.scss',
  standalone: false
})
export class OfflineComponent {
  public isOffline: boolean = false;
  public offlineMessage: string = '';

  constructor(
    private translateService: TranslateService,
    private network: Network,
    private platform: Platform
  ) {
    this.translateService.get('OFFLINE_MESSAGE').subscribe((value) => {
      this.offlineMessage = value;
    });

    if (this.platform.is('cordova')) {
      // Watch network for a disconnect
      this.network.onDisconnect().subscribe(() => {
        this.isOffline = true;
      });

      // Watch network for a connection
      this.network.onConnect().subscribe(() => {
        this.isOffline = false;
      });
    } else {
      // Handle browser case
      window.addEventListener('online', () => {
        this.isOffline = false;
      });

      window.addEventListener('offline', () => {
        this.isOffline = true;
      });
    }
  }

  ngOnInit() {
    // Check initial network state
    if (this.platform.is('cordova')) {
      this.isOffline = this.network.type === 'none';
    } else {
      this.isOffline = !navigator.onLine;
    }
  }

  ngOnDestroy() {
    if (!this.platform.is('cordova')) {
      window.removeEventListener('online', () => {});
      window.removeEventListener('offline', () => {});
    }
  }
}
