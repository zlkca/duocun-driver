import { Component, OnInit, Input, OnDestroy, OnChanges } from '@angular/core';
import { IMerchant } from '../../restaurant/restaurant.model';
import { IOrder, IOrderItem, OrderStatus } from '../order.model';
import { OrderService } from '../order.service';
import { SharedService } from '../../shared/shared.service';
import { Subject } from '../../../../node_modules/rxjs';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { ILocation } from '../../location/location.model';
import { IMall } from '../../mall/mall.model';
import { LocationService } from '../../location/location.service';
import { AccountService } from '../../account/account.service';
import { IAccount } from '../../account/account.model';
import { MatSnackBar, MatDialog } from '../../../../node_modules/@angular/material';
import * as moment from 'moment';
import { Router } from '../../../../node_modules/@angular/router';
import { ReceiveCashDialogComponent } from '../receive-cash-dialog/receive-cash-dialog.component';
import { ICommand } from '../../shared/command.reducers';
import { NgRedux } from '../../../../node_modules/@angular-redux/store';
import { IAppState } from '../../store';
import { PaymentMethod } from '../../payment/payment.model';

@Component({
  selector: 'app-order-pack',
  templateUrl: './order-pack.component.html',
  styleUrls: ['./order-pack.component.scss']
})
export class OrderPackComponent implements OnInit, OnDestroy, OnChanges {

  @Input() orders;
  @Input() pickupTime;
  @Input() restaurant: IMerchant;
  @Input() delivered; // moment object

  list: IOrderItem[];
  ordersWithNote: IOrder[] = [];
  onDestroy$ = new Subject();
  accounts = [];
  groups = [];
  clientIds = [];
  pickups = [];
  account;
  picked = {};
  Status = OrderStatus;
  loading = false;
  PaymentMethod = PaymentMethod;
  constructor(
    private orderSvc: OrderService,
    private sharedSvc: SharedService,
    private accountSvc: AccountService,
    private router: Router,
    private locationSvc: LocationService,
    private snackBar: MatSnackBar,
    private rx: NgRedux<IAppState>,
    public dialog: MatDialog
  ) {

  }

  ngOnInit() {
    const self = this;

    // why ??
    this.rx.select<ICommand>('cmd').pipe(takeUntil(this.onDestroy$)).subscribe((x: ICommand) => {
      if (x.name === 'reload-orders') {
        const q = { _id: { $in: self.clientIds } };
        this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
          self.account = account;
          self.accountSvc.quickFind(q).pipe(takeUntil(this.onDestroy$)).subscribe((accounts: IAccount[]) => {
            self.accounts = accounts;
            self.reload(accounts, this.pickupTime);
          });
        });
      }
    });

    this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe((account: IAccount) => {
      self.account = account;
      if (account) {
        if (this.orders) {
          self.clientIds = this.sharedSvc.getDistinctValues(this.orders, 'clientId');
          const q = { _id: { $in: self.clientIds } };
          self.accountSvc.find(q).pipe(takeUntil(this.onDestroy$)).subscribe((accounts: IAccount[]) => {
            self.accounts = accounts;

            self.reload(accounts, this.pickupTime);
          });
        }
      } else {
        this.router.navigate(['account/login']);
      }
    });
  }


  ngOnChanges(v) {
    const self = this;
    if (v.orders && v.orders.currentValue) {
      self.clientIds = this.sharedSvc.getDistinctValues(v.orders.currentValue, 'clientId');
      if (self.clientIds && self.clientIds.length > 0) {
        const q = { _id: { $in: self.clientIds } };
        self.loading = true;
        self.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
          self.account = account;
          self.accountSvc.quickFind(q).pipe(takeUntil(this.onDestroy$)).subscribe((accounts: IAccount[]) => {
            self.accounts = accounts;
            self.reload(accounts, this.pickupTime);
          });
        });
      }
    }
  }


  getProductCssClass(item) {
    if (item && item.product && item.product.categoryId === '5cbc5df61f85de03fd9e1f12') {
      return 'beverage';
    } else {
      return 'product';
    }
  }

  hasBeverage(order) {
    let bHas = false;
    order.items.map(item => {
      if (item && item.product && item.product.categoryId === '5cbc5df61f85de03fd9e1f12') {
        bHas = true;
      }
    });
    return bHas;
  }

  shouldExpend(it) {
    return (it.status !== OrderStatus.DONE || it.status !== OrderStatus.LOADED) && this.hasBeverage(it.order);
  }

  // return array of {merchantId: x, merchantName: x, items: [{order:x, status: x}, ... ]}
  groupByMerchants(accounts: IAccount[], orders: IOrder[]) {
    const groupedByMerchants = [];
    orders.map(order => {
      const grp = groupedByMerchants.find(m => m.merchantId === order.merchantId);
      const account = accounts.find(a => a._id === order.clientId);
      const balance = account ? account.balance : 0;
      if (!account) {
        console.log(order.clientId);
      }

      if (!grp) {
        const item = { balance: balance, order: order, code: order.code, status: order.status, isPicked: this.isPicked(order) };
        groupedByMerchants.push({ merchantId: order.merchantId, merchantName: order.merchantName, items: [item] });
      } else {
        grp.items.push({ balance: balance, order: order, code: order.code, status: order.status, isPicked: this.isPicked(order) });
      }
    });
    return groupedByMerchants;
  }

  isPicked(order: IOrder) {
    return order.status === OrderStatus.LOADED || order.status === OrderStatus.DONE;
  }

  onChangePicked(order: IOrder) {
    if (order.status !== OrderStatus.DONE) {
      const data = { status: order.status === OrderStatus.LOADED ? OrderStatus.NEW : OrderStatus.LOADED };
      this.orderSvc.update({ _id: order._id }, data).pipe(takeUntil(this.onDestroy$)).subscribe(() => {
        this.snackBar.open('', '取餐状态已更改', { duration: 1000 });
        this.reload(this.accounts, this.pickupTime);
      });
    }
  }

  // pickupTime --- eg. '11:20'
  reload(accounts: IAccount[], pickupTime: string) {
    const self = this;
    const range = { $gt: moment().startOf('day').toISOString(), $lt: moment().endOf('day').toISOString() };
    const orderQuery = {
      driverId: this.account._id,
      delivered: range,
      pickupTime,
      status: { $nin: [OrderStatus.BAD, OrderStatus.DELETED, OrderStatus.TEMP] }
    };

    this.orderSvc.find(orderQuery).pipe(takeUntil(this.onDestroy$)).subscribe((orders: IOrder[]) => {
      self.loading = false;
      self.groups = this.groupByMerchants(accounts, orders);
    });
  }

  onSelect(c) {
    // this.select.emit({ order: c });
  }


  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
  getQuantity(order: IOrder) {
    let quantity = 0;
    order.items.map((item: IOrderItem) => {
      quantity += item.quantity;
    });
    return quantity;
  }
  getAddress(location: ILocation) {
    return this.locationSvc.getAddrString(location);
  }
  toDateTimeString(s) {
    return s ? this.sharedSvc.toDateTimeString(s) : '';
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

  // deprecated
  togglePaid(e, order: IOrder) {

  }

  openReceiveCashDialog(order: IOrder) {
    const orderId = order._id;
    const params = {
      width: '300px',
      data: {
        title: '收款', content: '', buttonTextNo: '取消', buttonTextYes: '确认收款',
        orderId: orderId, accountId: this.account._id, accountName: this.account.username
      },
      panelClass: 'receive-cash-dialog'
    };
    const dialogRef = this.dialog.open(ReceiveCashDialogComponent, params);

    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy$)).subscribe(result => {

    });
  }

  finishDelivery(order: IOrder) {
    this.orderSvc.update({ _id: order._id }, { status: OrderStatus.DONE }).pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      this.snackBar.open('', '此订单已完成', { duration: 1800 });
      this.reload(this.accounts, this.pickupTime);
    });
  }


}
