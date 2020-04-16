// deprecated
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgRedux } from '../../../../node_modules/@angular-redux/store';
import { IAppState } from '../../store';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { Subject } from '../../../../node_modules/rxjs';
import { OrderService } from '../order.service';
import * as moment from 'moment';
import { IOrder, OrderStatus } from '../order.model';
import { AccountService } from '../../account/account.service';
import { SharedService } from '../../shared/shared.service';
import { IAccount } from '../../account/account.model';
const icons = {
  'F': {
    yellow: 'assets/images/f-yellow.png',
    green: 'assets/images/f-green.png',
    red: 'assets/images/f-red.png',
  },
  'G': {
    yellow: 'assets/images/g-yellow.png',
    green: 'assets/images/g-green.png',
    red: 'assets/images/g-red.png',
  },
};
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
  delivered;
  phases = [];

  constructor(
    private rx: NgRedux<IAppState>,
    private orderSvc: OrderService,
    private accountSvc: AccountService,
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
    const range = { $gt: moment().startOf('day').toISOString(), $lt: moment().endOf('day').toISOString() };
    const orderQuery = {
      delivered: range,
      driverId: this.account._id,
      status: { $nin: [OrderStatus.BAD, OrderStatus.DELETED, OrderStatus.TEMP] }
    };
    const fields = ['code', 'clientName', 'merchantName', 'status', 'client', 'note', 'items'];
    this.orderSvc.quickFind(orderQuery, fields).pipe(takeUntil(this.onDestroy$)).subscribe((orders: any[]) => {
      const pickups = ['所有订单', '10:00', '11:20']; // this.orderSvc.getPickupTimes(orders);
      const phases = [];
      let os1;
      pickups.map(pickup => {
        if (pickup === '所有订单') {
          os1 = orders;
        } else {
          os1 = orders.filter(x => x.pickupTime === pickup);
        }
        // const os1 = orders.filter(x => x.delivered === this.sharedSvc.getDateTime(moment(), pickup).toISOString());
        const places = [];

        os1.map(order => {
          const icon = order.status === OrderStatus.DONE ? icons[order.type]['green'] : icons[order.type]['red'];

          const a = places.find(p => p && p.location.placeId === order.location.placeId);
          const location = order.location;
          if (a) {
            a.orders.push(order);
          } else {
            places.push({ status: order.status, icon: icon, name: order.clientName, location, orders: [order] });
          }
        });

        phases.push({ pickup: pickup, places: places });
      });

      self.phases = phases;
    });
  }

}
