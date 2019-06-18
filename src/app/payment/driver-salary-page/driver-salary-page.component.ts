import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AssignmentService } from '../../assignment/assignment.service';
import { Subject } from '../../../../node_modules/rxjs';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { IAssignment } from '../../assignment/assignment.model';
import * as moment from 'moment';
import { MatTableDataSource, MatPaginator, MatSort } from '../../../../node_modules/@angular/material';
import { ISalaryData } from '../../payment/payment.model';
import { AccountService } from '../../account/account.service';
import { Role } from '../../account/account.model';


@Component({
  selector: 'app-driver-salary-page',
  templateUrl: './driver-salary-page.component.html',
  styleUrls: ['./driver-salary-page.component.scss']
})
export class DriverSalaryPageComponent implements OnInit, OnDestroy {
  onDestroy$ = new Subject();
  drivers;
  selectedDriver;
  assignments;
  displayedColumns: string[] = ['date', 'driverName', 'hours', 'nOrders', 'balance'];
  dataSource: MatTableDataSource<ISalaryData>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private assignmentSvc: AssignmentService,
    private accountSvc: AccountService
  ) {

  }

  ngOnInit() {
    const self = this;
    self.accountSvc.getCurrent().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      if (account && account.roles) {
        const roles = account.roles;
        if (roles && roles.length > 0 && roles.indexOf(Role.DRIVER) !== -1) {
          self.reload(account.id);
        }
      } else {

      }
    });
  }

  reload(driverId) {
    this.assignmentSvc.find({ driverId: driverId }).pipe(takeUntil(this.onDestroy$)).subscribe((assignments) => {
      // assignments.sort((a: IAssignment, b: IAssignment) => {
      //   const aMoment = moment(a.delivered);
      //   const bMoment = moment(b.delivered);
      //   if (aMoment.isAfter(bMoment)) {
      //     return 1;
      //   } else {
      //     return -1;
      //   }
      // });
      this.assignments = this.groupBy(assignments, 'delivered');
      const salaryItems = [];
      const dates = Object.keys(this.assignments);
      let balance = 0;
      dates.map(date => {
        const group = this.assignments[date];
        if (group && group.length > 0) {
          balance += 2 * 30;
          const a = group[0];
          salaryItems.push({
            date: a.delivered, driverId: a.driverId, driverName: a.driverName, nOrders: group.length, hours: 2, balance: balance
          });
        }
      });

      salaryItems.sort((a, b) => {
        const aMoment = moment(a.date);
        const bMoment = moment(b.date);
        if (aMoment.isAfter(bMoment)) {
          return -1;
        } else {
          return 1;
        }
      });
      this.dataSource = new MatTableDataSource(salaryItems);
    });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  groupBy(items, key) {
    return items.reduce((result, item) => ({
      ...result,
      [item[key]]: [
        ...(result[item[key]] || []),
        item,
      ],
    }), {});
  }
}
