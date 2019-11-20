import { Component, OnInit, Input, OnDestroy, ɵɵNgOnChangesFeature, OnChanges } from '@angular/core';
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
import { MatSnackBar, MatDialog } from '../../../../node_modules/@angular/material';
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
import { ReceiveCashDialogComponent } from '../receive-cash-dialog/receive-cash-dialog.component';
import { ICommand } from '../../shared/command.reducers';
import { NgRedux } from '../../../../node_modules/@angular-redux/store';
import { IAppState } from '../../store';

@Component({
  selector: 'app-order-pack',
  templateUrl: './order-pack.component.html',
  styleUrls: ['./order-pack.component.scss']
})
export class OrderPackComponent implements OnInit, OnDestroy, OnChanges {

  @Input() assignments;
  @Input() pickupTime;

  @Input() restaurant: IRestaurant;
  @Input() delivered; // moment object

  orders: IOrder[] = [];
  list: IOrderItem[];
  ordersWithNote: IOrder[] = [];
  onDestroy$ = new Subject();
  // assignments;
  forms = {};
  clientBalances = [];
  ordersByMerchants = [];
  clientIds = [];
  pickups = [];
  account;

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
    private fb: FormBuilder,
    private rx: NgRedux<IAppState>,
    public dialog: MatDialog
  ) {
    const self = this;
  }

  ngOnInit() {
    const self = this;

    this.rx.select<ICommand>('cmd').pipe(takeUntil(this.onDestroy$)).subscribe((x: ICommand) => {
      if (x.name === 'reload-orders') {
        const q = { accountId: { $in: self.clientIds } };
          self.accountSvc.find(q).pipe(takeUntil(this.onDestroy$)).subscribe((accounts: IAccount[]) => {
          self.reload(accounts, this.pickupTime);
        });
      }
    });

    const xs = this.assignments;
    this.accountSvc.getCurrentUser().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      self.account = account;
      if (account) {
        if (xs) {
          self.clientIds = this.sharedSvc.getDistinctValues(xs, 'clientId');
          const q = { accountId: { $in: self.clientIds } };
          // self.clientBalanceSvc.find(q).pipe(takeUntil(this.onDestroy$)).subscribe((cbs: IClientBalance[]) => {
          //   self.clientBalances = cbs;
          //   self.reload(cbs, this.pickupTime);
          // });
        }
      } else {
        this.router.navigate(['account/login']);
      }
    });

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


  ngOnChanges(v) {
    const self = this;
    if (v.assignments && v.assignments.currentValue) {
      const xs = v.assignments.currentValue;
      // this.reload(restaurant._id);
      self.clientIds = this.sharedSvc.getDistinctValues(xs, 'clientId');
      if (self.clientIds && self.clientIds.length > 0) {
        const q = { accountId: { $in: self.clientIds } };
        self.accountSvc.find(q).pipe(takeUntil(this.onDestroy$)).subscribe((accounts: IAccount[]) => {
          self.clientBalances = accounts;
          self.reload(accounts, this.pickupTime);
        });
      }
    }
  }

  groupByMerchants(orders: IOrder[]) {
    const groupedByMerchants = [];
    orders.map(order => {
      const item = groupedByMerchants.find(m => m.merchantId === order.merchantId);
      if (!item) {
        groupedByMerchants.push({ merchantId: order.merchantId, merchantName: order.merchantName, orders: [order] });
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

  // getPickupTimes(xs: IAssignment[]): string[] {
  //   return this.sharedSvc.getDistinctValues(xs, 'delivered').map(x => x.split('T')[1].split('.')[0]);
  // }


  // pickupTime --- eg. '11:20'
  reload(accounts: IAccount[], pickupTime: string) {
    const self = this;
    const accountId = this.account._id;
    const os = [];
    const range = { $gt: moment().startOf('day').toISOString(), $lt: moment().endOf('day').toISOString() };

    const orderQuery = { pickup: pickupTime, status: { $nin: ['del', 'bad', 'tmp'] } };
    const transactionQuery = { created: range, type: 'credit', toId: accountId };

    this.transactionSvc.quickFind(transactionQuery).pipe(takeUntil(this.onDestroy$)).subscribe(ts => {
      this.orderSvc.find(orderQuery).pipe(takeUntil(this.onDestroy$)).subscribe((orders: IOrder[]) => {
        this.forms = {};
        orders.map(order => {
          const transaction = ts.find(t => t.orderId === order._id);
          if (transaction) {
            order.received = transaction.amount;
          }

          const account: IAccount = accounts.find(x => x._id === order.clientId);
          if (account) {
            order.balance = account.balance; // new balance
            order.receivable = (account.balance >= 0) ? 0 : Math.abs(account.balance);
          } else {
            order.receivable = order.total;
          }

          const ordersClient: IOrder[] = orders.filter(x => x.clientId === order.clientId);
          order.nOrders = ordersClient.length;

          let sum = 0;
          ordersClient.map(x => sum += x.total);
          if (account && account.balance) {
            order.owe = (account.balance + sum) < 0 ? Math.abs(account.balance + sum) : 0;
          } else {
            order.owe = 0;
          }

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

  // deprecated
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


    const balance: IClientBalance = self.clientBalances.find(cb => cb.accountId === order.clientId);
    this.clientPaymentSvc.pay(toId, toName, received, order._id, '').pipe(takeUntil(this.onDestroy$)).subscribe((r) => {
      self.snackBar.open('', '余额已更新', { duration: 1800 });
      const q1 = { accountId: { $in: self.clientIds } };
      self.accountSvc.quickFind(q1).pipe(takeUntil(this.onDestroy$)).subscribe((cbs: IAccount[]) => {
        self.clientBalances = cbs;
        self.reload(cbs, this.pickupTime);
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

}
