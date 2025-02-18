import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { Constants } from '../../../providers';
import * as _ from 'underscore';

@Component({
  selector: 'actuator-smart-4-channel',
  templateUrl: 'actuator-smart-4-channel.html',
  styleUrl : './actuator-smart-4-channel.scss',
  standalone: false
})
export class ActuatorSmart4ChannelComponent {

    @Input() status: boolean;
    @Input() endpoints:any;
    @Input() device:any;

    @Output() setAction: EventEmitter<any> = new EventEmitter();
    
    public TYPE_ENDPOINTS: any = Constants.TYPE_ENDPOINTS;
    public dataEndpoints: any;
    public fanSpeedMedium;
    public fanSpeedHigh;
    public coolingOn;
    public coolingOff;
    public isWorkingInRemote: boolean = true;
    private workingModeEndpoint: any;


    constructor() { }

    notifyRemoteMode(){
        if(this.workingModeEndpoint._id){
            const value = (this.isWorkingInRemote)?'Remote':'Transparent';
            this.setAction.emit({ 
                device: this.device._id, 
                endpoint: this.workingModeEndpoint._id, 
                value: value
            });
        }
    }

    setEndpointValues( endpoints ){
        this.workingModeEndpoint = endpoints.find( item => {
            if(item.id === this.TYPE_ENDPOINTS.WORKING_MODE){
                return item;
            }
        }) || {};
  
        this.isWorkingInRemote = (this.workingModeEndpoint.current === '"remote"')?true:false;
        this.fanSpeedMedium = _.findWhere(endpoints, { id: this.TYPE_ENDPOINTS.RELAY_3 }) || {};
        this.fanSpeedMedium = _.findWhere(endpoints, { id: this.TYPE_ENDPOINTS.RELAY_3 }) || {};
        this.fanSpeedHigh = _.findWhere(endpoints, { id: this.TYPE_ENDPOINTS.RELAY_2 }) || {};
        this.coolingOn = _.findWhere(endpoints, { id: this.TYPE_ENDPOINTS.RELAY_1 }) || {};
        this.coolingOff = _.findWhere(endpoints, { id: this.TYPE_ENDPOINTS.RELAY_0 }) || {};
    }

    ngOnInit() {
        this.dataEndpoints = [...this.endpoints];
        this.setEndpointValues( this.dataEndpoints );
    }

    ngOnChanges(changes: SimpleChanges){
        if(changes[this.endpoints]){
            this.dataEndpoints = [...changes[this.endpoints].currentValue];
            this.setEndpointValues( this.dataEndpoints );
        }
    }

    changeFanSpeed(value) {
        
        var mediumValue;
        var highValue;
        
        switch(value) {
            case 'Medium':
                mediumValue = this.fanSpeedMedium.current != 'On' ? 'On' : 'Off';
                highValue = 'Off';
                break;
            case 'High':
                mediumValue = 'Off';
                highValue = this.fanSpeedHigh.current != 'On' ? 'On' : 'Off';
                break;
        }

        this.fanSpeedMedium.current = mediumValue;
        this.fanSpeedHigh.current = highValue;

        // Send Value for Relay_0 (FanSpeed medium)
        this.setAction.emit({ 
            device: this.device._id, 
            endpoint: this.fanSpeedMedium._id, 
            value: mediumValue, 
            silent: true 
        });

        // Send Value for Relay_1 (FanSpeed high)
        this.setAction.emit({ 
            device: this.device._id, 
            endpoint: this.fanSpeedHigh._id, 
            value: highValue
        });
    }

    changeCooling(value) {
        var coolingOn;
        var coolingOff;
        
        switch(value) {
            case 'On':
                coolingOn = 'On';
                coolingOff = 'Off';
                break;
            case 'Off':
                coolingOn = 'Off';
                coolingOff = 'On';
                break;
        }

        this.coolingOn.current = coolingOn;
        this.coolingOff.current = coolingOff;

        // Send Value for Relay_2 (Cooling On)
        this.setAction.emit({ 
            device: this.device._id, 
            endpoint: this.coolingOn._id, 
            value: coolingOn, 
            silent: true 
        });

        // Send Value for Relay_3 (Cooling Off)
        this.setAction.emit({ 
            device: this.device._id, 
            endpoint: this.coolingOff._id, 
            value: coolingOff
        });
    }
}
