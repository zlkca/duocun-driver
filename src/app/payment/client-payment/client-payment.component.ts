
import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { AccountService } from '../../account/account.service';
import { Subject } from '../../../../node_modules/rxjs';
import { takeUntil, take } from '../../../../node_modules/rxjs/operators';
import { Role } from '../../account/account.model';
import { IClientPayment, IClientBalance, IClientPaymentData } from '../../payment/payment.model';
import { MatSnackBar, MatPaginator, MatSort } from '../../../../node_modules/@angular/material';
import * as moment from 'moment';

import { MatTableDataSource } from '@angular/material/table';
import { OrderService } from '../../order/order.service';
import { TransactionService } from '../../transaction/transaction.service';
import { ITransaction } from '../../transaction/transaction.model';
import { IOrder } from '../../order/order.model';

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
  dataSource: MatTableDataSource<IClientPaymentData>;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(
    private accountSvc: AccountService,
    private orderSvc: OrderService,
    private transactionSvc: TransactionService
  ) {

  }

  ngOnInit() {
    const self = this;
    self.accountSvc.getCurrent().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      this.account = account;
      if (account && account.roles) {
        const roles = account.roles;
        if (roles && roles.length > 0 && roles.indexOf(Role.SUPER) !== -1) {
          // method 1 --- too slow
          this.transactionSvc.find({ type: 'credit' }).pipe(takeUntil(this.onDestroy$)).subscribe((ts: ITransaction[]) => {
            const clients = [];
            ts.map(t => {
              const client = clients.find(c => c.clientId === t.fromId);
              if (!client) {
                clients.push({ clientId: t.fromId, clientName: t.fromName });
              }
            });
            this.clients = clients;
          });
        }
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

  reload(clientId: string) {
    const orderQuery = { clientId: clientId, status: { $nin: ['bad', 'del'] } };
    this.orderSvc.find(orderQuery).pipe(takeUntil(this.onDestroy$)).subscribe((os: IOrder[]) => {
      this.transactionSvc.find({ type: 'credit', fromId: clientId }).pipe(takeUntil(this.onDestroy$)).subscribe((ts: ITransaction[]) => {
        let list = [];
        let balance = 0;
        ts.map(t => {
          list.push({
            date: t.created, description: 'To ' + t.toName, type: t.type, paid: t.amount,
            consumed: 0, balance: 0
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



  reload2() {
    // this.clientPaymentSvc.find().pipe(takeUntil(this.onDestroy$)).subscribe((ps: IClientPayment[]) => {
    //   this.payments = ps;
    //   this.clientBalanceSvc.find().pipe(takeUntil(this.onDestroy$)).subscribe(mbs => {
    //     const ms = {};
    //     mbs.map(mb => { ms[mb.clientId] = { clientId: mb.clientId, amount: 0 }; });

    //     this.balances = mbs;

    //     const paymentDataList: IClientPaymentData[] = [];
    //     ps = ps.sort((a: IClientPayment, b: IClientPayment) => {
    //       const aMoment = moment(a.delivered);
    //       const bMoment = moment(b.delivered);
    //       if (aMoment.isAfter(bMoment)) {
    //         return 1; // b at top
    //       } else if (bMoment.isAfter(aMoment)) {
    //         return -1;
    //       } else {
    //         if (a.type === 'debit' && b.type === 'credit') {
    //           return -1;
    //         } else {
    //           return 1;
    //         }
    //       }
    //     });

    //     ps.map(p => {
    //       if (p.type === 'credit') {
    //         ms[p.clientId].amount += p.amount;
    //         paymentDataList.push({
    //           date: p.delivered, paid: p.amount, receivable: 0, balance: ms[p.clientId].amount, type: 'credit',
    //           clientId: p.clientId, clientName: p.clientName, driverName: p.driverName
    //         });
    //       } else {
    //         ms[p.clientId].amount -= p.amount;
    //         paymentDataList.push({
    //           date: p.delivered, paid: 0, receivable: p.amount, balance: ms[p.clientId].amount, type: 'debit',
    //           clientId: p.clientId, clientName: p.clientName, driverName: p.driverName
    //         });
    //       }
    //     });

    //     this.paymentDataList = paymentDataList;
    // this.dataSource = new MatTableDataSource(payments);
    // .sort((a: IClientPayment, b: IClientPayment) => {
    //   if (moment(a.delivered).isAfter(b.delivered)) {
    //     return -1;
    //   } else {
    //     return 1;
    //   }
    // });
    // this.dataSource = new MatTableDataSource(payments);
    // this.dataSource.paginator = this.paginator;
    // this.dataSource.sort = this.sort;
    //   });
    // });
  }

  // loadClientPayments(driverId) {
  //   const q = {
  //     where: {
  //       driverId: driverId,
  //       type: 'debit',
  //       status: { $in: ['sent', 'confirmed'] }
  //     }
  //   };

  //   this.clientPaymentSvc.find(q).pipe(takeUntil(this.onDestroy$)).subscribe(ds => {

  //   });

  // }

  // reload(clientId: string) {
  //   const self = this;
  //   const debitQuery = clientId ? {
  //     where: {
  //       clientId: clientId,
  //       type: 'debit',
  //       status: { $in: ['sent', 'confirmed'] }
  //     }
  //   } : {
  //       where: {
  //         type: 'debit',
  //         status: { $in: ['sent', 'confirmed'] }
  //       }
  //     };

  //   const creditQuery = clientId ? {
  //     where: {
  //       clientId: clientId,
  //       type: 'credit'
  //     }
  //   } : {
  //       where: {
  //         type: 'credit'
  //       }
  //     };

  //   self.clientPaymentSvc.find(debitQuery).pipe(takeUntil(this.onDestroy$)).subscribe(ds => {
  //     self.debits = ds;

  //     self.clientPaymentSvc.find(creditQuery).pipe(takeUntil(this.onDestroy$)).subscribe(cs => {

  //       cs.map(c => {
  //         const debit = ds.find(x => x.clientId === c.clientId && x.delivered === c.delivered);
  //         if (debit) {
  //           if (debit.amount >= c.amount) {
  //             c.status = debit.status;
  //           }
  //         }
  //       });

  //       self.credits = cs.sort((a: IClientPayment, b: IClientPayment) => {
  //         if (moment(a.delivered).isAfter(moment(b.delivered))) {
  //           return -1;
  //         } else {
  //           return 1;
  //         }
  //       });

  //     });

  //   });
  // }

  // togglePaid(e, item: IClientPayment) {
  //   const self = this;
  //   const amount = item.amount;

  //   const debit: IClientPayment = {
  //     status: 'confirmed',
  //     modified: new Date(),
  //   };

  //   const credit: IClientPayment = {
  //     accountId: this.account.id,
  //     accountName: this.account.username,
  //     status: 'confirmed',
  //     modified: new Date(),
  //   };
  //   // update debit status from 'send' to 'confirmed';
  //   // update credit accountId, status from 'new' to 'confirmed' and modified date

  //   this.clientPaymentSvc.update(
  //     { clientId: item.clientId, type: 'debit', delivered: item.delivered }, debit).pipe(takeUntil(this.onDestroy$)).subscribe(x => {

  //       self.clientPaymentSvc.update({ clientId: item.clientId, type: 'credit', delivered: item.delivered }, credit)
  //         .pipe(takeUntil(this.onDestroy$)).subscribe(y => {
  //           // this.snackBar.open('', '已确认付款', { duration: 2300 });
  //           this.reload(this.selectedClient ? this.selectedClient.id : null);
  //         });
  //     });
  // }

  onClientSelectionChanged(e) {
    const clientId = e.value;
    this.reload(clientId);
    // const paymentDataList = this.paymentDataList.filter(p => p.clientId === clientId).sort(
    //   (a: IClientPaymentData, b: IClientPaymentData) => {
    //     const aMoment = moment(a.date);
    //     const bMoment = moment(b.date);
    //     if (aMoment.isAfter(bMoment)) {
    //       return -1;
    //     } else if (bMoment.isAfter(aMoment)) {
    //       return 1;
    //     } else {
    //       if (a.type === 'debit' && b.type === 'credit') {
    //         return 1;
    //       } else {
    //         return -1;
    //       }
    //     }
    //   });
    // this.dataSource = new MatTableDataSource(paymentDataList);
    // this.dataSource.sort = this.sort;
  }

  // updateBalances() {
  //   this.orderSvc.find(null, { distinct: 'clientId' }).pipe(takeUntil(this.onDestroy$)).subscribe(clientIds => {
  //     const bs = [];
  //     clientIds.map(id => {
  //       const payments = this.payments.filter(p => p.clientId === id);
  //       if (payments && payments.length > 0) {
  //         let balance = 0;
  //         payments.map(p => {
  //           if (p.type === 'credit') {
  //             balance += p.amount;
  //           } else {
  //             balance -= p.amount;
  //           }
  //         });
  //         bs.push({
  //           clientId: id,
  //           clientName: payments[0].clientName,
  //           amount: balance,
  //           created: new Date(),
  //           modified: new Date()
  //         });
  //       }
  //     });

  //     this.clientBalanceSvc.insertMany(bs).pipe(takeUntil(this.onDestroy$)).subscribe(() => {

  //     });
  //   });
  // }


}

