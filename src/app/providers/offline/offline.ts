import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OfflineProvider {

  isOfflineSubject = new BehaviorSubject<boolean>(this._isOffline());

  constructor(
  ) {

  }

  setOffline()
  {
    this.isOfflineSubject.next(true);
  }

  setOnline()
  {
    this.isOfflineSubject.next(false);
  }

  /**
   *
   * @returns {Observable<T>}
   */
  isOffline() : Observable<boolean> {
    return this.isOfflineSubject.asObservable();
  }

  _isOffline() : boolean{
    return false;
  }
}
