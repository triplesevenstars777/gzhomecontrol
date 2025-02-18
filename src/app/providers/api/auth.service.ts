import { Injectable } from "@angular/core";
import * as moment from "moment";
import { Observable, Subject, BehaviorSubject } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { SocketService } from "../socket.service";
import { environment } from "../../../environments/environment";
import { UserStorage } from "../user/user-storage";
import { Settings } from '../settings/settings';
import { map, mergeMap } from 'rxjs/operators';



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private APP_KEY;
  private currentToken: string = "";
  private currentUser: any;

  private logout$: Subject<any> = new Subject();
  private redirect$: Subject<any> = new Subject();

  isLoginSubject = new BehaviorSubject<boolean>(this.hasToken());

  constructor(
    private socketService: SocketService,
    private http: HttpClient,
    private userStorage: UserStorage,
    public settings: Settings
  ) {

    this.APP_KEY = environment.id;
  }

  logoutListener() {
    return this.logout$.asObservable();
  }

  goToPageInitListener() {
    return this.redirect$.asObservable();
  }

  loadApiUrl(): Observable<any> {
    return Observable.create((observable) => {
      if (environment.production) {
        const API_URL = this.userStorage.API_URL;
        if (!API_URL) {
          this.requestToUrlServer().subscribe(
            (res) => {
              observable.next({
                success: true,
              });
            },
            (err) => {
              observable.error({
                success: false,
              });
            }
          );
        } else {
          this.socketService.setUrl(API_URL);

          observable.next({
            success: true,
          });
        }
      } else {
        const API_URL = "https://gzre-dev.gozmart.ch/";
        this.userStorage.API_URL = API_URL;

        this.socketService.initSocket(API_URL);

        observable.next({
          success: true,
        });
      }
    });
  }

  requestToUrlServer() {
    return this.http
      .get("https://route.gozmart.ch/getURL?app=" + this.APP_KEY)
      .pipe(
        map((data: any) => {
          // console.log("URL Data", data);
          this.userStorage.API_URL = data.url;
          this.socketService.initSocket(data.url);
          return data.url;
        })
      );
  }


  doLogin(data: any, remember: boolean) {
    return this.requestToUrlServer().pipe(
      mergeMap(url => this.http.post(url + "api/v1/users/login", {
        email: data.email,
        password: data.password,
      })),
      map((res: any) => {
        return this.setSession(res, remember, data);
      })
    );
  }


  rememberDoLogin() {
    return new Observable((observer) => {
      const rememberStorage = this.userStorage.REMEMBER;
      let credentials = null;
      if (rememberStorage) {
        try {
          credentials = JSON.parse(rememberStorage);
        } catch (e) {
          // console.log("Not remember");
        }
      }
      if (credentials) {
        this.doLogin(credentials, true).subscribe(
          (res) => {
            observer.next({
              success: true,
            });
            observer.complete();
          },
          (err) => {
            this.isLoginSubject.next(false);
            observer.next({
              success: false,
            });
            observer.complete();
          }
        );
      } else {
        this.isLoginSubject.next(false);
        observer.next({
          success: false,
        });
        observer.complete();
      }
    });
  }

  private setSession(res, remember, data) {
    const expiresAt = moment().add(1, "day");
    if (res.success) {
      let user = res.user;
      this.setSessionUser(user);
      if (remember) {
        this.userStorage.REMEMBER = JSON.stringify({
          email: data.email,
          password: data.password,
        });
      }
      this.userStorage.TOKEN_KEY = res.token;
      this.userStorage.EXPIRED_AT = JSON.stringify(expiresAt.valueOf());

      this.currentUser = res.user;
      this.currentToken = res.token;
    }

    this.isLoginSubject.next(true);

    return res;
  }

  setSessionUser(user) {
    if (!user) return;
    delete user.password;
    delete user.created_at;
    delete user.active;
    this.userStorage.USER_TOKEN = JSON.stringify(user);
  }

  logout() {
    this.userStorage.clear();

    this.socketService.disconnect();
    this.currentUser = null;
    this.currentToken = "";
    this.logout$.next(true);
    this.isLoginSubject.next(false);
  }

  goToPageInit() {
    this.redirect$.next(true);
  }

  getAuthToken() {
    if (!this.currentToken) {
      this.currentToken = this.userStorage.TOKEN_KEY || "";
    }
    if (!this.currentToken) {
      return;
    }
    return this.currentToken;
  }

  getAuthUser() {
    try {
      if (!this.currentUser) {
        const userToken = this.userStorage.USER_TOKEN;
        if (userToken) {
          this.currentUser = JSON.parse(userToken);
        }


      }
      if (!this.currentUser) {
        this.logout();
        return;
      }
      return this.currentUser;
    } catch (e) {
      this.logout();
      return;
    }
  }

  /**
   *
   * @returns {Observable<T>}
   */
  isLoggedIn(): Observable<boolean> {
    return this.isLoginSubject.asObservable();
  }

  /**
   * if we have token the user is loggedIn
   * @returns {boolean}
   */
  public hasToken(): boolean {
    return !!this.userStorage.USER_TOKEN;
  }

  public hasValidToken(): boolean {
    if (!this.hasToken()) {
      return false;
    }
    const tokenExpiresAt = parseInt(this.userStorage.EXPIRED_AT || "");
    const date = new Date().getTime();

    // console.log(
    //   moment(tokenExpiresAt).format("YYYY-MMMM-D HH:mm:ss"),
    //   tokenExpiresAt,
    //   moment(date).format("YYYY-MMMM-D HH:mm:ss"),
    //   date,
    //   tokenExpiresAt < date
    // );
    if (tokenExpiresAt < date) {
      return false;
    }

    return true;
  }
}
