import { Component } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { NodeAvailabilityProvider } from '../../providers/node-availability/node-availability';
import { ModalMenuPage } from '../../pages/modal-menu/modal-menu';


@Component({
  selector: 'fab-menu',
  templateUrl: 'fab-menu.html',
  styleUrl: "./fab-menu.scss",
  standalone: false
})
export class FabMenuComponent {
  public menuOpened: boolean = false;
  public showMenu: boolean = true;

  constructor(
    private modalCtrl: ModalController,
    private router: Router,
    private availability: NodeAvailabilityProvider,
    private platform: Platform
  ) {
    // Hide menu on specific pages
    this.router.events.subscribe((event) => {
      if (event['url']) {
        // List of pages where menu should be hidden
        const hideMenuPages = ['/transports', '/meterkit', '/news'];
        this.showMenu = !hideMenuPages.includes(event['url']);
      }
    });
  }


  stopAudio() {
    if (this.platform.is('cordova')) {
      try {
        const audio = new Audio();
        audio.pause();
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    }
  }

  async openModal() {
    this.availability.checkForNodeAvailabilityOnPushButton();
    this.stopAudio();

    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.menuOpened = true;
    });
    
    const modal = await this.modalCtrl.create({
      component: ModalMenuPage,
      cssClass: 'modal-fullscreen'
    });

    await modal.present();

    try {
      const { data } = await modal.onDidDismiss();
      setTimeout(() => {
        this.menuOpened = false;
      });
      if (data?.go) {
        await this.router.navigateByUrl(data.go, {
          onSameUrlNavigation: 'reload',
          skipLocationChange: false,
          replaceUrl: true
        });

      }
    } catch (error) {
      console.error('Modal dismiss error:', error);
      setTimeout(() => {
        this.menuOpened = false;
      });
    }
  }
}
