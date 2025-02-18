import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { mergeMap } from 'rxjs/operators';
import { UserStorage } from "../user/user-storage";
import { AuthTokenService } from "../auth/auth-token.service";


/**
 * Api is a generic REST Api handler. Set your API url first.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiNew {
  public api: string = "api/v1";
  public url: string = "";

  constructor(
    private http: HttpClient, 
    private userStorage: UserStorage,
    private authTokenService: AuthTokenService
  ) {}


  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = this.authTokenService.getToken();

    if (!token) {
      return { headers: new HttpHeaders() };
    }
    // Add newline after Bearer as specified in the error message
    return {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
    };

  }

  setUrl(url: string) {
    this.url = url + this.api;
  }

  checkUrl(): Observable<any> {
    return Observable.create(observable => {
      if (!this.url) {
        const storageUrl = this.userStorage.API_URL;
        if (storageUrl) {
          this.setUrl(storageUrl);
        } else {
          observable.error("Error when load url");
        }
      }
      // console.log(this.url);
      observable.next(this.url);
    });
  }

  getAll(endpoint: String, params?: any) {
    const result = this.checkUrl().pipe(
      mergeMap(res => this.http.get(this.url + "/" + endpoint, { ...this.getAuthHeaders(), params }))
    );
    return result;
  }

  getOne(endpoint: string, id: string) {
    return this.checkUrl().pipe(
      mergeMap(res => this.http.get(this.url + "/" + endpoint + "/" + id, this.getAuthHeaders()))
    );
  }

  post(endpoint: string, data: any) {
    return this.checkUrl().pipe(
      mergeMap(res => this.http.post(this.url + "/" + endpoint, data, this.getAuthHeaders()))
    );
  }

  put(endpoint: string, id: string, data?: any) {
    return this.checkUrl().pipe(
      mergeMap(res => this.http.put(this.url + "/" + endpoint + "/" + id, data, this.getAuthHeaders()))
    );
  }

  delete(endpoint: string, id) {
    return this.checkUrl().pipe(
      mergeMap(res => this.http.delete(this.url + "/" + endpoint + "/" + id, this.getAuthHeaders()))
    );
  }

  patch(endpoint: string, body: any, reqOpts?: any) {
    return this.checkUrl().pipe(
      mergeMap(res => this.http.patch(this.url + "/" + endpoint, body, this.getAuthHeaders()))
    );
  }
}
