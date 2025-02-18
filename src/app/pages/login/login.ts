import { Component, OnInit } from '@angular/core';
// import { TranslateService } from '@ngx-translate/core';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

import { AuthService } from '../../providers/api/auth.service';
import { DeviceService } from '../../providers/device/device.service';
import { Constants } from '../../providers/constants';
import {SocketService} from "../../providers/socket.service"
import { environment } from '../../../environments/environment';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
  styleUrls: ['./login.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  public account: { email: string, password: string, remember?: boolean } = {
    email: '',
    password: '',
    remember: false
  };
  public rememberMe = true;
  public appVersion = "";
  private loginErrorString: string = 'Login failed. Please check your credentials.';
  private notAvailableString: string = 'Server not available. Please try again later.';
  public lockLogin: boolean = false;
  public isWallTablet: boolean = false;
  public isLoading: boolean = false;

  public TYPE_ENDPOINTS = Constants.TYPE_ENDPOINTS;
  
  private lockLoginSubscription$: Subscription = new Subscription();
  private loadApiUrlSubscription$: Subscription = new Subscription();
  
  public isLockLoginSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private deviceService: DeviceService,
    private socketService: SocketService,
    private router: Router,
    private auth: AuthService,
    private toastCtrl: ToastController,
  ) {
    this.appVersion = environment.version;

    if(this.deviceService.isWallTablet()) 
    {
      this.isWallTablet = true;
      this.rememberMe = true;
    }
  }

  ngOnInit() {
    this.loadApiUrl();
  }

  isLoginLocked() : Observable<boolean> {
    return this.isLockLoginSubject.asObservable();
  }

  hasApiUrl() : boolean {
    return !this.lockLogin;
  }

  rememberMeUpdate(event: any) {
    this.rememberMe = event.detail.checked;
    this.account.remember = this.rememberMe;
  }

  async showToast(message: string, duration: number = 3000) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: duration,
      position: 'top',
      cssClass: 'custom-toast',
      mode: 'ios',
      translucent: true,
      animated: true,
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel',
          side: 'end'
        }
      ]
    });
    await toast.present();
  }

  loadApiUrl() {
    if (this.loadApiUrlSubscription$) {
      this.loadApiUrlSubscription$.unsubscribe();
    }

    this.loadApiUrlSubscription$ = this.auth.loadApiUrl().subscribe({
      next: (res: any) => {
        this.lockLogin = false;
        this.isLockLoginSubject.next(false);
      },
      error: async (err: any) => {
        this.lockLogin = true;
        this.isLockLoginSubject.next(true);
        await this.showToast(this.notAvailableString, 5000);
      }
    });
  }

  async doLogin() {
    if (this.isLoading) return;
    if (!this.account.email || !this.account.password) {
      await this.showToast('Please enter email and password');
      return;
    }

    try {
      this.isLoading = true;
      this.auth.doLogin(this.account, this.rememberMe).subscribe({
        next: async (resp: any) => {
          if (resp.success) {
            if (this.auth.getAuthToken()) {
              await this.socketService.initSocket();
              this.router.navigate(['/dashboard'], { replaceUrl: true });
            } else {
              await this.showToast('Authentication failed: Missing token');
            }
          } else {
            await this.showToast(resp.message || 'Login failed');
          }

          this.isLoading = false;
        },
        error: async (err: any) => {
          await this.showToast(this.loginErrorString);
          this.isLoading = false;
        }
      });
    } catch (error) {
      this.isLoading = false;
      await this.showToast('An error occurred during login');
    }
  }

  ngOnDestroy() {
    if (this.lockLoginSubscription$) {
      this.lockLoginSubscription$.unsubscribe();
    }
    if (this.loadApiUrlSubscription$) {
      this.loadApiUrlSubscription$.unsubscribe();
    }
  }
}
