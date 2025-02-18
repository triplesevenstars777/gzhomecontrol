import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'custom-switch',
  templateUrl: 'custom-switch.html',
  styleUrl: "./custom-switch.scss",
  standalone: false
})
export class CustomSwitchComponent {
  @Input() checked: boolean = false;
  @Input() disabled: boolean = false;
  @Output() ionChange: EventEmitter<any> = new EventEmitter();
  
  constructor() {}
  
  ngOnInit() {}

  clickHandler(e) {
    this.ionChange.emit(this.checked)
  }
}
