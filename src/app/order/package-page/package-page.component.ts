import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { IAccount, Role } from '../../account/account.model';
import { AccountService } from '../../account/account.service';
import { SharedService } from '../../shared/shared.service';
import { IRestaurant } from '../../restaurant/restaurant.model';
import { Subject } from '../../../../node_modules/rxjs';
import { RestaurantService } from '../../restaurant/restaurant.service';
import { ActivatedRoute, Router } from '../../../../node_modules/@angular/router';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { FormBuilder } from '../../../../node_modules/@angular/forms';
import * as moment from 'moment';
import { AssignmentService } from '../../assignment/assignment.service';
import { IAssignment } from '../../assignment/assignment.model';
import { ICommand } from '../../shared/command.reducers';

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
  restaurant: IRestaurant;
  phases: any[] = [];
  // delivered; // moment object
  // deliverTime; // Display purpose

  constructor(
    private restaurantSvc: RestaurantService,
    private sharedSvc: SharedService,
    private accountSvc: AccountService,
    private assignmentSvc: AssignmentService,
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
    this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      self.account = account;
      if (account && account.roles) {
        const roles = account.roles;
        if (roles && roles.length > 0 && roles.indexOf(Role.DRIVER) !== -1) {
          self.restaurantSvc.quickFind().pipe(takeUntil(this.onDestroy$)).subscribe((rs: IRestaurant[]) => {
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
            delivered: { $lt: tEnd, $gt: tStart }
          };

          this.assignmentSvc.quickFind(query).pipe(takeUntil(self.onDestroy$)).subscribe((xs: IAssignment[]) => {
            const pickups = this.assignmentSvc.getPickupTimes(xs);
            const phases = [];
            pickups.map(pickup => {
              const assignments = xs.filter(x => x.delivered === this.sharedSvc.getDateTime(moment(), pickup).toISOString());
              phases.push({pickup: pickup, assignments: assignments});
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
