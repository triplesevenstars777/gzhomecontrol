import { Component, ViewChild, ElementRef, ChangeDetectorRef, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { ModalController, NavController } from "@ionic/angular";
import { Subscription } from "rxjs";

import { DeviceService } from "../../providers/device/device.service";
import { NodeAvailabilityProvider } from "../../providers/node-availability/node-availability";

@Component({
  selector: "page-modal-menu",
  templateUrl: "modal-menu.html",
  styleUrl: "./modal-menu.scss",
  standalone: false
})
export class ModalMenuPage {
  @ViewChild("wheel") wheel: ElementRef;

  private circles: any;
  private nodeAvailability$: Subscription;

  public circlesShow: boolean = true;
  public isWallTablet: boolean = false;
  public nodeAvailable = {
    lights: false,
    blinds: false,
    temp: false,
    clima: false,
    sensors: false,
    meterkit: false,
    news: false,
    heaters: false,
    mailboxes: false,
    transports: false
  };

  constructor(
    private modalCtrl: ModalController,
    private deviceService: DeviceService,
    private availability: NodeAvailabilityProvider,
    private router: Router,
    private navCtrl: NavController,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    if (this.deviceService.isWallTablet()) {
      this.isWallTablet = true;
    }
  }

  ngAfterViewInit() {
    // Subscribe to node availability updates
    this.nodeAvailability$ = this.availability.availabilityListener().subscribe(
      res => {
        this.ngZone.run(() => {
          this.nodeAvailable = res;
          this.cdr.detectChanges();
        });
      },
      err => {}
    );

    // Run DOM manipulations outside Angular
    this.ngZone.runOutsideAngular(() => {
      this.circles = document.getElementsByClassName("circle");
      const transcludeDiv = document.getElementById("ionic-wheel");
      if (!transcludeDiv) return;

      const n: number = this.circles.length;
      if (n === 0) return;

      const r: number =
        Number(window.getComputedStyle(transcludeDiv).height.slice(0, -2)) / 2 -
        Number(window.getComputedStyle(this.circles[0]).height.slice(0, -2)) / 2;

      const frags: number = 360 / n;
      const theta: number[] = [];
      for (let i = 0; i <= n; i++) {
        theta.push((frags / 180) * i * Math.PI);
      }

      const mainHeight: number =
        parseInt(window.getComputedStyle(transcludeDiv).height.slice(0, -2)) /
        1.2;

      for (let i = 0; i < this.circles.length; i++) {
        this.circles[i].posx = Math.round(r * Math.cos(theta[i])) + "px";
        this.circles[i].posy = Math.round(r * Math.sin(theta[i])) + "px";
        this.circles[i].style.top =
          mainHeight / 2 - parseInt(this.circles[i].posy.slice(0, -2)) + "px";
        this.circles[i].style.left =
          mainHeight / 2 + parseInt(this.circles[i].posx.slice(0, -2)) + "px";
      }

      setTimeout(() => {
        this.showCircles();
      }, 500);
    });
  }

  showCircles() {
    // Run DOM manipulations outside Angular
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        for (let i = 0; i < this.circles.length; i++) {
          if (!this.circlesShow) {
            this.circles[i].classList.add("active");
          } else {
            this.circles[i].classList.remove("active");
          }
        }
        // Run state changes inside Angular zone
        this.ngZone.run(() => {
          this.circlesShow = !this.circlesShow;
          this.cdr.detectChanges();
        });
      });
    });
  }

  close() {
    // First show/hide circles
    this.showCircles();
    // Then dismiss modal in next cycle
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.modalCtrl.dismiss(false);
        });
      });
    });
  }

  async goToPage(page: string) {
    // First hide circles
    this.showCircles();
    try {
      // First dismiss the modal
      await this.modalCtrl.dismiss();
      
      // Small delay to ensure modal is fully dismissed
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Use NavController for navigation
      await this.navCtrl.navigateRoot(page, {
        animated: true,
        animationDirection: 'forward'
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  openApp() {
    // First hide circles
    this.showCircles();
    // Then dismiss and start app in next cycle
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.modalCtrl.dismiss(false).then(() => {
            (window as any).startApp
              .set({
                application: "com.d0pam1n.doorphone"
              })
              .start(
                () => {
                  /* success */
                  console.log("OK");
                },
                error => {
                  /* fail */
                  alert(error);
                }
              );
          });
        });
      });
    });
  }

  ngOnDestroy() {
    if (this.nodeAvailability$) {
      this.nodeAvailability$.unsubscribe();
    }
  }
}
