import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { IOrder } from '../../order/order.model';
import { Subject } from '../../../../node_modules/rxjs';
import { LocationService } from '../../location/location.service';

@Component({
  selector: 'app-assignment-page',
  templateUrl: './assignment-page.component.html',
  styleUrls: ['./assignment-page.component.scss']
})
export class AssignmentPageComponent implements OnInit, OnDestroy {

  @Input() orders: IOrder[];
  onDestroy$ = new Subject();
  groupedAssignments = [];

  constructor(
    private locationSvc: LocationService,
    // private mallSvc: MallService
  ) {

  }

  ngOnInit() {
    if (this.orders && this.orders.length > 0) {
    }
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

}
