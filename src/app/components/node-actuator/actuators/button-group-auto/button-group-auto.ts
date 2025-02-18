import {
  Input,
  Component,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy
} from '@angular/core';
import { Subscription } from 'rxjs';

import { SocketService } from '../../../../providers';
import { DeviceService } from '../../../../providers/device/device.service';

@Component({
selector: 'button-group-auto',
templateUrl: 'button-group-auto.html',
styleUrl : './button-group-auto.scss',
standalone: false
})
export class ButtonGroupAutoComponent implements OnInit, OnDestroy {
@Output() endpointChange: EventEmitter<any> = new EventEmitter();
@Output() endpointUpdateName: EventEmitter<any> = new EventEmitter();
@Output() endpointUpdateNotification: EventEmitter<any> = new EventEmitter();

@Input() device: any;
@Input() endpoint: any;
@Input() updatedName: any;
@Input() updatedNotification: any;

public data: any;
public notifications: boolean = false;
public isWallTablet = false;

private ioMeasure$: Subscription;

constructor(
  private deviceService: DeviceService,
  private socketService: SocketService
) {
  this.isWallTablet = this.deviceService.isWallTablet();
}

ngOnInit() {
  this.data = { ...this.endpoint };
  this.notifications = this.data.mobile_notification;

  this.initSocketIO();
}

initSocketIO() {
  this.ioMeasure$ = this.socketService.onMeasureCreated().subscribe((measure: any) => {
    this.updateMeasure(measure);
  });
}

updateMeasure(measure: any) {
  if (measure.device !== this.device._id || measure.endpoint !== this.endpoint._id) {
    return;
  }

  this.data.current = measure.value;
}

updateNotification() {
  this.endpointUpdateNotification.emit({
    device: this.device._id,
    endpoint: this.data._id,
    currentNotifications: this.notifications
  });
}

updateName() {
  this.endpointUpdateName.emit({
    device: this.device._id,
    endpoint: this.data._id,
    currentName: this.data.display_name
  });
}

onChangeEndpoint(value) {
  this.data.current = value;

  this.endpointChange.emit({
    updated: true,
    _id: this.data._id,
    value: this.data.current
  });
}

ngOnDestroy() {
  if (this.ioMeasure$) {
    this.ioMeasure$.unsubscribe();
  }
}
}
