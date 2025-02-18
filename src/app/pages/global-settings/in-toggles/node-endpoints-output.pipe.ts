import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nodeEndpointsOutput',
  standalone: true
})
export class NodeEndpointsOutputPipe implements PipeTransform {
  transform(endpoints: any[]): any[] {
    if (!endpoints) {
      return [];
    }
    return endpoints.filter(endpoint => endpoint.dir !== 'input');
  }
}
