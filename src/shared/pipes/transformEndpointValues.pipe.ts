import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'transformEndpointValues',
  standalone: true
})
// tslint:disable-next-line:class-name
export class TransformEndpointValues implements PipeTransform {
  transform(value: any, endpoint: any, section?: string): Number | Number[] | string {
    try {
      if (endpoint.units.length && value) {
        if (Array.isArray(value)) {
          if (
            'factor' in endpoint.units[0] &&
            'offset' in endpoint.units[0]
          ) {
            for (let i = 0; i < value.length; i++) {
              const tempValue = Number(value) * Number(endpoint.units[0].factor) - Number(endpoint.units[0].offset);
              if (tempValue) {
                value[i] = (Math.round(tempValue * 100) / 100);
              } else {
                value[i] = 0;
              }
            }
            return value;
          }
        } else {
          if (
            'factor' in endpoint.units[0] &&
            'offset' in endpoint.units[0]
          ) {
            const tempValue = Number(value) * Number(endpoint.units[0].factor) - Number(endpoint.units[0].offset);
            if (tempValue) {
              return (Math.round(tempValue * 100) / 100);
            } else {
              return 0;
            }
          }
        }
      }
    } catch (e) {
      console.error('No transform value');
    }
    return value;
  }
}
