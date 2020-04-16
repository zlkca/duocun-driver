import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { IAccount, Role } from '../../account/account.model';
import { AccountService } from '../../account/account.service';
import { SharedService } from '../../shared/shared.service';
import { IMerchant, MerchantType, MerchantStatus } from '../../restaurant/restaurant.model';
import { Subject } from '../../../../node_modules/rxjs';
import { MerchantService } from '../../restaurant/restaurant.service';
import { ActivatedRoute, Router } from '../../../../node_modules/@angular/router';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import * as moment from 'moment';
import { OrderService } from '../order.service';
import { IOrder, OrderStatus } from '../order.model';
import { FormBuilder } from '../../../../node_modules/@angular/forms';
import { MatDatepickerInputEvent } from '../../../../node_modules/@angular/material';

@Component({
  selector: 'app-package-page',
  templateUrl: './package-page.component.html',
  styleUrls: ['./package-page.component.scss']
})
export class PackagePageComponent implements OnInit, OnDestroy {

  account: IAccount;
  // range;
  now;
  lunchEnd;

  onDestroy$ = new Subject();
  restaurant: IMerchant;
  phases: any[] = [];
  // delivered; // moment object
  // deliverTime; // Display purpose
  dateForm;
  deliverDate;

  constructor(
    private merchantSvc: MerchantService,
    private sharedSvc: SharedService,
    private accountSvc: AccountService,
    private orderSvc: OrderService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {

    // const delivered = moment().set({ hour: 11, minute: 45, second: 0, millisecond: 0 });
    // this.deliverTime = delivered.format('YYYY-MM-DD HH:mm:ss');
    // this.delivered = delivered;

    // const todayStart = moment().startOf('day').toDate();
    // const todayEnd = moment().endOf('day').toDate();
    // this.range = { $lt: todayEnd, $gt: todayStart };

    this.dateForm = this.fb.group({ date: [''] });
  }

  get date() { return this.dateForm.get('date'); }

  onDateChange(type: string, event: MatDatepickerInputEvent<Date>) {
    this.deliverDate = moment(event.value).format('YYYY-MM-DD');
    const date = moment(event.value).set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
    this.date.setValue(date);

    this.reload(this.deliverDate);
  }

  reload(deliverDate) {
    const self = this;
    const query = {
      driverId: this.account._id,
      deliverDate,
      status: { $nin: [OrderStatus.BAD, OrderStatus.DELETED, OrderStatus.TEMP] }
    };

    this.orderSvc.find(query).pipe(takeUntil(self.onDestroy$)).subscribe((orders: IOrder[]) => {
      const pickups = ['10:00']; // , '11:20']; // this.orderSvc.getPickupTimes(orders);
      const phases = [];
      pickups.map(pickup => {
        const os = orders.filter(x => x.pickupTime === pickup);
        // const os = orders.filter(x => x.delivered === this.sharedSvc.getDateTime(moment(), pickup).toISOString());
        phases.push({pickup: pickup, orders: os});
      });
      self.phases = phases;
    });
  }

  ngOnInit() {
    const self = this;
    // const q = { status: MerchantStatus.ACTIVE, type: MerchantType.RESTAURANT };
    this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      self.account = account;
      if (account && account.roles) {
        const roles = account.roles;
        if (roles && roles.length > 0 && roles.indexOf(Role.DRIVER) !== -1) {
          // self.merchantSvc.quickFind(q).pipe(takeUntil(this.onDestroy$)).subscribe((rs: IMerchant[]) => {
          //   if (rs && rs.length > 0) {
          //     self.restaurant = rs[0];
          //   } else {
          //     self.restaurant = null;
          //   }
          // });
          const date = moment().set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
          this.date.setValue(date);
          this.deliverDate = moment().format('YYYY-MM-DD');
          this.reload(this.deliverDate);

        } else { // not authorized for opreration merchant
          this.router.navigate(['account/setting'], { queryParams: { merchant: false } });
        }
      }
    });

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

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  onSelect(c) {
    // this.select.emit({ order: c });
  }

  toDateTimeString(s) {
    return s ? this.sharedSvc.toDateTimeString(s) : '';
  }
}
