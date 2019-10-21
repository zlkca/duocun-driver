import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { AccountService } from '../../account/account.service';
import { Subject } from '../../../../node_modules/rxjs';
import { takeUntil, take } from '../../../../node_modules/rxjs/operators';
import { Role } from '../../account/account.model';
// import { IDriverPayment, IDriverPaymentData, IDriverBalance } from '../../payment/payment.model';
import { MatSnackBar, MatPaginator, MatSort } from '../../../../node_modules/@angular/material';
import * as moment from 'moment';

import { MatTableDataSource } from '@angular/material/table';
import { TransactionService } from '../../transaction/transaction.service';
import { ITransaction, ITransactionData } from '../../transaction/transaction.model';
import { IDriverPayment, IDriverPaymentData } from '../payment.model';

@Component({
  selector: 'app-driver-payment-page',
  templateUrl: './driver-payment-page.component.html',
  styleUrls: ['./driver-payment-page.component.scss']
})
export class DriverPaymentPageComponent implements OnInit, OnDestroy {
  dataSource: MatTableDataSource<ITransactionData>;
  onDestroy$ = new Subject();
  account;
  displayedColumns: string[] = ['date', 'name', 'received', 'paid', 'balance'];

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private accountSvc: AccountService,
    private transactionSvc: TransactionService,
  ) {

  }

  ngOnInit() {
    const self = this;
    self.accountSvc.getCurrentUser().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      this.account = account;
      if (account && account.roles) {
        const roles = account.roles;
        if (roles && roles.length > 0 && roles.indexOf(Role.DRIVER) !== -1) {
          self.reload(account.id);
        }
      } else {

      }
    });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  reload(driverId: string) {
    const query = { $or: [{ fromId: driverId }, { toId: driverId }] };
    this.transactionSvc.quickFind(query).pipe(takeUntil(this.onDestroy$)).subscribe((ts: ITransaction[]) => {
      const transactions = ts.sort((a: ITransaction, b: ITransaction) => {
        const aMoment = moment(a.created);
        const bMoment = moment(b.created);
        if (aMoment.isAfter(bMoment)) {
          return 1; // b at top
        } else if (bMoment.isAfter(aMoment)) {
          return -1;
        } else {
          if (a.type === 'debit' && b.type === 'credit') {
            return -1;
          } else {
            return 1;
          }
        }
      });

      const dataList: ITransactionData[] = [];
      let balance = 0;
      transactions.map((t: ITransaction) => {
        if (t.type === 'credit' || (t.type === 'transfer' && t.toId === driverId)) {
          balance += t.amount;
          dataList.push({ date: t.created, name: t.fromName, type: t.type, received: t.amount, paid: 0, balance: balance });
        } else if (t.type === 'debit' || (t.type === 'transfer' && t.fromId === driverId)) {
          balance -= t.amount;
          dataList.push({ date: t.created, name: t.toName, type: t.type, received: 0, paid: t.amount, balance: balance });
        }
      });

      dataList.sort((a: ITransactionData, b: ITransactionData) => {
        const aMoment = moment(a.date);
        const bMoment = moment(b.date);
        if (aMoment.isAfter(bMoment)) {
          return -1;
        } else if (bMoment.isAfter(aMoment)) {
          return 1;
        } else {
          if (a.type === 'debit' && b.type === 'credit') {
            return 1;
          } else {
            return -1;
          }
        }
      });
      this.dataSource = new MatTableDataSource(dataList);
      this.dataSource.sort = this.sort;
    });
  }

}

