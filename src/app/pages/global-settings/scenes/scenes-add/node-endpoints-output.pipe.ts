import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nodeEndpointsOutput',
  pure: false
})
export class NodeEndpointsOutputPipe implements PipeTransform {
  constructor() { }
  transform(items: any): any[] {
    const itemRes = items.filter(item => item.dir !== 'input');
    return itemRes;
  }
}