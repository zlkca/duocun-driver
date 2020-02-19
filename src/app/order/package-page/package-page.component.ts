import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { IAccount, Role } from '../../account/account.model';
import { AccountService } from '../../account/account.service';
import { SharedService } from '../../shared/shared.service';
import { IMerchant, MerchantType } from '../../restaurant/restaurant.model';
import { Subject } from '../../../../node_modules/rxjs';
import { MerchantService } from '../../restaurant/restaurant.service';
import { ActivatedRoute, Router } from '../../../../node_modules/@angular/router';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import * as moment from 'moment';
import { OrderService } from '../order.service';
import { IOrder, OrderStatus } from '../order.model';

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

  constructor(
    private merchantSvc: MerchantService,
    private sharedSvc: SharedService,
    private accountSvc: AccountService,
    private orderSvc: OrderService,
    private router: Router,
    private route: ActivatedRoute,
  ) {

    // const delivered = moment().set({ hour: 11, minute: 45, second: 0, millisecond: 0 });
    // this.deliverTime = delivered.format('YYYY-MM-DD HH:mm:ss');
    // this.delivered = delivered;

    // const todayStart = moment().startOf('day').toDate();
    // const todayEnd = moment().endOf('day').toDate();
    // this.range = { $lt: todayEnd, $gt: todayStart };
  }

  ngOnInit() {
    const self = this;
    const q = { status: 'active', type: MerchantType.RESTAURANT };
    this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      self.account = account;
      if (account && account.roles) {
        const roles = account.roles;
        if (roles && roles.length > 0 && roles.indexOf(Role.DRIVER) !== -1) {
          self.merchantSvc.quickFind(q).pipe(takeUntil(this.onDestroy$)).subscribe((rs: IMerchant[]) => {
            if (rs && rs.length > 0) {
              self.restaurant = rs[0];
            } else {
              self.restaurant = null;
            }
          });

          const tStart = moment().startOf('day').toISOString();
          const tEnd = moment().endOf('day').toISOString();
          const query = {
            driverId: account._id,
            delivered: { $lt: tEnd, $gt: tStart },
            status: { $nin: [OrderStatus.BAD, OrderStatus.DELETED, OrderStatus.TEMP] }
          };

          this.orderSvc.find(query).pipe(takeUntil(self.onDestroy$)).subscribe((orders: IOrder[]) => {
            const pickups = this.orderSvc.getPickupTimes(orders);
            const phases = [];
            pickups.map(pickup => {
              const os = orders.filter(x => x.delivered === this.sharedSvc.getDateTime(moment(), pickup).toISOString());
              phases.push({pickup: pickup, orders: os});
            });
            self.phases = phases;
          });

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
