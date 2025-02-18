import { Injectable } from "@angular/core";
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpSentEvent,
  HttpHeaderResponse,
  HttpProgressEvent,
  HttpResponse,
  HttpUserEvent,
  HttpErrorResponse,
  HttpEvent,
} from "@angular/common/http";
import { BehaviorSubject } from "rxjs";
import { AuthService } from "./auth.service";
import { Observable, throwError } from "rxjs";
import { tap } from 'rxjs/operators';
// import moment from "moment";
import "rxjs/add/operator/catch";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/do";
import { UnknowFailureProvider } from "../unknow-failure/unknow-failure";
import { OfflineProvider } from "../offline/offline";
import { UserStorage } from "../user/user-storage";

@Injectable({
  providedIn: 'root'
})
export class RequestInterceptorService implements HttpInterceptor {
  isRefreshingToken: boolean = false;
  tokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>("");

  constructor(
    private authService: AuthService,
    public unknowFailure: UnknowFailureProvider,
    public offline: OfflineProvider,
    private userStorage: UserStorage
  ) {}

  addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    var API_URL = this.userStorage.API_URL;
    if (API_URL && token && !req.url.indexOf(API_URL)) {
      return req.clone({
        setHeaders: {
          Authorization: "Bearer " + token,
        },
      });
    } else {
      return req;
    }
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<
    | HttpSentEvent
    | HttpHeaderResponse
    | HttpProgressEvent
    | HttpResponse<any>
    | HttpUserEvent<any>
  > {
    // const started = Date.now();
    console.log("auth token : " + this.authService.getAuthToken());
    const token = this.authService.getAuthToken() || "";
    return next.handle(this.addToken(req, token)).pipe(
      tap(
        (event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) {
            // const elapsed = Date.now() - started;

            //   const now = moment(new Date().getTime()).format(
            //     "YYYY-MMMM-D HH:mm:ss"
            //   );

            this.unknowFailure.setOffFailure();
            this.offline.setOnline();

            //console.log(`${now} - Request for ${req.urlWithParams} took ${elapsed} ms.`);
          }
        },
        (error: any) => {
          if (error instanceof HttpErrorResponse) {
            //   const elapsed = Date.now() - started;
            //   const now = moment(new Date().getTime()).format(
            //     "YYYY-MMMM-D HH:mm:ss"
            //   );
            //console.log(`${now} - Request for ${req.urlWithParams} failed after ${elapsed} ms.`);

            switch ((<HttpErrorResponse>error).status) {
              case 0:
                //console.log('0', error);
                return this.handle0Error(error);
              case 400:
                //console.log('400', error);
                return this.handle400Error(error);
              case 401:
                //console.log('401', error);
                return this.handle401Error(req, next);
            }
          }
          return throwError(error);
        }
      )
    );
  }

  handle401Error(req: HttpRequest<any>, next: HttpHandler) {
    return this.authService.rememberDoLogin().subscribe(
      {
        next: (res) => {
        if (res.success) {
          //Se ha obtenido un nuevo token
          return this.redirect();
          //const token = localStorage.getItem(Constants.APP_KEY + ':token');
          //next.handle(this.addToken(this.getNewRequest(req), token));
        } else {
          //No hay token nuevo
          this.unknowFailure.setOnFailure();

          return this.redirect();
        }
      },
      error: (err) => {
        this.unknowFailure.setOnFailure();

        return this.redirect();
      }}
    );
  }

  handle400Error(error) {
    return throwError(error);
  }

  handle0Error(error) {
    // 17-09-21 - JMA - Comment because have some thrid party petitions with errors
    // this.offline.setOffline();

    return throwError(error);
  }

  redirect() {
    this.authService.goToPageInit();
    return throwError("");
  }

  getNewRequest(req: HttpRequest<any>): HttpRequest<any> {
    const method: any = req.method;
    return new HttpRequest(method, req.urlWithParams);
  }
}
