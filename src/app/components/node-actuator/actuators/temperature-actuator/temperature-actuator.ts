import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import { Subscription } from "rxjs";
import * as _ from "underscore";

import { SocketService } from "../../../../providers";
import { Constants } from "../../../../providers/constants";

@Component({
  selector: "temperature-actuator",
  templateUrl: "temperature-actuator.html",
  styleUrl : './temperature-actuator.scss',
  standalone: false
})
export class TemperatureActuatorComponent implements OnInit, OnDestroy {
  @Output() endpointChange: EventEmitter<any> = new EventEmitter();
  @Output() endpointUpdateName: EventEmitter<any> = new EventEmitter();
  @Output() endpointUpdateNotification: EventEmitter<any> = new EventEmitter();

  @Input() device: any;
  @Input() endpoint: any;
  @Input() updatedName: any;
  @Input() updatedNotification: any;

  @ViewChild("tempGraph") tempGraph;

  public data: any;
  public notifications: boolean = false;

  public min: any;
  public max: any;
  public rangeValue: any;

  public rightPositionControl;
  public topPositionControl;

  private tempGraphEl: any;

  public TYPE_ENDPOINTS = Constants.TYPE_ENDPOINTS;

  public actualTemperature: any;
  private currentClick;

  private ioMeasure$: Subscription;
  public changeDimmerSubscription: Subscription;

  constructor(private socketService: SocketService) {}

  ngOnInit() {
    this.data = { ...this.endpoint };
    this.notifications = this.data.mobile_notification;

    // Getting range from temperature to set proper limits to the actuator
    this.min = this.data.value[0].min;
    this.max = this.data.value[0].max;

    if (!this.data.current) {
      this.data.current = this.min;
    }

    this.rangeValue = this.data.current * 2;
    this.setTargetTemperature();
    this.initSocketIO();
  }

  initSocketIO() {
    this.ioMeasure$ = this.socketService
      .onMeasureCreated()
      .subscribe((measure: any) => {
        this.updateMeasure(measure);
        this.updateActualTemperature(measure);
      });
  }

  setTargetTemperature() {
    let temperatureSufix = "";
    const endpointTemperatureArray = this.data.id.split(
      this.TYPE_ENDPOINTS.TARGET_TEMPERATURE
    );
    if (endpointTemperatureArray.length > 1) {
      temperatureSufix = endpointTemperatureArray.pop();
    }

    this.actualTemperature = _.findWhere(this.device.scheme.endpoints, {
      id: `${this.TYPE_ENDPOINTS.TEMPERATURE}${temperatureSufix}`,
    });
  }

  ngAfterViewInit() {
    this.tempGraphEl = this.tempGraph.nativeElement;
    this.tempGraphEl.setAttribute(
      "style",
      `--min:${this.min}; --max:${this.max}; --val:${this.data.current}`
    );
    this.rangeValue = this.data.current * 2;
  }

  updateMeasure(measure: any) {
    if (
      measure.device !== this.device._id ||
      measure.endpoint !== this.data._id
    ) {
      return;
    }

    this.data.current = measure.value;
    this.tempGraphEl.setAttribute("style", this.minMaxVal());
    // Only update rangeValue if it's not being actively changed by the user
    if (!this.currentClick || Date.now() - this.currentClick > 1000) {
      this.rangeValue = this.data.current * 2;
    }
  }

  updateActualTemperature(measure: any) {
    if (
      measure.device !== this.device._id ||
      measure.endpoint !== this.actualTemperature._id
    ) {
      return;
    }

    this.actualTemperature.current = measure.value;
  }

  minMaxVal() {
    return `--min: ${this.min}; --max: ${this.max}; --val: ${this.data.current}`;
  }

  minMaxControlVal() {
    return `--min: ${this.min}; --max: ${this.max}; --val: ${this.data.current}px`;
  }

  updateNotification() {
    this.endpointUpdateNotification.emit({
      device: this.device._id,
      endpoint: this.data._id,
      currentNotifications: this.notifications,
    });
  }

  updateName() {
    this.endpointUpdateName.emit({
      device: this.device._id,
      endpoint: this.data._id,
      currentName: this.data.display_name,
    });
  }

  onChangeDimmer(event) {
    const value = Math.round((event.detail.value / 2) * 10) / 10;
    console.log('Range value:', event.detail.value, 'Calculated value:', value);
    
    // Directly set the value within bounds
    if (value < this.min) {
      this.data.current = this.min;
    } else if (value > this.max) {
      this.data.current = this.max;
    } else {
      this.data.current = value;
    }
    
    this.rangeValue = event.detail.value;
    this.tempGraphEl.setAttribute("style", this.minMaxVal());

    this.currentClick = Date.now();

    setTimeout(() => {
      if (Date.now() - this.currentClick > 1000) {
        this.endpointChange.emit({
          updated: true,
          _id: this.data._id,
          value: this.data.current,
        });
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.ioMeasure$) {
      this.ioMeasure$.unsubscribe();
    }
  }
}
