import { Injectable, InjectionToken, Inject } from "@angular/core";
import { Observable, BehaviorSubject, zip } from "rxjs";
import { mergeMap, map } from 'rxjs/operators';

import { NodeService } from "../api/node.service";
import { GroupService } from "../api/group.service";
import { Constants } from "../../providers/constants";

import { ActuatorService } from "../../providers/api/actuator.service";
import { NotificationService } from "../../providers/api/notification.service";
import { CacheService } from "ionic-cache";

export const CACHESERVICE_TOKEN = new InjectionToken<CacheService>('cache.service');

@Injectable()
export class NodeAvailabilityProvider {
  public TYPE_ENDPOINTS = Constants.TYPE_ENDPOINTS;
  public TYPE_NODES = Constants.TYPE_NODE;
  public availableNodes = {
    lights: false,
    blinds: false,
    clima: false,
    temp: false,
    sensors: false,
    meterkit: true,
    news: true,
    heaters: false,
    mailboxes: false,
    transports: true,
  };
  private nodeAvailability$: BehaviorSubject<any> = new BehaviorSubject<any>(
    this.availableNodes
  );

  public myItems: any[] = [];
  public doorbellItems: any[] = [];
  public panicItems: any[] = [];
  public smokeItems: any[] = [];
  public lightItems: any[] = [];
  public sensorItems: any[] = [];
  public blindItems: any[] = [];
  public awningItems: any[] = [];
  public climaItems: any[] = [];
  public heaterItems: any[] = [];
  public mailboxItems: any[] = [];
  public doorlockItems: any[] = [];

  constructor(
    private groupService: GroupService,
    private nodeService: NodeService,
    private actuatorService: ActuatorService,
    private notification: NotificationService,
    @Inject(CACHESERVICE_TOKEN) private cache: CacheService
  ) {
    this.myItems = [];
  }

  checkForNodeAvailability() {
    const doorbellNodeName = "doorbell";
    const panicNodeName = "panic";
    const smokeNodeName = "smoke";

    zip(
      this.getSpecificNodes(doorbellNodeName),
      this.getSpecificNodes(panicNodeName),
      this.getSpecificNodes(smokeNodeName)
    ).subscribe(
      ([doorbells, panics, smokes]) => {
        if (doorbells.length) {
          this.setNodeAvailability(doorbells, true).subscribe((nodes) => {
            this.doorbellItems = nodes;
          });
        }
        if (panics.length) {
          this.setNodeAvailability(panics, true).subscribe((nodes) => {
            this.panicItems = nodes;
          });
        }
        if (smokes.length) {
          this.setNodeAvailability(smokes, true).subscribe((nodes) => {
            this.smokeItems = nodes;
          });
        }
      },
      (err) => {}
    );
  }

  checkForNodeAvailabilityOnPushButton() {
    const lightsNodeName = "light";
    const blindNodeName = "blind";
    const awningNodeName = "awning";
    const climaNodeName = "clima";
    const tempNodeName = "temp";
    const temperatureNodeName = "temperature";
    const sensorNodeName = "sensor";
    const heaterNodeName = "heater";
    const mailboxNodeName = "mailbox";
    const doorlockNodeName = "doorlock"

    zip(
      this.getSpecificNodes(lightsNodeName),
      this.getSpecificNodes(blindNodeName),
      this.getSpecificNodes(awningNodeName),
      this.getSpecificNodes(climaNodeName),
      this.getSpecificNodes(tempNodeName),
      this.getSpecificNodes(temperatureNodeName),
      this.getSpecificNodes(sensorNodeName),
      this.getSpecificNodes(heaterNodeName),
      this.getSpecificNodes(mailboxNodeName),
      this.getSpecificNodes(doorlockNodeName)
    ).subscribe({
      next: ([
        lights,
        blinds,
        awnings,
        clima,
        temp,
        temperature,
        sensors,
        heaters,
        mailboxes,
        doorlocks
      ]) => {
        if (lights.length) {
          this.availableNodes["lights"] = true;

          this.setNodeAvailability(lights).subscribe({
            next: (nodes) => {
              //console.log(nodes);
              this.lightItems = nodes;
            },
            error: (err) => {
              console.log(err);
            }
          });
        }
        if (blinds.length || awnings.length) {
          this.availableNodes["blinds"] = true;

          this.setNodeAvailability(blinds).subscribe((nodes) => {
            //console.log(nodes);
            this.blindItems = nodes;
          });
          this.setNodeAvailability(awnings).subscribe((nodes) => {
            //console.log(nodes);
            this.awningItems = nodes;
          });
        }
        if (clima.length) {
          this.availableNodes["clima"] = true;

          this.setNodeAvailability(clima).subscribe((nodes) => {
            //console.log(nodes);
            this.climaItems = nodes;
          });
        }
        if (temp.length || temperature.length) {
          this.availableNodes["temp"] = true;
        }
        if (sensors.length) {
          this.availableNodes["sensors"] = true;

          this.setNodeAvailability(sensors).subscribe((nodes) => {
            //console.log(nodes);
            this.sensorItems = nodes;
          });
        }
        if (heaters.length) {
          this.availableNodes["heaters"] = true;

          this.setNodeAvailability(heaters).subscribe((nodes) => {
            //console.log(nodes);
            this.heaterItems = nodes;
          });
        }
        if (mailboxes.length) {
          this.availableNodes["mailboxes"] = true;

          this.setNodeAvailability(mailboxes).subscribe((nodes) => {
            this.mailboxItems = nodes;
          });
        }
        if (doorlocks.length) {
          this.availableNodes["doorlocks"] = true;

          this.setNodeAvailability(doorlocks).subscribe((nodes) => {
            //console.log(nodes);
            this.doorlockItems = nodes;
          });
        }
        this.nodeAvailability$.next(this.availableNodes);
      },
     error: (err) => {
        this.nodeAvailability$.next(this.availableNodes);
      }
    }
    );
  }

  filterMeasureNotifications(measure) {
    switch (measure.uid.code) {
      // Sensor nodes
      case this.TYPE_NODES.SENSOR:
        this.checkOnMyDevices(this.sensorItems, measure).subscribe(
          (endpointFound) => {
            if (endpointFound && endpointFound.notify) {
              this.notification.setFillValue(endpointFound.name);

              switch (endpointFound.id) {
                case this.TYPE_ENDPOINTS.DOORSENSOR_0:
                case this.TYPE_ENDPOINTS.DOORSENSOR_1:
                case this.TYPE_ENDPOINTS.DOORSENSOR_2:
                case this.TYPE_ENDPOINTS.DOORSENSOR_3:
                  if (measure.value == "Off") {
                    this.notification.sendNotification("DOOR_SENSOR_OFF");
                  } else {
                    this.notification.sendNotification("DOOR_SENSOR_ON");
                  }
                  break;
                case this.TYPE_ENDPOINTS.MOVEMENT_0:
                case this.TYPE_ENDPOINTS.MOVEMENT_1:
                  if (measure.value == "On") {
                    this.notification.sendNotification("MOVEMENT_SENSOR_ON");
                  }
              }
            }
          }
        );
        break;
    }
  }

  filterActuationNotifications(actuation) {
    if (!actuation.uid) {
      return;
    }
    switch (actuation.uid.code) {
      // Light nodes
      case this.TYPE_NODES.SMARTLIGHT_SWITCH:
      case this.TYPE_NODES.SMARTLIGHT_DIMMING:
      case this.TYPE_NODES.LIGHT:
        this.checkOnMyDevices(this.lightItems, actuation).subscribe(
          (endpointFound) => {
            if (endpointFound && endpointFound.notify) {
              this.notification.setFillValue(endpointFound.name);

              switch (endpointFound.id) {
                case this.TYPE_ENDPOINTS.RELAY_0:
                case this.TYPE_ENDPOINTS.RELAY_1:
                  if (actuation.value == "Off") {
                    this.notification.sendNotification("LIGHT_OFF");
                  } else {
                    this.notification.sendNotification("LIGHT_ON");
                  }
              }
            }
          }
        );
    }

    if (actuation.value == "On") {
      switch (actuation.uid.code) {
        case this.TYPE_NODES.BLIND:
        case this.TYPE_NODES.BLIND2:
        case this.TYPE_NODES.BLIND3:
        case this.TYPE_NODES.BLIND4:
          // Blinds nodes
          this.checkOnMyDevices(this.blindItems, actuation).subscribe(
            (endpointFound) => {
              if (endpointFound && endpointFound.notify) {
                this.notification.setFillValue(endpointFound.name);

                switch (endpointFound.id) {
                  case this.TYPE_ENDPOINTS.RELAY_0:
                    this.notification.sendNotification("BLIND_UP");
                    break;
                  case this.TYPE_ENDPOINTS.RELAY_1:
                    this.notification.sendNotification("BLIND_DOWN");
                    break;
                }
              }
            }
          );

          // Awnings nodes
          this.checkOnMyDevices(this.awningItems, actuation).subscribe(
            (endpointFound) => {
              if (endpointFound && endpointFound.notify) {
                this.notification.setFillValue(endpointFound.name);

                switch (endpointFound.id) {
                  case this.TYPE_ENDPOINTS.RELAY_0:
                    this.notification.sendNotification("AWNING_UP");
                    break;
                  case this.TYPE_ENDPOINTS.RELAY_1:
                    this.notification.sendNotification("AWNING_DOWN");
                    break;
                }
              }
            }
          );
      }
    }

    // Clima nodes
    switch (actuation.uid.code) {
      case this.TYPE_NODES.CLIMA:
        this.checkOnMyDevices(this.climaItems, actuation).subscribe(
          (endpointFound) => {
            if (endpointFound && endpointFound.notify) {
              this.notification.setFillValue(endpointFound.name);

              switch (endpointFound.id) {
                case this.TYPE_ENDPOINTS.CLIMA_0:
                case this.TYPE_ENDPOINTS.CLIMA_1:
                case this.TYPE_ENDPOINTS.CLIMA_2:
                case this.TYPE_ENDPOINTS.CLIMA_3:
                case this.TYPE_ENDPOINTS.CLIMA_4:
                case this.TYPE_ENDPOINTS.CLIMA_5:
                case this.TYPE_ENDPOINTS.CLIMA_6:
                case this.TYPE_ENDPOINTS.CLIMA_7:
                  if (actuation.value == "Off") {
                    this.notification.sendNotification("CLIMA_OFF");
                  } else {
                    this.notification.sendNotification("CLIMA_ON");
                  }
              }
            }
          }
        );
    }
  }

  checkOnMyDevices(devices, actuation) {
    return Observable.create((observable) => {
      let index = devices.findIndex((node) => node._id === actuation.device);
      if (index != -1) {
        let node = devices[index];
        let endpoints = node.scheme.endpoints;
        let endpointIndex = endpoints.findIndex(
          (endpoint) => endpoint._id === actuation.endpoint
        );

        if (endpointIndex != -1) {
          observable.next({
            id: endpoints[endpointIndex].id,
            name: node.display_name || node.name,
            notify: endpoints[endpointIndex].mobile_notification || false,
          });
          observable.complete();
        }
      }

      observable.next(false);
      observable.complete();
    });
  }

  setNodeAvailability(nodes: any[], setOff: boolean = false) {
    return Observable.create((observable) => {
      let availability: any[] = [];
      for (let i = 0; i < nodes.length; i++) {
        availability.push(nodes[i]);

        if (setOff) {
          this.setOffDevices(nodes[i]);
        }
      }

      for (let i = 0; i < availability.length; i++) {
        let index = this.myItems.findIndex(
          (node) => node === availability[i]._id
        );
        if (index === -1) {
          this.myItems.push(availability[i]._id);
        }
      }

      observable.next(availability);
      observable.complete();
    });
  }

  setOffDevices(device) {
    let deviceID = device._id;
    let endpoint = device.scheme.endpoints.filter(
      (a) => a.id === this.TYPE_ENDPOINTS.RELAY_0
    );
    if (endpoint[0]) {
      let endpointID = device.scheme.endpoints.filter(
        (a) => a.id === this.TYPE_ENDPOINTS.RELAY_0
      )[0]._id;
      let deviceOff = {
        device: deviceID,
        endpoint: endpointID,
        value: "Off",
      };

      this.actuatorService.create(deviceOff).subscribe(
        (res) => {
          ////console.log("Set off ", device.name, " :::", res);
        },
        (err) => {
          console.error("Update error:::", err);
        }
      );
    }
  }

  availabilityListener() {
    return this.nodeAvailability$.asObservable();
  }

  getSpecificNodes(nodetype, reset?: boolean): Observable<any> {
    const nodesObs = Observable.create((observable) => {
      try {
        this.groupService
          .showAll({ name: nodetype })
          .pipe(
            mergeMap((tag: any) => {
              if (tag.docs.length) {
                return this.nodeService
                  .showAll({
                    limit: 100,
                    groups: tag.docs[0]._id,
                    include: "room",
                  })
                  .pipe(map((res: any) => res.docs));
              } else {
                observable.next([]);
                observable.complete();
                return [];
              }
            })
          )
          .subscribe(
            (res) => {
              observable.next(res);
              observable.complete();
            },
            (err) => {
              observable.next([]);
              observable.complete();
            }
          );
      } catch (e) {
        observable.next([]);
        observable.complete();
      }
    });

    if (reset) {
      this.cache.removeItem("gz-nodes-" + nodetype);
      return this.cache.loadFromObservable(
        "gz-nodes-" + nodetype,
        nodesObs,
        nodetype
      );
    } else {
      return this.cache.loadFromObservable(
        "gz-nodes-" + nodetype,
        nodesObs,
        nodetype
      );
    }
  }

  ngOnDestroy() {}
}
