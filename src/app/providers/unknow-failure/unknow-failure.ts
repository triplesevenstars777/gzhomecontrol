import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnknowFailureProvider {

  isFailedSubject = new BehaviorSubject<boolean>(this.isFailed());

  constructor(
  ) {

  }

  setOnFailure()
  {
    this.isFailedSubject.next(true);
  }

  setOffFailure()
  {
    this.isFailedSubject.next(false);
  }
  /**
   *
   * @returns {Observable<T>}
   */
  isOnFailure() : Observable<boolean> {
    return this.isFailedSubject.asObservable();
  }

  isFailed() : boolean{
    return false;
  }
}
