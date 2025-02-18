import { Injectable } from "@angular/core";
import { ApiNew } from "./api-new";
import { Node } from "../../models/node.model";

@Injectable({
  providedIn: 'root'
})
export class NodeService {
  constructor(private apiNew: ApiNew) {}

  create(data: Node) {
    return this.apiNew.post("devices", data);
  }
  update(id: string, data: any) {
    return this.apiNew.put("devices", id, data);
  }
  delete(id: string) {
    return this.apiNew.delete("devices", id);
  }
  show(id: string) {
    return this.apiNew.getOne("devices", id);
  }
  showAll(params: any = {}) {
    return this.apiNew.getAll("devices", params);
  }
  blockDevicesStatus() {
    return this.apiNew.getAll("devices/getBlockedMyDevices");
  }
  blockDevices(block: boolean) {
    return this.apiNew.post("devices/setBlockedMyDevices", {
      blocked: block,
    });
  }
}
