import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { NgRedux } from '../../../../node_modules/@angular-redux/store';
import { IAppState } from '../../store';
import { Router } from '../../../../node_modules/@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar, MatDialog } from '../../../../node_modules/@angular/material';
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
import { ClientBalanceDialogComponent } from '../client-balance-dialog/client-balance-dialog.component';
import { AssignmentService } from '../../assignment/assignment.service';


export interface DialogData {
  title: string;
  content: string;
  buttonTextNo: string;
  buttonTextYes: string;
  accountId: string; // driver id
  accountName: string; // driver name
  orderId: string;
  total: number;
  paymentMethod: string;
  chargeId: string;
  transactionId: string;
}

@Component({
  selector: 'app-receive-cash-dialog',
  templateUrl: './receive-cash-dialog.component.html',
  styleUrls: ['./receive-cash-dialog.component.scss']
})
export class ReceiveCashDialogComponent implements OnInit, OnDestroy {

  order;
  form;

  nOrders;
  owe;
  paid;

  receivable: number;
  onDestroy$ = new Subject();

  constructor(
    private fb: FormBuilder,
    private rx: NgRedux<IAppState>,
    private accountSvc: AccountService,
    private orderSvc: OrderService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ReceiveCashDialogComponent>,
    public dialogSvc: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    dialogRef.disableClose = true;
    this.form = this.fb.group({
      received: ['', Validators.required],
      note: ['', Validators.required]
    });
  }

  get received() { return this.form.get('received'); }
  get note() { return this.form.get('note'); }

  ngOnInit() {
    const self = this;
    const orderId = this.data.orderId;

    if (this.data) {
      this.orderSvc.quickFind({ _id: orderId }).pipe(takeUntil(self.onDestroy$)).subscribe((orders: IOrder[]) => {
        this.order = orders[0];
        this.accountSvc.quickFind({ _id: this.order.clientId }).pipe(takeUntil(self.onDestroy$)).subscribe((accounts: IAccount[]) => {
          const balance = accounts[0].balance;
          this.receivable = balance < 0 ? -balance : 0;
        });
      });
    }
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onPay() {
    const received = this.received.value;
    const note = this.note.value.trim();
    if (received === '') {
      return;
    } else {
      if (isNaN(received)) {
        alert('此处需要输入数字');
      } else {
        if (this.receivable > 0 && (+received + 1) <= this.receivable && note === '') {
          alert('请输入少收款的原因');
        } else {
          const orderId = this.data.orderId;
          const toId = this.data.accountId;
          const toName = this.data.accountName;
          this.orderSvc.payOrder(toId, toName, +received, orderId, note).pipe(takeUntil(this.onDestroy$)).subscribe((r) => {
            // this.assignmentSvc.update({orderId: orderId}, {status: 'done'}).pipe(takeUntil(this.onDestroy$)).subscribe(() => {
              this.dialogRef.close(r);
              this.rx.dispatch({ type: CommandActions.SEND, payload: { name: 'reload-orders', args: null } }); // refresh order history
            // });
          });
        }
      }
    }

  }

  openBalanceDialog(order: IOrder) {
    const params = {
      width: '100%',
      maxWidth: 'none',
      data: {
        title: '收款', content: '', buttonTextNo: '取消', buttonTextYes: '确认收款',
        clientId: order.clientId, clientName: order.clientName
      },
      panelClass: 'balance-dialog'
    };
    const dialogRef = this.dialogSvc.open(ClientBalanceDialogComponent, params);

    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy$)).subscribe(result => {

    });
  }
}
