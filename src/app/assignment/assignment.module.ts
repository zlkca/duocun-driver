import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AssignmentRoutingModule } from './assignment-routing.module';
import { AssignmentPageComponent } from './assignment-page/assignment-page.component';

@NgModule({
  imports: [
    CommonModule,
    AssignmentRoutingModule
  ],
  declarations: [AssignmentPageComponent]
})
export class AssignmentModule { }
