import { Component, Input, Output, EventEmitter } from "@angular/core";
import { Constants } from "../../../providers";
import { BLIND_ACTIONS } from "./actuator-blind.enum";
import * as _ from "underscore";
import { Observable, Subscription, timer, interval } from "rxjs";

@Component({
  selector: "actuator-blind",
  templateUrl: "actuator-blind.html",
  styleUrl : './actuator-blind.scss',
  standalone: false
})
export class ActuatorBlindComponent {
  @Input() status: boolean;
  @Input() endpoints: any;
  @Input() device: any;

  @Output() setAction: EventEmitter<any> = new EventEmitter();
  @Output() setEndpointNotification: EventEmitter<any> = new EventEmitter();

  public TYPE_ENDPOINTS: any = Constants.TYPE_ENDPOINTS;
  public BLIND_ACTIONS: any = BLIND_ACTIONS;

  public actionRunning: any;
  public endpointUp: any;
  public endpointDown: any;
  public notificationsUp: boolean = false;
  public notificationsDown: boolean = false;
  public sendedValue: any;
  public startUp: boolean = false;
  public startDown: boolean = false;
  public timing: number = 0;
  public bladeTime: number = 0;

  private active: any;

  private completeTime: number = 0;

  private timmerBlades$: Subscription;
  private timmerComplete$: Subscription;
  private timer$: Subscription;

  constructor() {}

  ngOnInit() {
    this.endpointUp = _.findWhere(this.endpoints, { id: this.TYPE_ENDPOINTS.RELAY_1 }) || {};
    this.endpointDown = _.findWhere(this.endpoints, { id: this.TYPE_ENDPOINTS.RELAY_0 }) || {};

    this.notificationsUp = this.endpointUp.mobile_notification;
    this.notificationsDown = this.endpointDown.mobile_notification;
    if(this.device.extra_attributes) {
      let extra_attributes = this.device.extra_attributes;

      this.completeTime = Number(extra_attributes.completeTime) || 20 * 1000;
      this.bladeTime = Number(extra_attributes.bladeTime) || 0;
    } else {
      this.completeTime = 20 * 1000;
      this.bladeTime = 0;
    }
  }

  pushOn(action: string, type: string) {
    if (this.endpointUp && this.endpointDown) {
      this.active = (action === "UP") ? this.endpointUp._id : this.endpointDown._id;
      
      this.sendedValue = 'On';
      this.actionRunning = type;

      this.setAction.emit({ 'device': this.device._id, 'endpoint': this.active, 'value': 'On' });

      switch (type) {
        case BLIND_ACTIONS.PARTIAL:
          if (action === "UP") {
            this.startUp = true;
          } else {
            this.startDown = true;
          }
          this.initTimer();
          break;
        case BLIND_ACTIONS.COMPLETE:
          this.timmerComplete$ = timer(this.completeTime).subscribe(() => {
            this.pushOff(BLIND_ACTIONS.COMPLETE);
          });
          break;
        case BLIND_ACTIONS.BLADES:
          this.timmerBlades$ = timer(this.bladeTime).subscribe(() => {
            this.pushOff(BLIND_ACTIONS.BLADES);
          });
          break;
      }
    }
  }

  pushOff(type: string) {
    if (this.active) {
      this.startUp = false;
      this.startDown = false;
      this.sendedValue = 'Off';

      switch (type) {
        case BLIND_ACTIONS.PARTIAL:
          this.clearTimer();
          break;
      }

      this.setAction.emit({ 'device': this.device._id, 'endpoint': this.active, 'value': 'Off' });
      this.active = null;
    }
  }

  initTimer() {
    this.timing = 0;
    this.timer$ = interval(1000).subscribe(() => {
      this.timing++;
    });
  }

  clearTimer() {
    this.timing = 0;
    this.timer$.unsubscribe();
  }

  updateNotification(endpoint, action) {
    let current;
    if (action == 'up') {
      current = this.notificationsUp;
    } else if (action == 'down') {
      current = this.notificationsDown
    }

    this.setEndpointNotification.emit({ 'device': this.device._id, 'endpoint': endpoint._id, 'currentNotifications': current });
  }

  ngOndestroy() {
    if (this.timer$) {
      this.timer$.unsubscribe();
    }
    if (this.timmerComplete$) {
      this.timmerComplete$.unsubscribe();
    }
    if (this.timmerBlades$) {
      this.timmerBlades$.unsubscribe();
    }
  }
}
