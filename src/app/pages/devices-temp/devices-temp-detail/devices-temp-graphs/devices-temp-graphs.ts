import { Component, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';
import { IonicPage, Navbar, NavController, NavParams } from '@ionic/angular';
import { Subscription } from 'rxjs';
import moment from 'moment';

import { Constants, SocketService } from '../../../../providers';
import { Node, Endpoint } from '../../../../models/node.model';
import { MeasureService } from '../../../../providers/api/measure.service';

@IonicPage()
@Component({
  selector: 'page-devices-temp-graphs',
  templateUrl: 'devices-temp-graphs.html',
})
export class DeviceTempGraphsPage {
  @ViewChild(Navbar) navBar: Navbar;

  public data: Node;
  public device: Node;
  public endpoint: Endpoint;
  public nodeUpdated: Node;
  public status: any;
  public TYPE_ENDPOINTS = Constants.TYPE_ENDPOINTS;
  public TYPE_NODE = Constants.TYPE_NODE;
  public lastUpdate : string = moment(new Date()).format('hh:mm:ss DD-MM-Y');
  public limit: number = 50;
  private endpointId: string = null;
  private translateStateToValue: any = {};
  private translateValueToState: any = {};
  public measures: any[];
  public chart: any;
  private ioConnection$: Subscription;

  constructor(
    public navCtrl: NavController, 
    navParams: NavParams,
    private measureService: MeasureService,
    private socketService: SocketService
  ) {
    this.device = navParams.get('device') || null;
    this.endpoint = navParams.get('endpoint') || null;
  }

  ionViewCanEnter() {
    if(this.device === null || this.endpoint === null)
    {
      return false;
    }

    return true;
  }

  ngOnInit() {
    this.loadMeasures();
    this.initSocketIO();
  }

  /*
   * Method to override the default back button action
   */
  setBackButtonAction(){
    this.navBar.backButtonClick = () => {
      this.unsubscribers();
      this.navCtrl.pop();
    }
  }

  loadMeasures(){
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

  onChangeLimit(value){
    this.limit = Number(value);
    this.loadMeasures();
  }

  addMeasure(measure) {
    if (!this.chart)
      return;

    const data = this.parseMeasure(measure)

    this.chart.data.labels.unshift(data[0]);
    this.chart.data.datasets.forEach((dataset) => {
      dataset.data.unshift(data[1]);
    });

    this.chart.update();
  }

  parseMeasure(measure: any) {
    let label = new Date(measure.created_at).toString();
    let value = measure.value;

    if (this.endpoint.type == 'stateful') {
      label = new Date(measure.created_at) + ':' + measure.value;
      value = this.translateStateToValue[measure.value];
    }

    return [label, value];
  }

  removeMeasure() {
    if (!this.chart)
      return;

    if (this.chart.data.datasets.length > this.limit) {
      this.chart.data.labels.pop();
      this.chart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
      });

      this.chart.update();
    }
  }

  parseMeasures(measures) {
    let result = [];
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
      result = measures;
    }

    return result;
  }

  drawChart() {
    let labels = [];
    let dataset = [];
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

    const ctx = document.getElementById("canvas")

    if(this.chart){
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
            fill: false
          }
        ]
      },
      options: {
        legend: {
          display: false
        },
        scales: {
          xAxes: [{
            display: false
          }],
          yAxes: [{
            display: true,
            ticks: customTicks
          }]
        }
      }
    });

    this.chart.update();
  };

  unsubscribers() {
    if (this.ioConnection$) {
      this.ioConnection$.unsubscribe();
    }
  }

  ionViewWillLeave() {
    this.unsubscribers();
  }
}