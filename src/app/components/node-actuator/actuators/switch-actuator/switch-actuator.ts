import {
  Component,
  Output,
  Input,
  EventEmitter,
  SimpleChanges,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { SocketService } from "../../../../providers";
import { Subscription } from "rxjs";
import { Constants } from "../../../../providers";
import { DeviceService } from "../../../../providers/device/device.service";

@Component({
  selector: "switch-actuator",
  templateUrl: "switch-actuator.html",
  styleUrl : './switch-actuator.scss',
  standalone: false
})
export class SwitchActuatorComponent implements OnInit, OnDestroy {
  @Output() endpointChange: EventEmitter<any> = new EventEmitter();
  @Output() endpointUpdateName: EventEmitter<any> = new EventEmitter();
  @Output() endpointUpdateNotification: EventEmitter<any> = new EventEmitter();
  @Input() endpoint: any;
  @Input() device: any;
  @Input() updatedNotification: any;
  @Input() updatedName: any;

  public data: any;
  public active: boolean;
  public notifications: boolean = false;

  public TYPE_NODE: any = Constants.TYPE_NODE;
  public isWallTablet = false;

  private ioMeasure$: Subscription;

  constructor(
    private deviceService: DeviceService,
    private socketService: SocketService,
  ) {
    this.isWallTablet = this.deviceService.isWallTablet();
  }

  ngOnInit() {
    this.data = { ...this.endpoint };
    this.notifications = this.data.mobile_notification;
    this.checkedSwitch(this.data.current);
    this.initSocketIO();
  }

  initSocketIO() {
    this.ioMeasure$ = this.socketService
      .onMeasureCreated()
      .subscribe((measure: any) => {
        this.updateMeasure(measure);
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log("switch actuator changes:", changes);
    
    if (changes["endpoint"] && changes["endpoint"].currentValue) {
      this.data = { ...changes["endpoint"].currentValue };
    }
    
    if (changes["updatedName"] && changes["updatedName"].currentValue) {
      const dataEntry = changes["updatedName"].currentValue;
      console.log("updatedName change:", dataEntry);
      
      if (this.data && this.device && 
          this.data._id === dataEntry.endpoint &&
          this.device._id === dataEntry.device) {
        console.log("Updating display_name to:", dataEntry.currentName);
        this.data.display_name = dataEntry.currentName;
        // Force change detection
        this.data = { ...this.data };
      }
    }
  }
  
  updateMeasure(measure: any) {
    if (
      measure.device !== this.device._id ||
      measure.endpoint !== this.data._id
    ) {
      return;
    }
    this.data.current = measure.value;
    this.checkedSwitch(measure.value);
  }

  checkedSwitch(value: any) {
    if (this.data.type === "stateful") {
      //stateful
      this.active = value === "On" ? true : false;
    } else {
      //stateless
      this.active = value === 1 ? true : false;
    }
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

  onChangeEndpoint(value) {
    if (this.data.type === "stateful") {
      //stateful
      this.data.current = value ? "On" : "Off";
    } else {
      //stateless
      this.data.current = value ? 1 : 0;
    }

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
