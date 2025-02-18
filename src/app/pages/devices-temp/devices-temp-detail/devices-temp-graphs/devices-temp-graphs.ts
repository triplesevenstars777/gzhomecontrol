import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import moment from 'moment';

import { Constants, SocketService } from '../../../../providers';
import { Node, Endpoint } from '../../../../models/node.model';
import { MeasureService } from '../../../../providers/api/measure.service';

@Component({
  selector: 'page-devices-temp-graphs',
  templateUrl: 'devices-temp-graphs.html',
  styleUrl: "./devices-temp-graphs.scss",
  standalone: false
})
export class DeviceTempGraphsPage {
  @ViewChild('navbar') navBar: any;

  public data: Node;
  public device: Node;
  public endpoint: Endpoint;
  public nodeUpdated: Node;
  public status: any;
  public TYPE_ENDPOINTS = Constants.TYPE_ENDPOINTS;
  public TYPE_NODE = Constants.TYPE_NODE;
  public lastUpdate: string = moment(new Date()).format('hh:mm:ss DD-MM-Y');
  public limit: number = 50;
  private endpointId: string = "";
  private translateStateToValue: any = {};
  private translateValueToState: any = {};
  public measures: Array<{ created_at: Date; value: any }> = [];
  public chart: Chart | undefined;
  private ioConnection$: Subscription;

  constructor(
    public navCtrl: NavController,
    private router: Router,
    private measureService: MeasureService,
    private socketService: SocketService
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as any;
    this.device = state?.device || null;
    this.endpoint = state?.endpoint || null;
  }

  ionViewCanEnter() {
    if (this.device === null || this.endpoint === null) {
      return false;
    }
    return true;
  }

  ngOnInit() {
    this.loadMeasures();
    this.initSocketIO();
  }

  setBackButtonAction() {
    this.router.navigate(['device-temp/device-temp-detail'], {
      state: { device: this.device },
      replaceUrl: true
    });
  }

  loadMeasures() {
    this.measureService.showAll({
      device: this.device._id,
      endpoint: this.endpoint._id,
      limit: this.limit
    }).subscribe((response: any) => {
      this.measures = this.parseMeasures(response.docs);
      this.drawChart();
    });
  }

  initSocketIO() {
    this.ioConnection$ = this.socketService.onMeasureCreated().subscribe((data: any) => {
      if (this.endpointId !== data.endpoint || data.device !== this.endpoint._id) {
        return;
      }
      this.addMeasure(data);
      this.removeMeasure();
    });
  }

  onChangeLimit(event: any) {
    this.limit = Number(event.target.value);
    this.loadMeasures();
  }

  addMeasure(measure: any) {
    if (!this.chart?.data?.labels) return;

    const data = this.parseMeasure(measure);
    
    this.chart.data.labels.unshift(data[0]);
    this.chart.data.datasets.forEach((dataset) => {
      dataset.data.unshift(data[1]);
    });

    this.chart.update();
  }

  parseMeasure(measure: any): [string, any] {
    let label = new Date(measure.created_at).toString();
    let value = measure.value;

    if (this.endpoint.type === 'stateful') {
      label = `${new Date(measure.created_at)}:${measure.value}`;
      value = this.translateStateToValue[measure.value];
    }

    return [label, value];
  }

  removeMeasure() {
    if (!this.chart?.data?.datasets?.[0]?.data) return;

    if (this.chart.data.datasets[0].data.length > this.limit) {
      this.chart.data.labels?.pop();
      this.chart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
      });
      this.chart.update();
    }
  }

  parseMeasures(measures: any[]): Array<{ created_at: Date; value: any }> {
    let result: Array<{ created_at: Date; value: any }> = [];
    let endpoint = this.endpoint;
    if (endpoint.type === 'stateful') {
      for (let i = 0; i < endpoint.states.length; i++) {
        let state = endpoint.states[i];

        this.translateStateToValue[state.name] = state.value;
        this.translateValueToState[state.value] = state.name;
      }

      for (let i = 0; i < measures.length; i++) {
        let measure = measures[i];

        result.push({
          created_at: new Date(measure.created_at),
          value: this.translateStateToValue[measure.value]
        });
      }
    } else {
      result = measures.map(measure => ({
        created_at: new Date(measure.created_at),
        value: measure.value
      }));
    }

    return result;
  }

  drawChart() {
    let labels: string[] = [];
    let dataset: any[] = [];
    let customTicks;

    if (this.endpoint.value[0]) {
      customTicks = {
        beginAtZero: false,
        callback: (value) => {
          if (this.endpoint.type === 'stateful') {
            return this.translateValueToState[value];
          } else {
            return value;
          }
        },
        min: this.endpoint.value[0].min,
        max: this.endpoint.value[0].max
      };
    } else {
      customTicks = {
        beginAtZero: true,
        callback: (value) => {
          if (this.endpoint.type === 'stateful') {
            return this.translateValueToState[value];
          } else {
            return value;
          }
        }
      };
    }
  
    for (let i = 0; i < this.measures.length; i++) {
      labels.push(new Date(this.measures[i].created_at) + ':');
      dataset.push(this.measures[i].value);
    }

    const ctx = document.getElementById("canvas") as HTMLCanvasElement;
    if (!ctx) {
      console.error('Canvas element not found');
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            data: dataset,
            borderColor: '#119DA4',
            fill: false,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            display: false,
            grid: {
              display: false
            }
          },
          y: {
            display: true,
            grid: {
              display: true
            },
            ticks: customTicks
          }
        }
      }
    });
  }

  unsubscribers() {
    if (this.ioConnection$) {
      this.ioConnection$.unsubscribe();
    }
  }

  ionViewWillLeave() {
    this.unsubscribers();
  }
}