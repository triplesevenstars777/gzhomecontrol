import {
  Component,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
} from "@angular/core";
import { SocketService, Constants } from "../../../../providers";
import { Subscription } from "rxjs";
import { DeviceService } from "../../../../providers/device/device.service";

@Component({
  selector: "brightness-actuator",
  templateUrl: "brightness-actuator.html",
  styleUrl : './brightness-actuator.scss',
  standalone: false
})
export class BrightnessActuatorComponent {
  @Output() endpointChange: EventEmitter<any> = new EventEmitter();
  @Output() endpointUpdateName: EventEmitter<any> = new EventEmitter();
  @Output() endpointUpdateNotification: EventEmitter<any> = new EventEmitter();

  @Input() device: any;
  @Input() endpoint: any;
  @Input() updatedName: any;
  @Input() updatedNotification: any;

  public data: any;
  public isWallTablet = false;
  private ioMeasure$: Subscription;

  public TYPE_ENDPOINTS: any = Constants.TYPE_ENDPOINTS;

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes[this.updatedName]) {
      if (!changes[this.updatedName].currentValue) {
        return;
      }
      const dataEntry = changes[this.updatedName].currentValue;
      if (
        this.data._id === dataEntry.endpoint &&
        this.device._id === dataEntry.device
      ) {
        this.data.display_name = dataEntry.currentName;
      }
    }
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

  updateName() {
    this.endpointUpdateName.emit({
      device: this.device._id,
      endpoint: this.data._id,
      currentName: this.data.display_name,
    });
  }

  ngOnDestroy() {
    if (this.ioMeasure$) {
      this.ioMeasure$.unsubscribe();
    }
  }
}
