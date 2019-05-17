import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgRedux } from '../../../../node_modules/@angular-redux/store';
import { IAppState } from '../../store';
import { ILocation } from '../../location/location.model';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { Subject } from '../../../../node_modules/rxjs';
import { OrderService } from '../order.service';
import * as moment from 'moment';
import { SharedService } from '../../shared/shared.service';
import { Order, IOrder } from '../order.model';
import { AccountService } from '../../account/account.service';
import { AssignmentService } from '../../assignment/assignment.service';
import { IAssignment } from '../../assignment/assignment.model';
@Component({
  selector: 'app-map-page',
  templateUrl: './map-page.component.html',
  styleUrls: ['./map-page.component.scss']
})
export class MapPageComponent implements OnInit, OnDestroy {
  private onDestroy$ = new Subject();
  currLocation;
  places = [];
  orders = [];
  dateRange;
  account;
  assignments: IAssignment[] = [];

  constructor(
    private rx: NgRedux<IAppState>,
    private orderSvc: OrderService,
    private sharedSvc: SharedService,
    private accountSvc: AccountService,
    private assignmentSvc: AssignmentService
  ) {
    this.rx.select<ILocation>('location').pipe(
      takeUntil(this.onDestroy$)
    ).subscribe(loc => {
      if (loc) {
        this.currLocation = loc;
      } else {
        this.currLocation = { lat: 43.8461479, lng: -79.37935279999999 };
      }
    });
  }

  ngOnInit() {
    const self = this;
    this.dateRange = this.getDateRange();

    self.accountSvc.getCurrent().pipe(
      takeUntil(this.onDestroy$)
    ).subscribe(account => {
      self.account = account;
      self.assignmentSvc.find({where: {driverId: account.id}}).pipe(takeUntil(self.onDestroy$)).subscribe(xs => {
        self.assignments = xs;
        self.reload(xs);
      });
    });
    // this.reload();
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  reload(assignments: IAssignment[]) {
    const self = this;
    self.orderSvc.find({ where: { delivered: self.dateRange } }).pipe(
      takeUntil(this.onDestroy$)
    ).subscribe(orders => {
      self.orders = orders;
      const places = [];
      orders.map((order: IOrder) => {
        if (order.status !== 'paid') {

          const assignment = self.assignments.find(a => a.orderId === order.id);
          if (assignment) {
            const loc = order.location;
            const obj = { name: order.clientName, lat: loc.lat, lng: loc.lng };
            places.push(obj);
          }
        }
      });
      self.places = places;
    });
  }

  getDateRange() {
    const now = this.sharedSvc.getNow();
    const dayEnd = this.sharedSvc.getStartOf('day').set({ hour: 19, minute: 30, second: 0, millisecond: 0 });

    if (now.isAfter(dayEnd)) {
      // this.deliverTime = this.sharedSvc.getStartOf('day').add(1, 'days')
      //   .set({ hour: 11, minute: 45, second: 0, millisecond: 0 })
      //   .format('YYYY-MM-DD HH:mm:ss');

      const tomorrowStart = this.sharedSvc.getStartOf('day').add(1, 'days').toDate();
      const tomorrowEnd = this.sharedSvc.getEndOf('day').add(1, 'days').toDate();
      return { $lt: tomorrowEnd, $gt: tomorrowStart };
    } else {
      // this.deliverTime = this.sharedSvc.getStartOf('day')
      //   .set({ hour: 11, minute: 45, second: 0, millisecond: 0 })
      //   .format('YYYY-MM-DD HH:mm:ss');

      const todayStart = this.sharedSvc.getStartOf('day').toDate();
      const todayEnd = this.sharedSvc.getEndOf('day').toDate();
      return { $lt: todayEnd, $gt: todayStart };
    }
  }
}
