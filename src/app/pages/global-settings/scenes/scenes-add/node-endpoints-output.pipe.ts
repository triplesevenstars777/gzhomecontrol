import { Pipe, PipeTransform } from '@angular/core';

interface EndpointItem {
  id: string;
  name: string;
  display_name?: string;
  dir: string;
  type?: string;
  _id: string;
}

@Pipe({
  name: 'nodeEndpointsOutput',
  pure: false,
  standalone: false
})
export class NodeEndpointsOutputPipe implements PipeTransform {
  transform(items: EndpointItem[]): EndpointItem[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items.filter(item => item.dir !== 'input');
  }
}
