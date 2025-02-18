import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { Constants } from '../../../providers';

@Component({
  selector: 'actuator-sensor',
  templateUrl: 'actuator-sensor.html',
  styleUrl : './actuator-sensor.scss',
  standalone: false
})
export class ActuatorSensorComponent {
  @Input() updatedName: any;
  @Input() updatedNotification: any;
  @Input() status: boolean;
  @Input() endpoints: any;
  @Input() device: any;
  @Output() setAction: EventEmitter<any> = new EventEmitter();
  @Output() setEndpointName: EventEmitter<any> = new EventEmitter();
  @Output() setEndpointNotification: EventEmitter<any> = new EventEmitter();

  public TYPE_ENDPOINTS: any = Constants.TYPE_ENDPOINTS;
  public dataEndpoints: any;
  
  constructor() {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes[this.endpoints]) {
      this.dataEndpoints = [changes[this.endpoints].currentValue];
    }
  }

  updateName(data: any) {
    this.setEndpointName.emit(data);
  }

  updateNotification(data: any) {
    this.setEndpointNotification.emit(data);
  }
}
