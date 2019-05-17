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
      // this.reload();
    }
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  // ngOnChanges(v) {
  //   if (v.orders && v.orders.currentValue) {
  //     this.orders = v.orders.currentValue;
  //     this.reload();
  //   }
  // }

  // reload() {
  //   this.regionSvc.find().pipe(takeUntil(this.onDestroy$)).subscribe((ms: IMall[]) => {
  //     const assignments = this.partition(this.orders, ms);
  //     this.groupedAssignments = [];
  //     ms.map(m => {
  //       const assignmentsPerMall = assignments.filter(x => x.mallId === m.id);
  //       for (let i = 0; i < assignmentsPerMall.length; i++) {
  //         assignmentsPerMall[i].code = this.getCode(assignmentsPerMall[i], i);
  //       }

  //       this.groupedAssignments.push({ mallName: m.name, assignments: assignmentsPerMall });

  //     });
  //   });

  // }

  // getCode(assignment, n) {
  //   const index = n > 9 ? ('' + n) : ('0' + n);
  //   const streetName = assignment.location.streetName.toUpperCase();
  //   return assignment.mallName.charAt(0).toUpperCase() + index.substring(0, 2) + streetName.substring(0, 2);
  // }

  // partition(orders: IOrder[], malls: IMall[]) {
  //   const assignments: IAssignment[] = [];
  //   orders.map((order: IOrder) => {
  //     const row = [];
  //     let shortest = this.locationSvc.getDirectDistance(order.location, { lat: malls[0].lat, lng: malls[0].lng });
  //     let selectedMall = malls[0];

  //     malls.map((mall: IMall) => {
  //       const distance = this.locationSvc.getDirectDistance(order.location, { lat: mall.lat, lng: mall.lng });
  //       if (shortest > distance) {
  //         selectedMall = mall;
  //         shortest = distance;
  //       }
  //     });

  //     const assignment: IAssignment = {
  //       code: '',
  //       distance: shortest,
  //       status: 'new',
  //       created: new Date(),
  //       modified: new Date(),
  //       orderId: order.id,
  //       clientId: order.clientId,
  //       clientName: order.clientName,
  //       clientPhoneNumber: order.clientPhoneNumber,
  //       merchantId: order.merchantId,
  //       merchantName: order.merchantName,
  //       note: order.note,
  //       address: order.address,
  //       location: order.location,
  //       delivered: order.delivered,
  //       items: order.items,
  //       total: order.total,
  //       mallId: selectedMall.id,
  //       mallName: selectedMall.name,
  //       driverId: '',
  //       driverName: ''
  //     };

  //     assignments.push(assignment);
  //   });
  //   return assignments;
  // }
}
