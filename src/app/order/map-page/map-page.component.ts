import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgRedux } from '../../../../node_modules/@angular-redux/store';
import { IAppState } from '../../store';
import { ILocation } from '../../location/location.model';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { Subject } from '../../../../node_modules/rxjs';
import { OrderService } from '../order.service';
import * as moment from 'moment';
import { Order, IOrder } from '../order.model';
import { AccountService } from '../../account/account.service';
import { AssignmentService } from '../../assignment/assignment.service';
import { IAssignment } from '../../assignment/assignment.model';
import { AccountActions } from '../../account/account.actions';
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
    private accountSvc: AccountService,
    private assignmentSvc: AssignmentService
  ) {
    // this.rx.select<ILocation>('location').pipe(takeUntil(this.onDestroy$)).subscribe(loc => {
    //   if (loc) {
    //     this.currLocation = loc;
    //   } else {
        this.currLocation = { lat: 43.8461479, lng: -79.37935279999999 };
    //   }
    // });
  }

  ngOnInit() {
    const self = this;
    this.dateRange = this.getDateRange();

    this.accountSvc.getCurrentUser().pipe(takeUntil(this.onDestroy$)).subscribe((account: Account) => {
      self.account = account;
      // self.rx.dispatch({ type: AccountActions.UPDATE, payload: account });
      const dt = moment().set({ hour: 11, minute: 45, second: 0, millisecond: 0 });
      const q = { driverId: account.id, delivered: dt.toISOString() };
      self.assignmentSvc.find(q).pipe(takeUntil(self.onDestroy$)).subscribe(xs => {
        self.assignments = xs;
        self.reload(xs);
      });
    });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  reload(assignments: IAssignment[]) {
    const self = this;
    const icons = {
      yellow: 'http://maps.google.com/mapfiles/ms/icons/yellow.png',
      green: 'http://maps.google.com/mapfiles/ms/icons/green.png',
      red: 'http://maps.google.com/mapfiles/ms/icons/red.png',
    };
    const dt = moment().set({ hour: 11, minute: 45, second: 0, millisecond: 0 });
    const q = { delivered: dt.toISOString(), status: { $nin: ['del', 'bad', 'tmp'] } };
    self.orderSvc.find(q).pipe(takeUntil(this.onDestroy$)).subscribe(orders => {
      self.orders = orders;
      const places = [];
      orders.map((order: IOrder) => {
        const assignment = assignments.find(a => a.orderId === order._id);
        // paid will be green and will not be able to navigate
        if (assignment) {
          const icon = order.status === 'paid' ? icons['green'] : icons['red'];
          places.push({ icon: icon, name: order.client.username, status: order.status, ...order.location });
        }
      });
      self.places = places;
    });
  }

  getDateRange() {
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    return { $lt: todayEnd, $gt: todayStart };
  }
}
