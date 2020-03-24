import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from '../../../../node_modules/rxjs';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import * as moment from 'moment';
import { IMerchant, MerchantType, MerchantStatus } from '../../restaurant/restaurant.model';
import { OrderStatus, IOrder, IOrderItem } from '../order.model';
import { MerchantService } from '../../restaurant/restaurant.service';
import { AccountService } from '../../account/account.service';
import { OrderService } from '../order.service';
import { Router } from '../../../../node_modules/@angular/router';
import { ILocation } from '../../location/location.model';
import { SharedService } from '../../shared/shared.service';
import { LocationService } from '../../location/location.service';

export const DriverStatus = {
  ACTIVE: 'A',
  INACTIVE: 'I'
};

@Component({
  selector: 'app-pickup-page',
  templateUrl: './pickup-page.component.html',
  styleUrls: ['./pickup-page.component.scss']
})
export class PickupPageComponent implements OnInit, OnDestroy {
  onDestroy$ = new Subject();

  orders;
  pickups;
  account;
  merchants;
  groups;
  pickup = '11:20';

  constructor(
    private merchantSvc: MerchantService,
    private accountSvc: AccountService,
    private orderSvc: OrderService,
    private sharedSvc: SharedService,
    private locationSvc: LocationService,
    private router: Router,
    // private snackBar: MatSnackBar
  ) {

  }

  ngOnInit() {
    this.mount().then((account) => {
      if (account) {
        this.groups = this.groupByMerchants(this.orders);
      } else {
        this.router.navigate(['account/setting'], { queryParams: { merchant: false } }); // fix me
      }
    });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  // ngOnChanges(v) {
  //   this.mount(this.dateTime).then((orders: IOrder[]) => {
  //     this.dataSource = new MatTableDataSource(orders);
  //     this.dataSource.sort = this.sort;
  //     this.places = this.getMapMarkers(orders, this.colors);
  //   });
  // }

  mount() {
    const self = this;
    const pickupTime = this.pickup;
    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve, reject) => {
      // const status = DriverStatus.ACTIVE;
      this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
        self.account = account;

        if (account) {
          const q = { status: MerchantStatus.ACTIVE, type: { $in: [MerchantType.RESTAURANT, MerchantType.GROCERY] } };
          self.merchantSvc.quickFind(q).pipe(takeUntil(this.onDestroy$)).subscribe((rs: IMerchant[]) => {
            self.merchants = rs;

            const sDate = moment().format('YYYY-MM-DD');
            const start = moment(sDate).toISOString();
            const end = moment(sDate).add(1, 'days').toISOString();
            const dateRange = { $gt: start, $lt: end };
            const driverId = account._id;
            const qOrder = {
              pickupTime,
              driverId,
              delivered: dateRange,
              status: { $nin: [OrderStatus.BAD, OrderStatus.DELETED, OrderStatus.TEMP] }
            };
            this.orderSvc.find(qOrder).pipe(takeUntil(this.onDestroy$)).subscribe((orders: IOrder[]) => {
              this.orders = [...orders];
              this.pickups = this.getPickupList();
              resolve(account);
            });
          });
        } else { // not authorized for opreration merchant
          resolve();
        }
      });
    });
  }

  // reload only changable datas
  reload(pickupTime) {
    return new Promise((resolve, reject) => {
      const sDate = moment().format('YYYY-MM-DD');
      const start = moment(sDate).toISOString();
      const end = moment(sDate).add(1, 'days').toISOString();
      const dateRange = { $gt: start, $lt: end };
      const driverId = this.account._id;
      const qOrder = {
        driverId,
        pickupTime,
        delivered: dateRange,
        status: { $nin: [OrderStatus.BAD, OrderStatus.DELETED, OrderStatus.TEMP] }
      };
      this.orderSvc.find(qOrder).pipe(takeUntil(this.onDestroy$)).subscribe((orders: IOrder[]) => {
        this.orders = [...orders];
        return resolve(orders);
      });
    });
  }



  // pickupTime --- eg. '11:20'
  // reload(accounts: IAccount[], pickupTime: string) {
  //   const self = this;
  //   const range = { $gt: moment().startOf('day').toISOString(), $lt: moment().endOf('day').toISOString() };
  //   const orderQuery = {
  //     driverId: this.account._id,
  //     delivered: range,
  //     pickup: pickupTime,
  //     status: { $nin: [OrderStatus.BAD, OrderStatus.DELETED, OrderStatus.TEMP] }
  //   };

  //   this.orderSvc.find(orderQuery).pipe(takeUntil(this.onDestroy$)).subscribe((orders: IOrder[]) => {
  //     self.loading = false;
  //     self.groups = this.groupByMerchants(accounts, orders);
  //   });
  // }

  getPickupList() {
    // const pickups = [];
    // // fix me in next stage;
    // schedules.map(s => {
    //   // if(s.)
    // });
    return ['10:00', '11:20'];
  }

  // return array of {merchantId: x, merchantName: x, items: [{order:x, status: x}, ... ]}
  groupByMerchants(orders: IOrder[]) {
    const groupedByMerchants = [];
    orders.map(order => {
      const grp = groupedByMerchants.find(m => m.merchantId === order.merchantId);
      // const account = accounts.find(a => a._id === order.clientId);
      // const balance = account ? account.balance : 0;
      // if (!account) {
      //   console.log(order.clientId);
      // }

      if (!grp) {
        const item = { order, code: order.code, status: order.status, isPicked: this.isPicked(order) };
        groupedByMerchants.push({ merchantId: order.merchantId, merchantName: order.merchantName, items: [item] });
      } else {
        grp.items.push({ order, code: order.code, status: order.status, isPicked: this.isPicked(order) });
      }
    });
    return groupedByMerchants;
  }

  isPicked(order: IOrder) {
    return order.status === OrderStatus.LOADED || order.status === OrderStatus.DONE;
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

  // patition(orders: IOrder[], malls: IMall[]) {
  //   const groupedOrders = [];
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
  //     groupedOrders.push({ order: order, mall: selectedMall, distance: shortest });
  //   });
  //   return groupedOrders;
  // }

  onSelectPickup(e) {
    this.pickup = e.value;
    this.reload(this.pickup).then((orders: IOrder[]) => {
      this.orders = orders;
      this.groups = this.groupByMerchants(this.orders);
      // let list;
      // if (this.pickup === '所有订单') {
      //   list = orders;
      // } else {
      //   list = this.orders.filter(order => order.pickupTime === this.pickup);
      // }
    });
  }
}
