import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AccountService } from '../../account/account.service';
import { Subject } from '../../../../node_modules/rxjs';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { Role } from '../../account/account.model';
import { IMerchantPayment, IMerchantPaymentData, IMerchantBalance } from '../payment.model';
import { FormBuilder, Validators } from '../../../../node_modules/@angular/forms';
import { MatSnackBar, MatTableDataSource, MatSort } from '../../../../node_modules/@angular/material';
import * as moment from 'moment';
import { TransactionService } from '../../transaction/transaction.service';
import { ITransaction } from '../../transaction/transaction.model';
import { OrderService } from '../../order/order.service';
import { IOrder } from '../../order/order.model';
import { RestaurantService } from '../../restaurant/restaurant.service';

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
  merchants;
  payForm;
  merchant;

  dataSource: MatTableDataSource<IMerchantPaymentData>;
  // @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(
    private accountSvc: AccountService,
    private restaurantSvc: RestaurantService,
    private orderSvc: OrderService,
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
      this.snackBar.open('', '已付款 $' + amount + '给商家' + this.merchant.merchantName, { duration: 1500 });
      this.reload(this.merchant.merchantId);
    });
  }


  loadMerchants() {
    this.restaurantSvc.find({ status: 'active' }).pipe(takeUntil(this.onDestroy$)).subscribe(rs => {
      const ms = [];
      rs.map(r => {
          ms.push({ merchantId: r.id, merchantName: r.name });
      });
      this.merchants = ms;
    });
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

  reload(merchantId: string) {
    const merchant = this.merchants.find(m => m.merchantId === merchantId);
    const debitQuery = { type: 'debit', toId: merchantId };
    this.transactionSvc.find(debitQuery).pipe(takeUntil(this.onDestroy$)).subscribe(ts => {
      const orderQuery = {merchantId: merchantId, status: {$ne: 'del'}};
      this.orderSvc.find(orderQuery).pipe(takeUntil(this.onDestroy$)).subscribe((orders: IOrder[]) => {
        const receivables = this.groupBy(orders, 'delivered');
        const payments: IMerchantPaymentData[] = [];
        Object.keys(receivables).map(date => {
          const os = receivables[date];
          let amount = 0;
          os.map(order => { amount += this.orderSvc.getCost(order); });
          payments.push({
            date: date, receivable: amount, paid: 0, balance: 0, type: 'credit',
            merchantId: merchantId, merchantName: merchant.merchantName, driverName: ''
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
          const aMoment = moment(a.date).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
          const bMoment = moment(b.date).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
          if (aMoment.isAfter(bMoment)) {
            return -1;
          } else if (bMoment.isAfter(aMoment)) {
            return 1;
          } else {
            if (a.type === 'credit') {
              return 1;
            } else {
              return -1;
            }
          }
        });

        this.dataSource = new MatTableDataSource(payments);
        this.dataSource.sort = this.sort;
      });
    });
  }

  onMerchantSelectionChanged(e) {
    const merchantId = e.value;
    this.merchant = this.merchants.find(m => m.merchantId === merchantId);
    this.reload(merchantId);
  }


}
