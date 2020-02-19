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
import { environment } from '../../../environments/environment.prod';

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
  merchantAccounts;
  merchantAccount;
  payForm;
  lang = environment.language;

  dataSource: MatTableDataSource<IMerchantPaymentData>;
  // @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private accountSvc: AccountService,
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
            this.merchantAccounts = rs;
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
    const merchantAccount: IAccount = this.merchantAccount;
    const amount = parseFloat(this.payForm.get('amount').value);
    const t: ITransaction = {
      fromId: account._id,
      fromName: account.username,
      toId: merchantAccount._id, // should be an account type
      toName: merchantAccount.username,
      amount: Math.round(amount * 100) / 100,
      type: 'pay merchant',
      action: 'pay merchant',
    };

    this.transactionSvc.save(t).pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      this.snackBar.open('', '已付款 $' + amount + '给商家' + merchantAccount.username, { duration: 1500 });
      this.reload(merchantAccount._id);
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

  groupByDelivered(items) {
    const groups = {};
    items.map(it => {
      let delivered = null;
      if (it.hasOwnProperty('delivered')) {
        delivered = moment(it.delivered);
        const dt = Object.keys(groups).find(x => moment(x).isSame(delivered, 'day'));
        if (dt) {
          groups[dt].push(it);
        } else {
          groups[delivered.toISOString()] = [it];
        }
      } else {
        console.log('No delivered Transaction:' + it._id);
      }
    });
    return groups;
  }

  getDescription(t, merchantAccountId) {
    if (t.items && t.items.length > 0) {
      return '客户撤销订单';
    } else {
      return t.toId === merchantAccountId ? t.fromName : t.toName;
    }
  }

  reload(merchantAccountId: string) {
    this.transactionSvc.getMerchantBalance(merchantAccountId, this.lang).pipe(takeUntil(this.onDestroy$)).subscribe((list: any[]) => {
      let balance = 0;
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
    const merchantAccountId = e.value;
    this.merchantAccount = this.merchantAccounts.find(a => a._id === merchantAccountId);
    this.reload(merchantAccountId);
  }
}
