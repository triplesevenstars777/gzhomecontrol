import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NewsProvider {

  private newsURL: string = "https://api-news.gozmart.ch/api/users/news/"
  private apiKey: string = "newsman";

  constructor(public http: HttpClient) {
  }

  getNewsByID(id: string, limit?: number, offset?:number)
  { 
    let params = {'X-API-KEY': this.apiKey};

    if (limit) {
      params['limit'] = limit
    }
    if (offset) {
      params['offset'] = offset;
    }
    return this.http.get(this.newsURL + id, {params: params});
  }

}
