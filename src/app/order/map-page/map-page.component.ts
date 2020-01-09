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
import { SharedService } from '../../shared/shared.service';
import { IAccount } from '../../account/account.model';
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
  delivered;
  phases = [];

  constructor(
    private rx: NgRedux<IAppState>,
    private orderSvc: OrderService,
    private accountSvc: AccountService,
    private assignmentSvc: AssignmentService,
    private sharedSvc: SharedService
  ) {
    this.currLocation = { lat: 43.8461479, lng: -79.37935279999999 };
  }

  ngOnInit() {
    const self = this;

    this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe((account: IAccount) => {
      self.account = account;
      self.reload();
    });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  reload() {
    const self = this;
    const icons = {
      yellow: 'http://maps.google.com/mapfiles/ms/icons/yellow.png',
      green: 'http://maps.google.com/mapfiles/ms/icons/green.png',
      red: 'http://maps.google.com/mapfiles/ms/icons/red.png',
    };

    const accountId = this.account._id;
    const os = [];
    const range = { $gt: moment().startOf('day').toISOString(), $lt: moment().endOf('day').toISOString() };

    const assignmentQuery = { delivered: range, driverId: accountId };
    this.assignmentSvc.quickFind(assignmentQuery).pipe(takeUntil(this.onDestroy$)).subscribe(assignments => {
      this.assignments = assignments;
      const pickups = this.assignmentSvc.getPickupTimes(assignments);
      const orderQuery = { delivered: range, status: { $nin: ['del', 'bad', 'tmp'] } };

      this.orderSvc.quickFind(orderQuery).pipe(takeUntil(this.onDestroy$)).subscribe((orders: IOrder[]) => {

        const phases = [];
        pickups.map(pickup => {
          const os1 = orders.filter(x => x.delivered === this.sharedSvc.getDateTime(moment(), pickup).toISOString());
          const places = [];

          os1.map(order => {
            const assignment = assignments.find(a => a.orderId === order._id);
            if (assignment) {
              const icon = assignment.status === 'done' ? icons['green'] : icons['red'];

              const a = places.find(p => p && p.placeId === order.location.placeId);
              if (!a) {
                places.push({ status: assignment.status, icon: icon, name: order.clientName,  ...order.location });
              }
            }
          });

          phases.push({ pickup: pickup, places: places });
        });

        self.phases = phases;
      });
    });
  }
}
