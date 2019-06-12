import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MerchantPaymentService } from '../merchant-payment.service';
import { AccountService } from '../../account/account.service';
import { Subject } from '../../../../node_modules/rxjs';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { Role } from '../../account/account.model';
import { IMerchantPayment, IMerchantPaymentData, IMerchantBalance } from '../payment.model';
import { FormBuilder, Validators } from '../../../../node_modules/@angular/forms';
import { MatSnackBar, MatTableDataSource, MatSort } from '../../../../node_modules/@angular/material';
import * as moment from 'moment';
import { TransactionService } from '../../transaction/transaction.service';
import { MerchantBalanceService } from '../merchant-balance.service';
import { ITransaction } from '../../transaction/transaction.model';

@Component({
  selector: 'app-merchant-payment-page',
  templateUrl: './merchant-payment-page.component.html',
  styleUrls: ['./merchant-payment-page.component.scss']
})
export class MerchantPaymentPageComponent implements OnInit, OnDestroy {
  onDestroy$ = new Subject();
  credits: IMerchantPayment[];
  forms = {};
  account;
  debits: IMerchantPayment[];

  selectedMerchant;
  displayedColumns: string[] = ['date', 'driverName', 'receivable', 'paid', 'balance'];

  payments: IMerchantPaymentData[];
  selectedPayments: IMerchantPaymentData[];
  balances: IMerchantBalance[] = [];
  receivables;
  merchants;
  payForm;
  merchant;

  dataSource: MatTableDataSource<IMerchantPaymentData>;
  // @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private accountSvc: AccountService,
    private merchantBalanceSvc: MerchantBalanceService,
    private merchantPaymentSvc: MerchantPaymentService,
    private transactionSvc: TransactionService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    const self = this;
    self.accountSvc.getCurrent().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      this.account = account;
      if (account && account.roles) {
        const roles = account.roles;
        if (roles && roles.length > 0 && roles.indexOf(Role.DRIVER) !== -1) {
          self.loadMerchants();
        }
      } else {

      }
    });
  }

  ngOnInit() {
    this.payForm = this.fb.group({ amount: ['', Validators.required] });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  payMerchant() {
    const amount = parseFloat(this.payForm.get('amount').value);
    const t: ITransaction = {
      fromId: this.account.id,
      fromName: this.account.username,
      toId: this.merchant.merchantId,
      toName: this.merchant.merchantName,
      amount: amount,
      type: 'debit',
      created: new Date(),
      modified: new Date()
    };

    this.transactionSvc.save(t).pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      this.reload(this.merchant.merchantId);
    });
  }


  loadMerchants() {
    this.merchantPaymentSvc.find({ type: 'credit' }).pipe(takeUntil(this.onDestroy$)).subscribe(ps => {
      const ms = [];
      ps.map(p => {
        const merchant = ms.find(m => m.merchantId === p.merchantId);
        if (!merchant) {
          ms.push({ merchantId: p.merchantId, merchantName: p.merchantName });
        }
      });

      this.receivables = ps;
      this.merchants = ms;
    });
  }

  reload(merchantId: string) {
    this.transactionSvc.find({ type: 'debit', toId: merchantId }).pipe(takeUntil(this.onDestroy$)).subscribe(ts => {
      const receivables = this.receivables.filter(r => r.merchantId === merchantId);
      const payments: IMerchantPaymentData[] = [];

      receivables.map(p => {
        payments.push({
          date: p.delivered, receivable: p.amount, paid: 0, balance: 0, type: 'credit',
          merchantId: p.merchantId, merchantName: p.merchantName, driverName: p.driverName
        });
      });

      ts.map(t => {
        payments.push({
          date: t.created, receivable: 0, paid: t.amount, balance: 0, type: 'debit',
          merchantId: t.toId, merchantName: t.toName, driverName: t.fromName
        });
      });

      const ps = payments.sort((a: IMerchantPaymentData, b: IMerchantPaymentData) => {
        const aMoment = moment(a.date);
        const bMoment = moment(b.date);
        if (aMoment.isAfter(bMoment)) {
          return 1; // b at top
        } else if (bMoment.isAfter(aMoment)) {
          return -1;
        } else {
          if (a.type === 'debit' && b.type === 'credit') {
            return 1;
          } else {
            return -1;
          }
        }
      });

      let balance = 0;
      ps.map(p => {
        if (p.type === 'credit') {
          balance += p.receivable;
        } else {
          balance -= p.paid;
        }
        p.balance = balance;
      });

      this.payments = ps.sort((a: IMerchantPaymentData, b: IMerchantPaymentData) => {
        const aMoment = moment(a.date);
        const bMoment = moment(b.date);
        if (aMoment.isAfter(bMoment)) {
          return -1;
        } else if (bMoment.isAfter(aMoment)) {
          return 1;
        } else {
          if (a.type === 'debit' && b.type === 'credit') {
            return -1;
          } else {
            return 1;
          }
        }
      });

      this.dataSource = new MatTableDataSource(payments);
      this.dataSource.sort = this.sort;
    });
  }

  onMerchantSelectionChanged(e) {
    const merchantId = e.value;
    this.merchant = this.merchants.find(m => m.merchantId === merchantId);
    this.reload(merchantId);
  }


  // reload2() {
  //   const self = this;
  //   this.merchantBalanceSvc.find().pipe(takeUntil(this.onDestroy$)).subscribe(mbs => {
  //     const ms = {};
  //     mbs.map(mb => { ms[mb.merchantId] = { merchantId: mb.merchantId, amount: 0 }; });

  //     this.balances = mbs;

  //     this.merchantPaymentSvc.find().pipe(takeUntil(this.onDestroy$)).subscribe(ps => {
  //       const payments: IMerchantPaymentData[] = [];
  //       ps = ps.sort((a: IMerchantPayment, b: IMerchantPayment) => {
  //         const aMoment = moment(a.delivered);
  //         const bMoment = moment(b.delivered);
  //         if (aMoment.isAfter(bMoment)) {
  //           return 1; // b at top
  //         } else if (bMoment.isAfter(aMoment)) {
  //           return -1;
  //         } else {
  //           if (a.type === 'debit' && b.type === 'credit') {
  //             return 1;
  //           } else {
  //             return -1;
  //           }
  //         }
  //       });

  //       ps.map(p => {
  //         if (p.type === 'credit') {
  //           ms[p.merchantId].amount += p.amount;
  //           payments.push({
  //             date: p.delivered, receivable: p.amount, paid: 0, balance: ms[p.merchantId].amount, type: 'credit',
  //             merchantId: p.merchantId, merchantName: p.merchantName, driverName: p.driverName
  //           });
  //         } else {
  //           ms[p.merchantId].amount -= p.amount;
  //           payments.push({
  //             date: p.delivered, receivable: 0, paid: p.amount, balance: ms[p.merchantId].amount, type: 'debit',
  //             merchantId: p.merchantId, merchantName: p.merchantName, driverName: p.driverName
  //           });
  //         }
  //       });

  //       this.payments = payments;
  //     });
  //   });
  // }

  // togglePaid(e, item: IMerchantPayment) {
  //   const self = this;
  //   const amount = parseFloat(this.forms[item.id].get('amount').value);

  //   const tr: ITransaction = {
  //     orderId: '',
  //     fromId: this.account.id,
  //     fromName: this.account.username,
  //     toId: item.merchantId,
  //     toName: item.merchantName,
  //     type: 'debit',
  //     amount: amount,
  //     note: '',
  //     created: item.delivered,
  //     modified: new Date()
  //   };

  //   this.transactionSvc.save(tr).pipe(takeUntil(this.onDestroy$)).subscribe(x => {
  //     this.snackBar.open('', '已保存交易', { duration: 1000 });
  //   });

  //   const payment: IMerchantPayment = {
  //     merchantId: item.merchantId,
  //     merchantName: item.merchantName,
  //     accountId: this.account.id,
  //     accountName: this.account.username,
  //     type: 'debit',
  //     amount: amount,
  //     delivered: item.delivered,
  //     status: 'sent',
  //     note: '',
  //     created: new Date(),
  //     modified: new Date(),
  //     driverId: this.account.id,
  //     driverName: this.account.username,
  //   };

  //   this.merchantPaymentSvc.save(payment).pipe(takeUntil(this.onDestroy$)).subscribe(x => {
  //     this.snackBar.open('', '已支付商家，等待商家确认', { duration: 2300 });
  //     this.reload();
  //   });
  // }
}
