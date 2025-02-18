import { Injectable } from "@angular/core";
import {map} from "rxjs/operators";
import { Actuator } from "../../models/actuator.model";
import { ApiNew } from "./api-new";
import { Observable, of } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ActuatorService {
  isLocked = false;
  pendingActuations: Actuator[] = [];
  constructor(private apiNew: ApiNew) {}

  create(data: Actuator, isDali: boolean = false) {
    if (this.isLocked && isDali) {
      this.pendingActuations.push(data);
      return of(false);
    } else {
      if (isDali) {
        this.isLocked = true;
      }
      return this.apiNew.post("actuations", data);
    }
  }

  update(id: string, data: Actuator) {
    return this.apiNew.put("actuations", id, data);
  }
  delete(id: string) {
    return this.apiNew.delete("actuations", id);
  }
  show(id: string) {
    return this.apiNew.getOne("actuations", id);
  }
  showAll(params: any = {}) {
    return this.apiNew.getAll("actuations", params);
  }

  release() {
    this.isLocked = false;
    if (this.pendingActuations.length > 0) {
      const nextActuation = this.pendingActuations.shift();
      if (nextActuation) {
        this.create(nextActuation, true).subscribe((result) => {
          if (result !== false) {
            this.release();
          }
        });
      }
    }
  }
}
