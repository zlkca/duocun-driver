import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { AccountService } from '../../account/account.service';
import { Subject } from '../../../../node_modules/rxjs';
import { takeUntil, take } from '../../../../node_modules/rxjs/operators';
import { Role, IAccount } from '../../account/account.model';
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
  onDestroy$ = new Subject();
  account;
  alexcredits;
  displayedColumns: string[] = ['date', 'description', 'received', 'paid', 'balance'];
  list = [];
  currentPageNumber = 1;
  itemsPerPage = 15;
  transactions = [];
  nTransactions = 0;
  loading = true;
  highlightedId = 0;

  constructor(
    private accountSvc: AccountService,
    private transactionSvc: TransactionService
  ) {

  }

  ngOnInit() {
    const self = this;
    this.accountSvc.getCurrent().pipe(takeUntil(this.onDestroy$)).subscribe((account: IAccount) => {
      this.account = account;
      if (account) {
        this.OnPageChange(this.currentPageNumber);
      } else {

      }
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

  getDescription(t, clientId) {
    if (t.action === 'client cancel order from duocun') {
      return '取消' + t.toName;
    } else if (t.action === 'pay by card') {
      return '银行卡付款';
    } else if (t.action === 'pay by wechat') {
      return '微信付款';
    } else if (t.action === 'client add credit by cash') {
      return '现金充值';
    } else if (t.action === 'client add credit by card') {
      return '信用卡充值';
    } else if (t.action === 'client add credit by WECHATPAY') {
      return '微信充值';
    } else {
      return t.fromId === clientId ? t.toName : t.fromName;
    }
  }

  OnPageChange(pageNumber) {
    const accountId = this.account._id;
    const itemsPerPage = this.itemsPerPage;
    const driverId = this.account._id;

    this.loading = true;
    this.currentPageNumber = pageNumber;
    const query = { $or: [{ fromId: driverId }, { toId: driverId }], amount: { $ne: 0 } };
    this.transactionSvc.loadPage(query, pageNumber, itemsPerPage).pipe(takeUntil(this.onDestroy$)).subscribe((ret: any) => {
      this.nTransactions = ret.total;
      const list = [];
      ret.transactions.map(t => {
        const b = t.fromId === driverId ? t.fromBalance : t.toBalance;
        const description = this.getDescription(t, driverId);
        const received = t.toId === driverId ? t.amount : 0;
        const paid = t.fromId === driverId ? t.amount : 0;
        list.push({ date: t.created, description: description, received: received, paid: paid, balance: -b });
      });

      this.transactions = list;
      // this.dataSource = new MatTableDataSource(list);
      this.loading = false;
    });
  }
}



// export class DriverPaymentPageComponent implements OnInit, OnDestroy {
//   dataSource: MatTableDataSource<ITransactionData>;
//   onDestroy$ = new Subject();
//   account;
//   displayedColumns: string[] = ['date', 'name', 'received', 'paid', 'balance'];

//   @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
//   @ViewChild(MatSort, { static: true }) sort: MatSort;

//   constructor(
//     private accountSvc: AccountService,
//     private transactionSvc: TransactionService,
//   ) {

//   }

//   ngOnInit() {
//     const self = this;
//     self.accountSvc.getCurrentUser().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
//       this.account = account;
//       if (account && account.roles) {
//         const roles = account.roles;
//         if (roles && roles.length > 0 && roles.indexOf(Role.DRIVER) !== -1) {
//           self.reload(account.id);
//         }
//       } else {

//       }
//     });
//   }

//   ngOnDestroy() {
//     this.onDestroy$.next();
//     this.onDestroy$.complete();
//   }

//   reload(driverId: string) {
//     const query = { $or: [{ fromId: driverId }, { toId: driverId }] };
//     this.transactionSvc.quickFind(query).pipe(takeUntil(this.onDestroy$)).subscribe((ts: ITransaction[]) => {
//       const transactions = ts.sort((a: ITransaction, b: ITransaction) => {
//         const aMoment = moment(a.created);
//         const bMoment = moment(b.created);
//         if (aMoment.isAfter(bMoment)) {
//           return 1; // b at top
//         } else if (bMoment.isAfter(aMoment)) {
//           return -1;
//         } else {
//           if (a.type === 'debit' && b.type === 'credit') {
//             return -1;
//           } else {
//             return 1;
//           }
//         }
//       });

//       const dataList: ITransactionData[] = [];
//       let balance = 0;
//       transactions.map((t: ITransaction) => {
//         if (t.type === 'credit' || (t.type === 'transfer' && t.toId === driverId)) {
//           balance += t.amount;
//           dataList.push({ date: t.created, name: t.fromName, type: t.type, received: t.amount, paid: 0, balance: balance });
//         } else if (t.type === 'debit' || (t.type === 'transfer' && t.fromId === driverId)) {
//           balance -= t.amount;
//           dataList.push({ date: t.created, name: t.toName, type: t.type, received: 0, paid: t.amount, balance: balance });
//         }
//       });

//       dataList.sort((a: ITransactionData, b: ITransactionData) => {
//         const aMoment = moment(a.date);
//         const bMoment = moment(b.date);
//         if (aMoment.isAfter(bMoment)) {
//           return -1;
//         } else if (bMoment.isAfter(aMoment)) {
//           return 1;
//         } else {
//           if (a.type === 'debit' && b.type === 'credit') {
//             return 1;
//           } else {
//             return -1;
//           }
//         }
//       });
//       this.dataSource = new MatTableDataSource(dataList);
//       this.dataSource.sort = this.sort;
//     });
//   }

// }

