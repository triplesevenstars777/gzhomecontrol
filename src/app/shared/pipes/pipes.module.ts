import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeEndpointsOutputPipe } from './node-endpoints-output.pipe';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    NodeEndpointsOutputPipe
  ],
  exports: [
    NodeEndpointsOutputPipe
  ]
})
export class PipesModule { }
