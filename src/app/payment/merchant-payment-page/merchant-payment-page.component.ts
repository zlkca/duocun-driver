import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AccountService } from '../../account/account.service';
import { Subject } from '../../../../node_modules/rxjs';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { Role, IAccount } from '../../account/account.model';
import { IMerchantPayment, IMerchantPaymentData, IMerchantBalance } from '../payment.model';
import { FormBuilder, Validators } from '../../../../node_modules/@angular/forms';
import { MatSnackBar, MatTableDataSource, MatSort } from '../../../../node_modules/@angular/material';
import * as moment from 'moment';
import { TransactionService } from '../../transaction/transaction.service';
import { ITransaction } from '../../transaction/transaction.model';
import { OrderService } from '../../order/order.service';
import { IOrder } from '../../order/order.model';
import { RestaurantService } from '../../restaurant/restaurant.service';
import { IRestaurant } from '../../restaurant/restaurant.model';

const CASH_ID = '5c9511bb0851a5096e044d10';
const CASH_NAME = 'Cash';

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
  displayedColumns: string[] = ['created', 'description', 'receivable', 'received', 'balance'];

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
    self.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe((account: IAccount) => {
      this.account = account;
      if (account && account.roles) {
        const roles = account.roles;
        if (roles && roles.length > 0 && roles.indexOf(Role.DRIVER) !== -1) {
          this.accountSvc.quickFind({ type: 'merchant' }).pipe(takeUntil(this.onDestroy$)).subscribe(rs => {
            this.merchants = rs;
          });
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
    const account: IAccount = this.account;
    const merchant: IAccount = this.merchant;
    const amount = parseFloat(this.payForm.get('amount').value);
    const t: ITransaction = {
      fromId: account._id,
      fromName: account.username,
      toId: merchant._id, // should be an account type
      toName: merchant.username,
      amount: Math.round(amount * 100) / 100,
      type: 'pay merchant',
      action: 'pay merchant',
    };

    this.transactionSvc.save(t).pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      this.snackBar.open('', '已付款 $' + amount + '给商家' + merchant.username, { duration: 1500 });
      this.reload(merchant._id);
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

  groupBySameDay(items, key) {
    const groups = {};
    items.map(it => {
      let date = null;
      if (it.hasOwnProperty('delivered')) {
        date = moment(it.delivered).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      } else {
        date = moment(it[key]).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      }
      const dt = Object.keys(groups).find(x => moment(x).isSame(date, 'day'));

      if (dt) {
        groups[dt].push(it);
      } else {
        groups[date.toISOString()] = [it];
      }
    });

    return groups;
  }

  reload(merchantId: string) {
    const q = {
      '$or': [{ fromId: merchantId }, { toId: merchantId }],
      status: { $ne: 'del' },
      action: { $ne: 'duocun cancel order from merchant' }
    };
    this.transactionSvc.quickFind(q).pipe(takeUntil(this.onDestroy$)).subscribe(ts => {
      let list = [];
      let balance = 0;
      const credits = ts.filter(t => t.fromId === merchantId);
      const debits = ts.filter(t => t.toId === merchantId);
      const receivables = this.groupBySameDay(credits, 'created');
      Object.keys(receivables).map(dt => {
        const its = receivables[dt];
        let amount = 0;
        its.map(it => { amount += it.amount; });
        list.push({ created: dt, description: '', type: 'credit', receivable: amount, received: 0, balance: 0 });
      });

      debits.map(t => {
        const description = t.toId === merchantId ? t.fromName : t.toName;
        list.push({ created: t.created, description: description, type: 'debit', receivable: 0, received: t.amount, balance: 0 });
      });

      list = list.sort((a: any, b: any) => {
        const aMoment = moment(a.created);
        const bMoment = moment(b.created);
        if (aMoment.isSame(bMoment, 'day')) {
          if (a.type === 'debit') {
            return 1;
          } else {
            if (aMoment.isAfter(bMoment)) {
              return 1; // a to bottom
            } else {
              return -1;
            }
          }
        } else {
          if (aMoment.isAfter(bMoment)) {
            return 1;
          } else {
            return -1;
          }
        }
      });

      list.map(item => {
        if (item.type === 'credit') {
          balance += item.receivable;
        } else {
          balance -= item.received;
        }
        item.balance = balance;
      });

      const rows = list.sort((a: any, b: any) => {
        const aMoment = moment(a.created);
        const bMoment = moment(b.created);
        if (aMoment.isSame(bMoment, 'day')) {
          if (a.type === 'debit') {
            return -1;
          } else {
            if (aMoment.isAfter(bMoment)) {
              return -1; // a to top
            } else {
              return 1;
            }
          }
        } else {
          if (aMoment.isAfter(bMoment)) {
            return -1;
          } else {
            return 1;
          }
        }
      });

      this.dataSource = new MatTableDataSource(rows);
      this.dataSource.sort = this.sort;
    });
  }

  onMerchantSelectionChanged(e) {
    const merchantId = e.value;
    this.merchant = this.merchants.find(m => m._id === merchantId);
    this.reload(merchantId);
  }
}
