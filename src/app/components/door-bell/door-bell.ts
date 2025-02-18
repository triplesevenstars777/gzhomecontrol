import { Component } from '@angular/core';

import { DoorBellProvider } from '../../providers/door-bell/door-bell';

@Component({
  selector: 'door-bell',
  templateUrl: 'door-bell.html',
  styleUrl : './door-bell.scss',
  standalone: false
})
export class DoorBellComponent {

  constructor(
    private doorBellProvider: DoorBellProvider,
  ) {
  }

  test() {
    this.doorBellProvider.activateDoorBell();
  }
}
