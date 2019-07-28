import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PickupPageComponent } from './pickup-page/pickup-page.component';

const routes: Routes = [{
  path: 'pickup', component: PickupPageComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AssignmentRoutingModule { }
