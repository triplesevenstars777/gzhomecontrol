import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { Subscription } from "rxjs";

import { SocketService } from "../../../../providers";
import { DeviceService } from "../../../../providers/device/device.service";

@Component({
  selector: "dimmer-actuator",
  templateUrl: "dimmer-actuator.html",
  styleUrl : './dimmer-actuator.scss',
  standalone: false
})
export class DimmerActuatorComponent {
  @Output() endpointChange: EventEmitter<any> = new EventEmitter();
  @Output() endpointUpdateName: EventEmitter<any> = new EventEmitter();
  @Output() endpointUpdateNotification: EventEmitter<any> = new EventEmitter();

  @Input() device: any;
  @Input() endpoint: any;
  @Input() updatedName: any;
  @Input() updatedNotification: any;

  @ViewChild("rangeSlider", { read: ElementRef }) _rangeRef: ElementRef;

  public data: any;
  public isWallTablet = false;
  private ioMeasure$: Subscription;

  onUpdateName() {
    this.endpointUpdateName.emit({
      endpoint: this.data._id,
      currentName: this.data.display_name || this.data.name
    });
  }

  constructor(
    private deviceService: DeviceService,
    private socketService: SocketService
  ) {
    this.isWallTablet = this.deviceService.isWallTablet();
  }

  ngOnInit() {
    this.data = { ...this.endpoint };
    if (!this.data.current) {
      this.data.current = 0;
    }

    this.initSocketIO();
  }

  initSocketIO() {
    this.ioMeasure$ = this.socketService
      .onMeasureCreated()
      .subscribe((measure: any) => {
        this.updateMeasure(measure);
      });
  }

  updateMeasure(measure: any) {
    if (
      measure.device !== this.device._id ||
      measure.endpoint !== this.data._id
    ) {
      return;
    }
    this.data.current = measure.value;
  }

  onChangeEndpoint(value) {
    this.data.current = value;

    this.endpointChange.emit({
      updated: true,
      _id: this.data._id,
      value: this.data.current,
    });
  }

  ngOnDestroy() {
    if (this.ioMeasure$) {
      this.ioMeasure$.unsubscribe();
    }
  }
}
