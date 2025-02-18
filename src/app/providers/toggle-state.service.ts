import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToggleStateService {
  private stateSource = new BehaviorSubject<string>(null);
  currentState$ = this.stateSource.asObservable();

  constructor() {}

  updateState(section: string) {
    this.stateSource.next(section);
    // Force storage clear and reload
    const key = `gzhomecontrol:toggle_nodes:${section}`;
    localStorage.removeItem(key);
  }

  clearState() {
    this.stateSource.next(null);
  }
}
