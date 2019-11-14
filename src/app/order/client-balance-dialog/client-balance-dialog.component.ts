import { Component, OnInit, Inject, OnDestroy, ViewChild } from '@angular/core';
import { NgRedux } from '../../../../node_modules/@angular-redux/store';
import { IAppState } from '../../store';
import { Router } from '../../../../node_modules/@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar, MatTableDataSource, MatSort } from '../../../../node_modules/@angular/material';
import { OrderService } from '../order.service';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { Subject } from '../../../../node_modules/rxjs';
import { CommandActions } from '../../shared/command.actions';
import { TransactionService } from '../../transaction/transaction.service';
import { environment } from '../../../environments/environment';
import { ITransaction } from '../../transaction/transaction.model';
import { IOrder } from '../order.model';
import { FormBuilder, Validators } from '../../../../node_modules/@angular/forms';
import { AccountService } from '../../account/account.service';
import { IAccount } from '../../account/account.model';
import * as moment from 'moment';

export interface BalanceDialogData {
  title: string;
  content: string;
  buttonTextNo: string;
  buttonTextYes: string;
  clientId: string;
  clientName: string;
}

@Component({
  selector: 'app-client-balance-dialog',
  templateUrl: './client-balance-dialog.component.html',
  styleUrls: ['./client-balance-dialog.component.scss']
})
export class ClientBalanceDialogComponent  implements OnInit, OnDestroy {

  displayedColumns: string[] = ['created', 'description', 'consumed', 'paid', 'balance'];
  dataSource: MatTableDataSource<ITransaction>;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  onDestroy$ = new Subject();

  constructor(
    private fb: FormBuilder,
    private rx: NgRedux<IAppState>,
    private router: Router,
    private accountSvc: AccountService,
    private transactionSvc: TransactionService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ClientBalanceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BalanceDialogData
  ) {
    dialogRef.disableClose = true;
  }

  ngOnInit() {
    this.reload(this.data.clientId);
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  getDescription(t, clientId) {
    const d = t.fromId === clientId ? t.toName : t.fromName;
    if (t.note) {
      return d + ' ' + t.note;
    } else {
      return d;
    }
  }

  reload(clientId: string) {
    const q = {'$or': [{ fromId: clientId }, { toId: clientId }]};

    this.transactionSvc.quickFind(q).pipe(takeUntil(this.onDestroy$)).subscribe(ts => {
      const list = [];

      // ['created', 'action', 'fromName', 'toName', 'amount', 'id'];
      ts.map(t => {
        const b = (t.fromId === clientId) ? t.fromBalance : t.toBalance;
        const description = this.getDescription(t, clientId);
        const consumed = t.toId === clientId ? t.amount : 0;
        const paid = t.fromId === clientId ? t.amount : 0;

        list.push({
          _id: t._id, created: t.created, action: t.action, description: description,
          fromName: t.fromName, toName: t.toName, amount: t.amount, consumed: consumed, paid: paid, balance: b
        });
      });

      const rows = list.sort((a: any, b: any) => {
        const aMoment = moment(a.created);
        const bMoment = moment(b.created);
        if (aMoment.isAfter(bMoment)) {
          return -1;
        } else {
          return 1;
        }
      });

      this.dataSource = new MatTableDataSource(rows);
    });
  }


  onCancel(): void {
    this.dialogRef.close();
  }

}
