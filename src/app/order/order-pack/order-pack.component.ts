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
  assignments;
  forms = {};
  clientBalances = [];
  ordersByMerchants = [];

  constructor(
    private orderSvc: OrderService,
    private sharedSvc: SharedService,
    private accountSvc: AccountService,
    private locationSvc: LocationService,
    private assignmentSvc: AssignmentService,
    private clientPaymentSvc: ClientPaymentService,
    private clientBalanceSvc: ClientBalanceService,
    private transactionSvc: TransactionService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    const self = this;
    // self.accountSvc.getCurrent().pipe(
    //   takeUntil(this.onDestroy$)
    // ).subscribe(account => {
    //   self.account = account;
    //   self.assignmentSvc.find({where: {driverId: account.id}}).pipe(takeUntil(self.onDestroy$)).subscribe(xs => {
    //     self.assignments = xs;
    //     self.reload();
    //   });
    // });

    self.clientBalanceSvc.find().pipe(
      takeUntil(this.onDestroy$)
    ).subscribe((cbs: IClientBalance[]) => {
      this.clientBalances = cbs;
    });
  }

  ngOnInit() {
    const self = this;
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

  reload(assignments: IAssignment[]) {
    const self = this;
    const os = [];

    self.clientPaymentSvc.find({ where: { delivered: self.dateRange, type: 'credit' } }).pipe(
      takeUntil(this.onDestroy$)
    ).subscribe((cps: IClientPayment[]) => {
      self.orderSvc.find({ where: { delivered: self.dateRange } }).pipe(
        takeUntil(this.onDestroy$)
      ).subscribe((orders: IOrder[]) => {
        this.forms = {};

        // client balance should be got from db
        orders.map(order => {
          const cp: IClientPayment = cps.find(x => x.orderId === order.id);
          order.received = cp ? cp.amount : 0;

          const balance: IClientBalance = self.clientBalances.find(x => x.clientId === order.clientId);
          if (balance) {
            order.balance = balance.amount + order.total;
            order.receivable = (balance.amount > 0) ? 0 : (-balance.amount);
          }


          const assignment = self.assignments.find(x => x.orderId === order.id);
          if (assignment) {
            order.code = assignment.code;
            order.paid = (order.status === 'paid');
            this.forms[order.id] = this.fb.group({
              received: [0]
            });
            os.push(order);
          }
        });

        self.orders = os;
        self.ordersByMerchants = this.groupByMerchants(os);
        // self.orders = orders.filter(order => self.assignments.find(x => x.orderId === order.id) );
      });
    });


  }

  onSelect(c) {
    // this.select.emit({ order: c });
  }

  toDateTimeString(s) {
    return s ? this.sharedSvc.toDateTimeString(s) : '';
  }

  ngOnChanges(v) {
    // this.reload();
    const self = this;
    self.accountSvc.getCurrent().pipe(
      takeUntil(this.onDestroy$)
    ).subscribe(account => {
      self.account = account;
      self.assignmentSvc.find({ where: { driverId: account.id } }).pipe(takeUntil(self.onDestroy$)).subscribe(xs => {
        self.assignments = xs;
        self.reload(xs);
      });
    });
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

  togglePaid(e, order: IOrder) {
    const self = this;
    const data = {
      status: e.checked ? 'paid' : 'unpaid',
      driverId: this.account.id,
      driverName: this.account.username
    };
    this.orderSvc.update({ id: order.id }, data).pipe(takeUntil(this.onDestroy$)).subscribe(x => {
      if (x && x.ok) {
        this.snackBar.open('', '已完成客户' + order.clientName + '的订单', { duration: 1500 });
        setTimeout(() => {
          this.reload(self.assignments);
        }, 2000);
      }
    });

    this.savePayment(order);
  }


  savePayment(order: IOrder) {
    const received = parseFloat(this.forms[order.id].get('received').value);

    const clientPayment: IClientPayment = {
      orderId: order.id,
      clientId: order.clientId,
      clientName: order.clientName,
      driverId: this.account.id,
      driverName: this.account.username,
      amount: received,
      type: 'credit',
      delivered: order.delivered,
      created: new Date(),
      modified: new Date(),
    };

    this.clientPaymentSvc.save(clientPayment).pipe(takeUntil(this.onDestroy$)).subscribe(x => {
      this.snackBar.open('', '已保存客户的余额', { duration: 2300 });
    });

    const tr: ITransaction = {
      orderId: order.id,
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
    });
  }

}
