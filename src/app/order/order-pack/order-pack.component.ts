import { Component, OnInit, Input, OnDestroy } from '@angular/core';
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
import { AssignmentService } from '../../assignment/assignment.service';
import { FormBuilder } from '../../../../node_modules/@angular/forms';
import { ClientPaymentService } from '../../payment/client-payment.service';
import { IClientPayment } from '../../payment/payment.model';
import { IAssignment } from '../../assignment/assignment.model';
import { ClientBalanceService } from '../../payment/client-balance.service';
import { IMerchantBalance, IClientBalance } from '../../payment/payment.model';
import { group } from '../../../../node_modules/@angular/animations';
import * as moment from 'moment';
import { TransactionService } from '../../transaction/transaction.service';
import { ITransaction } from '../../transaction/transaction.model';
import { Router } from '../../../../node_modules/@angular/router';

@Component({
  selector: 'app-order-pack',
  templateUrl: './order-pack.component.html',
  styleUrls: ['./order-pack.component.scss']
})
export class OrderPackComponent implements OnInit, OnDestroy {
  @Input() restaurant: IRestaurant;
  @Input() delivered; // moment object
  @Input() account: IAccount;

  orders: IOrder[] = [];
  list: IOrderItem[];
  ordersWithNote: IOrder[] = [];
  onDestroy$ = new Subject();
  assignments;
  forms = {};
  clientBalances = [];
  ordersByMerchants = [];
  clientIds = [];
  constructor(
    private orderSvc: OrderService,
    private sharedSvc: SharedService,
    private accountSvc: AccountService,
    private router: Router,
    private locationSvc: LocationService,
    private assignmentSvc: AssignmentService,
    private clientPaymentSvc: ClientPaymentService,
    private clientBalanceSvc: ClientBalanceService,
    private transactionSvc: TransactionService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    const self = this;
  }

  ngOnInit() {
    const self = this;

    if (this.account) {
      const query = {
        driverId: this.account.id,
        delivered: this.delivered.toISOString()
      };

      this.assignmentSvc.find(query).pipe(takeUntil(self.onDestroy$)).subscribe(xs => {
        self.assignments = xs;

        const clientIds: string[] = [];
        xs.map(x => {
          const client = clientIds.find(cId => cId === x.clientId);
          if (!client) {
            clientIds.push(x.clientId);
          }
        });
        self.clientIds = clientIds;
        const q = { accountId: { $in: clientIds } };
        self.clientBalanceSvc.find(q).pipe(takeUntil(this.onDestroy$)).subscribe((cbs: IClientBalance[]) => {
          self.clientBalances = cbs;
          self.reload(cbs);
        });
      });
    } else {
      this.router.navigate(['account/login']);
    }

    // setTimeout(() => {
    //   self.reload();
    // }, 2000);

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

  groupByMerchants(orders: IOrder[]) {
    const groupedByMerchants = [];
    orders.map(order => {
      const item = groupedByMerchants.find(m => m.merchantId === order.merchantId);
      if (!item) {
        groupedByMerchants.push({ merchantId: order.merchant._id, merchantName: order.merchant.name, orders: [order] });
      } else {
        item.orders.push(order);
      }
    });
    return groupedByMerchants;
  }

  getQuantity(order: IOrder) {
    let quantity = 0;
    order.items.map((item: IOrderItem) => {
      quantity += item.quantity;
    });
    return quantity;
  }

  reload(balances: IClientBalance[]) {
    const self = this;
    const os = [];

    const tStart = moment(this.delivered).startOf('day').toDate();
    const tEnd = moment(this.delivered).endOf('day').toDate();
    const range = { $lt: tEnd, $gt: tStart };

    const orderQuery = { delivered: this.delivered.toISOString(), status: { $nin: ['del', 'bad', 'tmp'] } };
    const transactionQuery = { created: range, type: 'credit', toId: this.account.id };

    this.transactionSvc.find(transactionQuery).pipe(takeUntil(this.onDestroy$)).subscribe(ts => {
      this.orderSvc.find(orderQuery).pipe(takeUntil(this.onDestroy$)).subscribe((orders: IOrder[]) => {
        this.forms = {};
        orders.map(order => {
          const transaction = ts.find(t => t.orderId === order._id);
          if (transaction) {
            order.received = transaction.amount;
          }

          const balance: IClientBalance = balances.find(x => x.accountId === order.clientId);
          if (balance) {
            order.balance = balance.amount; // new balance
            order.receivable = (balance.amount >= 0) ? 0 : Math.abs(balance.amount);
          } else {
            order.receivable = order.total;
          }

          const ordersClient: IOrder[] = orders.filter(x => x.clientId === order.clientId);
          order.nOrders = ordersClient.length;

          let sum = 0;
          ordersClient.map(x => sum += x.total);
          order.owe = (balance.amount + sum) < 0 ? Math.abs(balance.amount + sum) : 0;

          // only load order belongs to this driver
          const assignment = this.assignments.find(x => x.orderId === order._id);
          if (assignment) {
            order.code = assignment.code;
            order.paid = (order.status === 'paid');
            this.forms[order._id] = this.fb.group({
              received: [0]
            });
            os.push(order);
          }
        });
        self.orders = os;
        self.ordersByMerchants = this.groupByMerchants(os);
      });
    });
  }

  onSelect(c) {
    // this.select.emit({ order: c });
  }

  toDateTimeString(s) {
    return s ? this.sharedSvc.toDateTimeString(s) : '';
  }

  // ngOnChanges(v) {
  //   // this.reload();
  //   const self = this;
  //   self.accountSvc.getCurrentUser().pipe(
  //     takeUntil(this.onDestroy$)
  //   ).subscribe(account => {
  //     self.account = account;
  //     self.assignmentSvc.find({ where: { driverId: account.id } }).pipe(takeUntil(self.onDestroy$)).subscribe(xs => {
  //       self.assignments = xs;
  //       self.reload(xs);
  //     });
  //   });
  // }

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

  togglePaid(e, order: IOrder) {
    const self = this;
    const toId = this.account._id;
    const toName = this.account.username;
    // const data = {
    //   status: e.checked ? 'paid' : 'unpaid',
    //   driverId: this.account.id,
    //   driverName: this.account.username,
    //   // receivable: order.receivable
    // };
    const received = Math.round(+this.forms[order._id].get('received').value * 100) / 100;
    order.received = received;
    // this.orderSvc.update({ id: order._id }, data).pipe(takeUntil(this.onDestroy$)).subscribe(x => {
    //   if (x && x.ok) {
    //     self.snackBar.open('', '已更新客户' + order.clientName + '的订单', { duration: 1500 });
    //     self.saveTransaction(received, order, (r) => {

    //       const balance: IClientBalance = self.clientBalances.find(cb => cb.accountId === order.clientId);
    //       const remain = Math.round((received + balance.amount) * 100) / 100;
    //       const q = { accountId: order.clientId };
    //       self.clientBalanceSvc.update(q, { amount: remain }).pipe(takeUntil(this.onDestroy$)).subscribe(bs => {
    //         self.snackBar.open('', '余额已更新', { duration: 1800 });

    //         const q1 = { accountId: { $in: self.clientIds } };
    //         self.clientBalanceSvc.find(q1).pipe(takeUntil(this.onDestroy$)).subscribe((cbs: IClientBalance[]) => {
    //           self.clientBalances = cbs;
    //           self.reload(cbs);
    //         });
    //       });
    //     });
    //   }
    // });

    const balance: IClientBalance = self.clientBalances.find(cb => cb.accountId === order.clientId);
    this.clientPaymentSvc.pay(toId, toName, received, balance.amount, order._id).pipe(takeUntil(this.onDestroy$)).subscribe((r) => {
      self.snackBar.open('', '余额已更新', { duration: 1800 });
      const q1 = { accountId: { $in: self.clientIds } };
      self.clientBalanceSvc.find(q1).pipe(takeUntil(this.onDestroy$)).subscribe((cbs: IClientBalance[]) => {
        self.clientBalances = cbs;
        self.reload(cbs);
      });
    });

    // this.savePayment(received, order);
  }


  // savePayment(received: number, order: IOrder) {
  //   const clientPayment: IClientPayment = {
  //     orderId: order._id,
  //     clientId: order.clientId,
  //     clientName: order.clientName,
  //     driverId: this.account.id,
  //     driverName: this.account.username,
  //     amount: received,
  //     type: 'credit',
  //     delivered: order.delivered,
  //     created: new Date(),
  //     modified: new Date(),
  //   };

  //   this.clientPaymentSvc.save(clientPayment).pipe(takeUntil(this.onDestroy$)).subscribe(x => {
  //     this.snackBar.open('', '已保存客户的付款', { duration: 2300 });
  //   });
  // }

  saveTransaction(received: number, order: IOrder, cb?: any) {
    const tr: ITransaction = {
      orderId: order._id,
      fromId: order.clientId,
      fromName: order.clientName,
      toId: this.account.id,
      toName: this.account.username,
      type: 'credit',
      amount: received,
      note: '',
      created: order.delivered,
      modified: new Date()
    };

    this.transactionSvc.save(tr).pipe(takeUntil(this.onDestroy$)).subscribe(x => {
      this.snackBar.open('', '已保存交易', { duration: 1000 });
      if (cb) {
        cb(received);
      }
    });
  }
}
