import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class NodePeriodicityProvider {
  constructor() {}

  updatePeriodicity(currentItems: any[] = []) {
    // let periodicity;
    // for (let i = 0; i < currentItems.length; i++) {
    //   if (
    //     currentItems[i].scheme.code === Constants.TYPE_NODE.TRUST_EXTENDED_LIGHT
    //   ) {
    //     currentItems[i].status = true;
    //     continue;
    //   }

    //   periodicity = currentItems[i].periodicity
    //     ? currentItems[i].periodicity / 1000
    //     : 3600;
    //   let currentTimestamp = moment(new Date());
    //   let timestampDevice = moment(new Date());
    //   if (currentItems[i].last_update) {
    //     timestampDevice = moment(new Date(currentItems[i].last_update));
    //   }
    //   if (currentTimestamp.diff(timestampDevice, "seconds") > periodicity) {
    //     currentItems[i].status = false;
    //   } else {
    //     currentItems[i].status = true;
    //   }
    // }
    return currentItems;
  }

  updateDevice(currentItems: any[] = [], itemUpdated: any) {
    // if (itemUpdated) {
    //   // Returns the index of the last item matching the given filtering attribute in the array.
    //   let periodicity = itemUpdated.periodicity
    //     ? itemUpdated.periodicity / 1000
    //     : 3600;
    //   let i = _.findLastIndex(currentItems, { _id: itemUpdated._id });
    //   let currentTimestamp = moment(new Date());
    //   let timestampDevice = moment(new Date());
    //   if (currentItems[i].last_update) {
    //     timestampDevice = moment(new Date(currentItems[i].last_update));
    //   }
    //   if (i) {
    //     if (currentTimestamp.diff(timestampDevice, "seconds") > periodicity) {
    //       currentItems[i].status = true;
    //     }
    //   } else {
    //     if (currentTimestamp.diff(timestampDevice, "seconds") > periodicity) {
    //       itemUpdated.status = true;
    //     }
    //     currentItems.push(itemUpdated);
    //   }
    // }
    return currentItems;
  }
}
