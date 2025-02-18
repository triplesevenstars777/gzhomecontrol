import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'custom-button',
  templateUrl: 'custom-button.html',
  styleUrl : './custom-button.scss',
  standalone: false
})
export class CustomButtonComponent {
  @Input() checked: boolean = false;
  @Input() disabled: boolean = false;
  @Output() ionChange: EventEmitter<any> = new EventEmitter();
  constructor() {}

  ngOnInit() {}

  clickHandler(e) {
    this.ionChange.emit(this.checked);
  }
}
