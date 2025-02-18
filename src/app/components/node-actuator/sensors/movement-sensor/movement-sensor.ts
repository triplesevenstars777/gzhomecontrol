import { Component, Output, Input, EventEmitter, SimpleChanges } from '@angular/core';
import { SocketService } from '../../../../providers';
import { Subscription } from 'rxjs';
import { DeviceService } from '../../../../providers/device/device.service';

@Component({
  selector: 'movement-sensor',
  templateUrl: 'movement-sensor.html',
  styleUrl : './movement-sensor.scss',
  standalone: false
})
export class MovementSensorComponent {

  @Output() endpointChange: EventEmitter<any> = new EventEmitter();
  @Output() endpointUpdateName: EventEmitter<any> = new EventEmitter();
  @Output() endpointUpdateNotification: EventEmitter<any> = new EventEmitter();
  @Input() endpoint:any;
  @Input() status:boolean;
  @Input() device:any;
  @Input() updatedName:any;
  @Input() updatedNotification: any;

  public data: any;
  public active: boolean;
  public notifications: boolean = false;
  public isWallTablet = false;
  private ioConnectionMeasure$:Subscription;

  constructor(
    private deviceService: DeviceService,
    private socketService: SocketService
  ) {
    this.isWallTablet = this.deviceService.isWallTablet();
  }

  ngOnInit() {
    this.socketService.initSocket();
    this.data = { ...this.endpoint };
    this.notifications = this.data.mobile_notification;

    this.ioConnectionMeasure$ = this.socketService.onMeasureCreated().subscribe((measure: any) => {
      this.updateMeasure(measure);
    });
  }

  ngOnChanges(changes: SimpleChanges){
    if(changes[this.updatedName]){
      if(!changes[this.updatedName].currentValue){return};
      const dataEntry = changes[this.updatedName].currentValue;
      if((this.data._id === dataEntry.endpoint) && (this.device._id === dataEntry.device)){
        this.data.display_name = dataEntry.currentName;
      }
    }
  }

  updateMeasure(measure: any) {
    if (measure.device !== this.device._id || measure.endpoint !== this.data._id) {
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

  updateName(){
    this.endpointUpdateName.emit({
      device: this.device._id,
      endpoint: this.data._id,
      currentName: this.data.display_name
    })
  }

  ngOnDestroy(){
    if(this.ioConnectionMeasure$){
      this.ioConnectionMeasure$.unsubscribe();
    }
  }
}
