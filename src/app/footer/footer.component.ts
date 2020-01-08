import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NgRedux } from '@angular-redux/store';
import { Account, Role } from '../account/account.model';
import { IAppState } from '../store';
import { CommandActions } from '../shared/command.actions';
import { takeUntil } from '../../../node_modules/rxjs/operators';
import { Subject } from '../../../node_modules/rxjs';
import { IMall } from '../mall/mall.model';
import { ILocation } from '../location/location.model';
import { AccountService } from '../account/account.service';
// import { AccountService } from '../account/account.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  year = 2018;
  account: Account;
  bCart = false;
  bPay = false;
  bContact = false;
  total;
  quantity = 0;
  cart;
  malls: IMall[];
  subtotal = 0;
  deliveryFee = 0;
  tax = 0;
  location: ILocation;
  bHide = false;
  selected;

  private onDestroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private accountSvc: AccountService,
    private rx: NgRedux<IAppState>
  ) {
    const self = this;
    this.rx.select('account').pipe(takeUntil(this.onDestroy$)).subscribe((account: Account) => {
      if (account) {
        self.account = account;
      } else {
        self.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe((account2: Account) => {
          self.account = account2;
        });
      }
    });

    this.rx.select('location').pipe(takeUntil(this.onDestroy$)).subscribe((loc: ILocation) => {
      self.location = loc;
    });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  getColor(menu) {
    return (this.selected === menu) ? '#4285F4' : 'black';
    // .fill{
    //   color: '#F4B400'; // '#0F9D58' // green
    // }
  }

  toHome() {
    this.selected = 'home';
    if (this.account) {
      this.router.navigate(['order/package']);
    } else {
      this.router.navigate(['account/login']);
    }
  }

  toDeliver() {
    this.selected = 'deliver';
    if (this.account) {
      this.router.navigate(['order/delivery']);
    } else {
      this.router.navigate(['account/login']);
    }
  }

  toPack() {
    this.selected = 'pack';
    if (this.account) {
      this.router.navigate(['order/package']);
    } else {
      this.router.navigate(['account/login']);
    }
  }

  toMap() {
    this.selected = 'map';
    if (this.account) {
      this.router.navigate(['order/map']);
    } else {
      this.router.navigate(['account/login']);
    }
  }

  toAccount() {
    this.selected = 'account';
    const account = this.account;
    if (account) {
      const roles = account.roles;
      if (roles && roles.length > 0 && roles.indexOf(Role.DRIVER) !== -1) {
        this.router.navigate(['account/setting'], { queryParams: { merchant: true } });
      } else {
        this.router.navigate(['account/setting'], { queryParams: { merchant: false } });
      }
    } else {
      this.router.navigate(['account/setting'], { queryParams: { merchant: false } });
    }
  }

  toSettlement() {
    if (this.account) {
      this.router.navigate(['order/settlement']);
    } else {
      this.router.navigate(['account/login']);
    }
  }

  toMerchant() {
    this.selected = 'merchant';
    if (this.account) {
      this.router.navigate(['payment/merchant']);
    } else {
      this.router.navigate(['account/login']);
    }
  }

  toSalary() {
    if (this.account) {
      this.router.navigate(['payment/salary']);
    } else {
      this.router.navigate(['account/login']);
    }
  }

  toPickup() {
    if (this.account) {
      this.router.navigate(['assignment/pickup']);
    } else {
      this.router.navigate(['account/login']);
    }
  }

  toClient() {
    this.selected = 'client';
    if (this.account) {
      this.router.navigate(['payment/client']);
    } else {
      this.router.navigate(['account/login']);
    }
  }
}
