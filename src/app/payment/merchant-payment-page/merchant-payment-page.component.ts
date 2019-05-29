import { Component, OnInit, OnDestroy } from '@angular/core';
import { MerchantPaymentService } from '../merchant-payment.service';
import { AccountService } from '../../account/account.service';
import { Subject } from '../../../../node_modules/rxjs';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { Role } from '../../account/account.model';
import { IMerchantPayment } from '../payment.model';
import { FormBuilder } from '../../../../node_modules/@angular/forms';
import { MatSnackBar } from '../../../../node_modules/@angular/material';
import * as moment from 'moment';

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

  constructor(
    private accountSvc: AccountService,
    private merchantPaymentSvc: MerchantPaymentService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    const self = this;
    self.accountSvc.getCurrent().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      this.account = account;
      if (account && account.roles) {
        const roles = account.roles;
        if (roles && roles.length > 0 && roles.indexOf(Role.DRIVER) !== -1) {
          self.reload();
        }
      } else {

      }
    });
  }

  ngOnInit() {

  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  reload() {
    const self = this;

    self.merchantPaymentSvc.find({
      where: {
        type: 'debit',
        status: { $in: ['sent', 'confirmed'] }
      }
    }).pipe(takeUntil(this.onDestroy$)).subscribe(ds => {
      self.debits = ds;

      self.merchantPaymentSvc.find({ where: { type: 'credit', status: 'new' } }).pipe(takeUntil(this.onDestroy$)).subscribe(cs => {

        cs.map(c => {
          const debit = ds.find(x => x.merchantId === c.merchantId && x.delivered === c.delivered);
          if (debit) {
            if (debit.amount >= c.amount) {
              c.status = debit.status;
            }
          }
          this.forms[c.id] = this.fb.group({
            amount: [0]
          });
        });

        self.credits = cs.sort((a: IMerchantPayment, b: IMerchantPayment) => {
          if (moment(a.delivered).isAfter(moment(b.delivered))) {
            return -1;
          } else {
            return 1;
          }
        });
      });

    });
  }

  togglePaid(e, item: IMerchantPayment) {
    const self = this;
    const amount = parseFloat(this.forms[item.id].get('amount').value);

    const payment: IMerchantPayment = {
      merchantId: item.merchantId,
      merchantName: item.merchantName,
      accountId: this.account.id,
      accountName: this.account.username,
      type: 'debit',
      amount: amount,
      delivered: item.delivered,
      status: 'sent',
      note: '',
      created: new Date(),
      modified: new Date(),
    };

    this.merchantPaymentSvc.save(payment).pipe(takeUntil(this.onDestroy$)).subscribe(x => {
      this.snackBar.open('', '已支付商家，等待商家确认', { duration: 2300 });
      this.reload();
    });
  }
}
