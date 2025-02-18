import {
  Component,
  Input,
  Output,
  EventEmitter,
} from "@angular/core";
import { Constants } from "../../../providers";

@Component({
  selector: "node-actuator-auto",
  templateUrl: "node-actuator-auto.html",
  styleUrl : './node-actuator-auto.scss',
  standalone: false
})

export class NodeActuatorAutoComponent {
  @Input() updatedName: any;
  @Input() updatedNotification: any;
  @Input() status: boolean;
  @Input() endpoints: any;
  @Input() device: any;
  @Output() setAction: EventEmitter<any> = new EventEmitter();
  @Output() setEndpointName: EventEmitter<any> = new EventEmitter();
  @Output() setEndpointNotification: EventEmitter<any> = new EventEmitter();

  public TYPE_ENDPOINTS: any = Constants.TYPE_ENDPOINTS;

  constructor() {}

  updateName(data: any) {
    this.setEndpointName.emit(data);
  }

  updateNotification(data: any) {
    this.setEndpointNotification.emit(data);
  }

  onChange(data: any) {
    if (data.updated) {
      this.setAction.emit({'device': this.device, 'endpoint': data._id, 'value': data.value });
    }
  }
}