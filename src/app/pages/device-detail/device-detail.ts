import { Component, OnInit, OnDestroy } from "@angular/core";
import { NavController } from "@ionic/angular";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { Location } from '@angular/common';
import { Constants, SocketService } from "../../providers";
import { Node, Endpoint } from "../../models/node.model";

@Component({
  selector: "page-device-detail",
  templateUrl: "device-detail.html",
  styleUrls: ["./device-detail.scss"],
  standalone: false
})
export class DeviceDetailPage implements OnInit, OnDestroy {
  public data: Node;
  public status: any;
  public TYPE_ENDPOINTS = Constants.TYPE_ENDPOINTS;
  public TYPE_NODE = Constants.TYPE_NODE;
  public endpointsList: Endpoint[] = [];

  private ioMeasure$?: Subscription;
  private previousPage: string = '';


  constructor(
    public navCtrl: NavController,
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService,
    private location: Location  // Add this line
  ) {}

  ngOnInit() {
    // Try to get data from router state
    const state = this.router.getCurrentNavigation()?.extras?.state;
    if (state && state['device']) {
      this.data = state['device'];
      this.previousPage = state['previousPage'] || '/devices-light';
    }

    // If no state data, try to get from route params
    if (!this.data) {
      this.route.queryParams.subscribe(params => {
        if (params['device']) {
          try {
            this.data = JSON.parse(params['device']);
          } catch (e) {
            console.error('Error parsing device data:', e);
          }
        }
      });
    }

    if (this.data) {
      this.initSocketIO();
      this.updateEndpointsList(this.data);
    } else {
      console.warn('No device data found, navigating back');
      this.navCtrl.back();
    }
  }

  goBack() {
    this.navCtrl.navigateRoot(this.previousPage || '/devices-light', { animated: true });
  }

  updateEndpointsList(data: Node) {
    if (data?.scheme?.endpoints) {
      this.endpointsList = [...data.scheme.endpoints];
      if (data.scheme.code === this.TYPE_NODE.SMARTLIGHT_SWITCH) {
        this.endpointsList = this.endpointsList.filter(
          item => item.id !== this.TYPE_ENDPOINTS.DIMMER
        );
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
    if (!this.data || measure.device !== this.data._id) {
      return;
    }

    const updatedData = { ...this.data };
    updatedData.last_update = measure.created_at;
    
    if (updatedData.scheme?.endpoints) {
      for (let i = 0; i < updatedData.scheme.endpoints.length; i++) {
        if (updatedData.scheme.endpoints[i]._id === measure.endpoint) {
          updatedData.scheme.endpoints[i].current = measure.value;
        }
      }
    }

    this.data = updatedData;
  }

  ngOnDestroy() {
    if (this.ioMeasure$) {
      this.ioMeasure$.unsubscribe();
    }
  }
}
