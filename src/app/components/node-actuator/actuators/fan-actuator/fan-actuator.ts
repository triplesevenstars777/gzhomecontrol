import { Component, Output, Input, EventEmitter } from '@angular/core';
import { SocketService } from '../../../../providers';
import { Subscription } from 'rxjs';

@Component({
  selector: 'fan-actuator',
  templateUrl: 'fan-actuator.html',
  styleUrl : './fan-actuator.scss',
  standalone: false
})
export class FanActuatorComponent {
  @Output() endpointChange: EventEmitter<any> = new EventEmitter();
  @Output() endpointUpdateName: EventEmitter<any> = new EventEmitter();
  @Output() endpointUpdateNotification: EventEmitter<any> = new EventEmitter();
  
  @Input() device: any;
  @Input() endpoint: any;
  @Input() updatedName: any;
  @Input() updatedNotification: any;
  
  public data:any;
  private ioMeasure$:Subscription;

  constructor(
    private socketService: SocketService
  ) { }

  ngOnInit() {
    this.data = { ...this.endpoint };
    if(!this.data.current){
      this.data.current = 'Off';
    }

    this.initSocketIO();
  }

  initSocketIO() {
    this.ioMeasure$ = this.socketService.onMeasureCreated().subscribe((measure: any) => {
      this.updateMeasure(measure);
    });
  }

  updateMeasure(measure: any) {
    if (measure.device !== this.device._id || measure.endpoint !== this.data._id) {
      return;
    }
    this.data.current = measure.value;
  }

  onChangeEndpoint(value){
    this.data.current = value;

    this.endpointChange.emit({
      updated: true, 
      _id: this.data._id,
      value: this.data.current
    });
  }

  ngOnDestroy(){
    if(this.ioMeasure$){
      this.ioMeasure$.unsubscribe();
    }
  }
}