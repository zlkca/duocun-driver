import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccountService } from '../account.service';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../../store';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { Subject } from '../../../../node_modules/rxjs';
import { PageActions } from '../../main/main.actions';
import { MatSnackBar } from '../../../../node_modules/@angular/material';
import { FormBuilder, Validators } from '../../../../node_modules/@angular/forms';
import { TransactionService } from '../../transaction/transaction.service';
import * as moment from 'moment';
import { IAccount } from '../account.model';
import { OrderService } from '../../order/order.service';

@Component({
  selector: 'app-account-page',
  templateUrl: './account-page.component.html',
  styleUrls: ['./account-page.component.scss']
})
export class AccountPageComponent implements OnInit, OnDestroy {
  account: IAccount;
  phone;
  address;
  onDestroy$ = new Subject<any>();
  phoneVerified;
  form;
  errMsg;
  sub;
  bMerchant = false;
  bApplied = false;
  merchantId: string;
  salary;

  get name() { return this.form.get('name'); }

  constructor(
    private accountSvc: AccountService,
    private rx: NgRedux<IAppState>,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private orderSvc: OrderService,
    private transactionSvc: TransactionService,
    private snackBar: MatSnackBar
  ) {
    const self = this;
    this.rx.dispatch({
      type: PageActions.UPDATE_URL,
      payload: 'account-setting'
    });

    this.form = this.fb.group({
      name: ['', Validators.required]
    });
  }

  ngOnInit() {
    const self = this;
    this.sub = this.route.queryParams.subscribe(params => {
      // this.bMerchant = params['merchant'].toLowerCase() === 'true' ? true : false;

      this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe((account: IAccount) => {
        self.account = account;
        // self.loadSalary(account._id);
      });
    });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  // applyMerchant() {
  //   if (this.form.valid) {
  //     const v = this.form.value;
  //     this.accountSvc.applyMerchant(this.account.id, v.name).pipe(
  //       takeUntil(this.onDestroy$)
  //     ).subscribe(x => {
  //       this.snackBar.open('', '已申请成为商户，请等待批准。', { duration: 1000 });
  //       this.bApplied = true;
  //     });
  //   } else {
  //     // alert('请选择要申请的餐馆');
  //     this.errMsg = '请输入要申请的餐馆名称';
  //   }
  // }

  // onChangeRestaurantName(e) {
  //   this.errMsg = '';
  // }

  toPaymentPage() {
    this.router.navigate(['payment/driver']);
  }

  toSalaryPage() {
    this.router.navigate(['payment/salary']);
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

  loadSalary(driverId: string) {
    this.orderSvc.find({ driverId: driverId }).pipe(takeUntil(this.onDestroy$)).subscribe((orders) => {
      const groups = this.groupBy(orders, 'delivered');
      const salaryItems = [];
      const dates = Object.keys(groups);
      let balance = 0;
      dates.map(date => {
        const group = groups[date];
        if (group && group.length > 0) {
          balance += 2 * 30;
          const a = group[0];
          salaryItems.push({
            date: a.delivered, driverId: a.driverId, driverName: a.driverName, nOrders: group.length, hours: 2, balance: balance
          });
        }
      });

      salaryItems.sort((a, b) => {
        const aMoment = moment(a.date);
        const bMoment = moment(b.date);
        if (aMoment.isAfter(bMoment)) {
          return -1;
        } else {
          return 1;
        }
      });
      this.salary = balance;
    });
  }

}
