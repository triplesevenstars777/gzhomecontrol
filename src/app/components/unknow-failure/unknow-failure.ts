import { Component } from '@angular/core';
import { UnknowFailureProvider } from '../../providers'

@Component({
  selector: 'unknow-failure',
  templateUrl: 'unknow-failure.html',
  styleUrl : './unknow-failure.scss',
  standalone: false
})
export class UnknowFailureComponent {
  public isFailed: boolean = false;

  constructor(
    unknowFailure: UnknowFailureProvider
  ) {
    unknowFailure.isOnFailure().subscribe((response) => {
      this.isFailed = response;
    });
  }

  setOn()
  {
    this.isFailed = true;
  }

  setOff()
  {
    this.isFailed = false;
  }
}
