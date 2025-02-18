import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InTogglesPage } from './in-toggles.component';

const routes: Routes = [
  {
    path: ':section',
    component: InTogglesPage,
    runGuardsAndResolvers: 'always'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InTogglesPageRoutingModule { }
