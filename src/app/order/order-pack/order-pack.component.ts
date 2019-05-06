import { Component, OnInit, Input, OnChanges, OnDestroy } from '@angular/core';
import { IRestaurant } from '../../restaurant/restaurant.model';
import { IOrder, IOrderItem } from '../order.model';
import { OrderService } from '../order.service';
import { SharedService } from '../../shared/shared.service';
import { Subject } from '../../../../node_modules/rxjs';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { ILocation } from '../../location/location.model';
import { IMall } from '../../mall/mall.model';
import { LocationService } from '../../location/location.service';
import { AccountService } from '../../account/account.service';
import { IAccount } from '../../account/account.model';
import { MatSnackBar } from '../../../../node_modules/@angular/material';

@Component({
  selector: 'app-order-pack',
  templateUrl: './order-pack.component.html',
  styleUrls: ['./order-pack.component.scss']
})
export class OrderPackComponent implements OnInit, OnChanges, OnDestroy {
  @Input() restaurant: IRestaurant;
  @Input() dateRange;

  account: IAccount;
  orders: IOrder[] = [];
  list: IOrderItem[];
  ordersWithNote: IOrder[] = [];
  onDestroy$ = new Subject();

  constructor(
    private orderSvc: OrderService,
    private sharedSvc: SharedService,
    private accountSvc: AccountService,
    private locationSvc: LocationService,
    private snackBar: MatSnackBar
  ) {
    const self = this;
    self.accountSvc.getCurrent().pipe(
      takeUntil(this.onDestroy$)
    ).subscribe(account => {
      self.account = account;
    });
  }

  ngOnInit() {
    const self = this;
    self.reload();

    // this.socketSvc.on('updateOrders', x => {
    //   // self.onFilterOrders(this.selectedRange);
    //   if (x.clientId === self.account.id) {
    //     const index = self.orders.findIndex(i => i.id === x.id);
    //     if (index !== -1) {
    //       self.orders[index] = x;
    //     } else {
    //       self.orders.push(x);
    //     }
    //     self.orders.sort((a: Order, b: Order) => {
    //       if (this.sharedSvc.compareDateTime(a.created, b.created)) {
    //         return -1;
    //       } else {
    //         return 1;
    //       }
    //     });
    //   }
    // });
  }

  reload() {
    const self = this;
    self.orderSvc.find({ where: { delivered: self.dateRange } }).pipe(
      takeUntil(this.onDestroy$)
    ).subscribe(orders => {
      orders.map(order => { order.paid = (order.status === 'paid'); });
      self.orders = orders;
    });
  }

  onSelect(c) {
    // this.select.emit({ order: c });
  }

  toDateTimeString(s) {
    return s ? this.sharedSvc.toDateTimeString(s) : '';
  }

  ngOnChanges(v) {
    this.reload();
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  navigateTo(location: ILocation) {
    (<any>window).location = encodeURI('https://www.google.com/maps/dir/?api=1&destination=' +
      + location.streetNumber + '+' + location.streetName + '+'
      + (location.subLocality ? location.subLocality : location.city) + '+'
      + location.province
      + '&destination_placeId=' + location.placeId);
  }

  patition(orders: IOrder[], malls: IMall[]) {
    const groupedOrders = [];
    orders.map((order: IOrder) => {
      const row = [];
      let shortest = this.locationSvc.getDirectDistance(order.location, { lat: malls[0].lat, lng: malls[0].lng });
      let selectedMall = malls[0];

      malls.map((mall: IMall) => {
        const distance = this.locationSvc.getDirectDistance(order.location, { lat: mall.lat, lng: mall.lng });
        if (shortest > distance) {
          selectedMall = mall;
          shortest = distance;
        }
      });
      groupedOrders.push({ order: order, mall: selectedMall, distance: shortest });
    });
    return groupedOrders;
  }

  togglePaid(e, order) {
    const data = {
      status: e.checked ? 'paid' : 'unpaid',
      stuffId: this.account.id,
      stuffName: this.account.username
    };

    this.orderSvc.update({ id: order.id }, data).pipe(takeUntil(this.onDestroy$)).subscribe(x => {
      if (x && x.ok) {
        this.snackBar.open('', '已完成客户' + order.clientName + '的订单', { duration: 2000 });
        this.reload();
      }
    });
  }

}
