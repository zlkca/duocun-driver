
import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { AccountService } from '../../account/account.service';
import { Subject, Observable } from '../../../../node_modules/rxjs';
import { takeUntil, take, map, startWith } from '../../../../node_modules/rxjs/operators';
import { Role } from '../../account/account.model';
import { IClientPayment, IClientBalance, IClientPaymentData } from '../../payment/payment.model';
import { MatSnackBar, MatPaginator, MatSort } from '../../../../node_modules/@angular/material';
import * as moment from 'moment';

import { MatTableDataSource } from '@angular/material/table';
import { OrderService } from '../../order/order.service';
import { TransactionService } from '../../transaction/transaction.service';
import { ITransaction } from '../../transaction/transaction.model';
import { IOrder } from '../../order/order.model';
import { ClientBalanceService } from '../client-balance.service';
import { FormControl } from '../../../../node_modules/@angular/forms';

@Component({
  selector: 'app-client-payment',
  templateUrl: './client-payment.component.html',
  styleUrls: ['./client-payment.component.scss']
})
export class ClientPaymentComponent implements OnInit, OnDestroy {
  onDestroy$ = new Subject();
  credits: IClientPayment[];
  account;
  debits: IClientPayment[];
  alexcredits;
  displayedColumns: string[] = ['date', 'description', 'consumed', 'paid', 'balance'];
  selectedClient;
  payments: IClientPayment[];
  paymentDataList: IClientPaymentData[];
  selectedPayments: IClientPaymentData[];
  balances: IClientBalance[] = [];
  clients = [];
  list = [];
  clientCtrl;
  dataSource: MatTableDataSource<IClientPaymentData>;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  filteredOptions: Observable<IClientBalance[]>;

  constructor(
    private accountSvc: AccountService,
    private orderSvc: OrderService,
    private clientBalanceSvc: ClientBalanceService,
    private transactionSvc: TransactionService
  ) {
    this.clientCtrl = new FormControl();
    // this.clientCtrl.valueChanges.subscribe(newValue => {
    //   this.filteredValues = this.filterValues(newValue);
    // });
  }

  ngOnInit() {
    const self = this;
    self.accountSvc.getCurrentUser().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      this.account = account;
      if (account && account.roles) {
        const roles = account.roles;
        // if (roles && roles.length > 0 && roles.indexOf(Role.SUPER) !== -1) {
          this.clientBalanceSvc.find().pipe(takeUntil(this.onDestroy$)).subscribe((cs: IClientBalance[]) => {
            this.clients = cs;
            this.filteredOptions = this.clientCtrl.valueChanges
              .pipe(
                startWith(''),
                map((accountName: string) => accountName ? this._filter(accountName) : this.clients.slice())
              );
          });
        // }
      } else {

      }
    });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  private _filter(v: any): IClientBalance[] {
    if (v) {
      const filterValue = typeof v === 'string' ? v.toLowerCase() : v.accountName.toLowerCase();

      return this.clients.filter(option => option.accountName && option.accountName.toLowerCase().indexOf(filterValue) !== -1);
    } else {
      return [];
    }
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

  reload(clientId: string) {
    const orderQuery = { clientId: clientId, status: { $nin: ['del', 'bad', 'tmp'] } };
    this.orderSvc.find(orderQuery).pipe(takeUntil(this.onDestroy$)).subscribe((os: IOrder[]) => {
      this.transactionSvc.find({ type: 'credit', fromId: clientId }).pipe(takeUntil(this.onDestroy$)).subscribe((ts: ITransaction[]) => {
        let list = [];
        let balance = 0;
        // ts.map(t => {
        //   list.push({
        //     date: t.created, description: 'To ' + t.toName, type: t.type, paid: t.amount,
        //     consumed: 0, balance: 0
        //   });
        // });
        const payments = ts.filter(t => t.type === 'credit' && t.fromId === clientId);
        const tOuts = ts.filter(t => t.type === 'transfer' && t.fromId === clientId);
        const tIns = ts.filter(t => t.type === 'transfer' && t.toId === clientId);

        payments.map(t => {
          list.push({
            date: t.created, description: 'Paid ' + t.toName, type: t.type, paid: t.amount, consumed: 0, balance: 0
          });
        });

        tIns.map(t => {
          list.push({
            date: t.created, description: 'Transfer from ' + t.fromName, type: 'credit', paid: t.amount, consumed: 0, balance: 0
          });
        });

        tOuts.map(t => {
          list.push({
            date: t.created, description: 'Transfer to ' + t.toName, type: 'debit', paid: 0, consumed: t.amount, balance: 0
          });
        });

        os.map(order => {
          const t = {
            fromId: order.clientId,
            fromName: order.clientName,
            toId: order.driverId,
            toName: order.driverName,
            type: 'debit',
            amount: order.total,
            note: '',
            created: order.delivered,
            modified: order.modified
          };
          list.push({
            date: t.created, description: 'From ' + order.merchantName, type: t.type, paid: 0,
            consumed: t.amount, balance: 0
          });
        });

        list = list.sort((a: IClientPaymentData, b: IClientPaymentData) => {
          const aMoment = moment(a.date);
          const bMoment = moment(b.date);
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

        list.map(item => {
          if (item.type === 'debit') {
            balance -= item.consumed;
          } else if (item.type === 'credit') {
            balance += item.paid;
          }
          item.balance = balance;
        });

        list.sort((a: IClientPaymentData, b: IClientPaymentData) => {
          const aMoment = moment(a.date);
          const bMoment = moment(b.date);
          if (aMoment.isAfter(bMoment)) {
            return -1; // b at top
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
        this.dataSource = new MatTableDataSource(list);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
    });
  }

  displayFn = (c?: IClientBalance) => {
    if (c) {
      this.reload(c.accountId);
    }
    return c ? c.accountName : undefined;
  }


  onClientSelectionChanged(e) {
    const clientId = e.value;
    this.reload(clientId);
  }

}

