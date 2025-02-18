import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nodeEndpointsOutput',
  standalone: false
})
export class NodeEndpointsOutputPipe implements PipeTransform {
  transform(endpoints: any[]): any[] {
    if (!endpoints) {
      return [];
    }
    
    // Filter endpoints that are output type
    return endpoints.filter(endpoint => 
      endpoint.type === 'output' || 
      endpoint.type === 'stateful' || 
      endpoint.type === 'relay'
    );
  }
}
