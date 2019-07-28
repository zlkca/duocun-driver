import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AssignmentRoutingModule } from './assignment-routing.module';
import { AssignmentPageComponent } from './assignment-page/assignment-page.component';
import { PickupPageComponent } from './pickup-page/pickup-page.component';

@NgModule({
  imports: [
    CommonModule,
    AssignmentRoutingModule
  ],
  declarations: [AssignmentPageComponent, PickupPageComponent]
})
export class AssignmentModule { }
