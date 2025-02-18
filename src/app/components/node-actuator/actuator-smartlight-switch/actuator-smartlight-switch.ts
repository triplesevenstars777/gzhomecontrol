import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SocketService } from '../../../providers';
import { Subscription } from 'rxjs';

@Component({
  selector: 'actuator-smartlight-switch',
  templateUrl: 'actuator-smartlight-switch.html',
  styleUrl: './actuator-smartlight-switch.scss',
  standalone: false
})
export class ActuatorSmartlightSwitchComponent {

  @Input() endpoints:any;
  @Input() device:any;
  @Output() setAction: EventEmitter<any> = new EventEmitter();
  
  public activeSwitch1: boolean;
  public activeSwitch2: boolean;
  public switch1: any;
  public switch2: any;
  private dimmer: any;

  public data: any;
  private ioConnectionActuation:Subscription;

  constructor(
    private socketService: SocketService
  ) { }

  ngOnInit() {
    this.switch1 = {... this.endpoints.filter(item=>item.id === 'sw1')[0] || {}};
    this.switch2 = {... this.endpoints.filter(item=>item.id === 'sw2')[0] || {}};
    this.dimmer = {... this.endpoints.filter(item=>item.id === 'd')[0] || {}};

    //Inicializa actuadores
    this.initializeEndpoints(this.endpoints);
    
    this.ioConnectionActuation = this.socketService.onMeasureCreated().subscribe((measure: any) => {
        this.updateMeasure(measure);
    });
  }

  initializeEndpoints( endpoints:any ){
    this.switch1 = {... endpoints.filter(item=>item.id === 'sw1')[0] || {}};
    this.switch2 = {... endpoints.filter(item=>item.id === 'sw2')[0] || {}};
    this.dimmer = {... endpoints.filter(item=>item.id === 'd')[0] || {}};

    if(!this.dimmer.current){
      this.dimmer.current = [];
      this.dimmer.current = [0,0];
    }
 
    this.activeSwitch1 = (this.dimmer.current[0])?true:false;
    this.activeSwitch2 = (this.dimmer.current[1])?true:false;
  }


  updateMeasure(measure: any) {
    if (measure.endpoint != this.dimmer._id) {
      return;
    }
 
    this.dimmer.current = measure.value;
    this.activeSwitch1 = (measure.value[0])?true:false;
    this.activeSwitch2 = (measure.value[1])?true:false;
  }
  
  onChangeEndpoint(value, endpoint, index){
    if(value.checked){
      this.dimmer.current[index] = 255;
    }else{
      this.dimmer.current[index] = 0;
    }

    //Update dimmer
    this.setAction.emit({
      device: this.device._id, 
      endpoint: this.dimmer._id,
      value: this.dimmer.current
    });
  }

  ngOnDestroy(){
    if(this.ioConnectionActuation){
      this.ioConnectionActuation.unsubscribe();
    }
  }
}
