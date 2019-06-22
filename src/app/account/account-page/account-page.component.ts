import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccountService } from '../account.service';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../../store';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { Subject } from '../../../../node_modules/rxjs';
import { PageActions } from '../../main/main.actions';
import { RestaurantService } from '../../restaurant/restaurant.service';
import { IRestaurant } from '../../restaurant/restaurant.model';
import { MatSnackBar } from '../../../../node_modules/@angular/material';
import { FormBuilder, Validators } from '../../../../node_modules/@angular/forms';
import { TransactionService } from '../../transaction/transaction.service';
import { ITransaction, ITransactionData } from '../../transaction/transaction.model';

@Component({
  selector: 'app-account-page',
  templateUrl: './account-page.component.html',
  styleUrls: ['./account-page.component.scss']
})
export class AccountPageComponent implements OnInit, OnDestroy {
  account: Account;
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
  balance;

  get name() { return this.form.get('name'); }

  constructor(
    private accountSvc: AccountService,
    private rx: NgRedux<IAppState>,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
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

      this.accountSvc.getCurrentUser().pipe(takeUntil(this.onDestroy$)).subscribe((account: Account) => {
        self.account = account;
        self.reload(account.id);
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

  reload(driverId: string) {
    const q = { $or: [{ fromId: driverId }, { toId: driverId }] };
    this.transactionSvc.find(q).pipe(takeUntil(this.onDestroy$)).subscribe((ts: ITransaction[]) => {
      // const transactions = ts.sort((a: ITransaction, b: ITransaction) => {
      //   const aMoment = moment(a.created);
      //   const bMoment = moment(b.created);
      //   if (aMoment.isAfter(bMoment)) {
      //     return 1; // b at top
      //   } else if (bMoment.isAfter(aMoment)) {
      //     return -1;
      //   } else {
      //     if (a.type === 'debit' && b.type === 'credit') {
      //       return -1;
      //     } else {
      //       return 1;
      //     }
      //   }
      // });

      const dataList: ITransactionData[] = [];
      let balance = 0;
      ts.map((t: ITransaction) => {
        if (t.type === 'credit') {
          balance += t.amount;
          // dataList.push({ date: t.created, name: t.fromName, type: t.type, received: t.amount, paid: 0, balance: balance });
        } else {
          balance -= t.amount;
          // dataList.push({ date: t.created, name: t.toName, type: t.type, received: t.amount, paid: 0, balance: balance });
        }
      });
      this.balance = balance;
      // dataList.sort((a: ITransactionData, b: ITransactionData) => {
      //   const aMoment = moment(a.date);
      //   const bMoment = moment(b.date);
      //   if (aMoment.isAfter(bMoment)) {
      //     return -1;
      //   } else if (bMoment.isAfter(aMoment)) {
      //     return 1;
      //   } else {
      //     if (a.type === 'debit' && b.type === 'credit') {
      //       return 1;
      //     } else {
      //       return -1;
      //     }
      //   }
      // });
      // this.dataSource = new MatTableDataSource(dataList);
      // this.dataSource.sort = this.sort;
    });
  }
}
