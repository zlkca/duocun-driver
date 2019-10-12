import { Component, OnInit, OnDestroy } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SharedService } from '../../shared/shared.service';
import { LocationService } from '../../location/location.service';
import { AccountService } from '../../account/account.service';
import { ILocationHistory, IPlace, ILocation, ILatLng, GeoPoint } from '../../location/location.model';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../../store';
import { SocketService } from '../../shared/socket.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../account/auth.service';
import { Subject } from '../../../../node_modules/rxjs';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { AccountActions } from '../../account/account.actions';
import { Account, Role } from '../../account/account.model';
import { ILocationAction } from '../../location/location.reducer';
import { LocationActions } from '../../location/location.actions';
import { AssignmentService } from '../../assignment/assignment.service';
// import { MomentDateAdapter } from '../../../../node_modules/@angular/material-moment-adapter';
import * as moment from 'moment';

const APP = environment.APP;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  center: GeoPoint = { lat: 43.761539, lng: -79.411079 };
  restaurants;
  places: IPlace[];
  deliveryAddress = '';
  placeholder = 'Delivery Address';
  mapFullScreen = true;
  subscrAccount;
  account;
  bHideMap = false;
  bTimeOptions = false;
  orderDeadline = { h: 9, m: 30 };
  overdue;
  afternoon;
  // deliveryTime: IDeliveryTime = { type: '', text: '' };

  inRange = false;
  onDestroy$ = new Subject<any>();

  constructor(
    private accountSvc: AccountService,
    private assignmentSvc: AssignmentService,
    private locationSvc: LocationService,
    private authSvc: AuthService,
    private router: Router,
    private rx: NgRedux<IAppState>,
  ) {
  }


  ngOnInit() {
    const self = this;
    self.accountSvc.getCurrentUser().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      self.rx.dispatch({ type: AccountActions.UPDATE, payload: account });
      if (account) {
        self.loginSuccessHandler(account);
      } else { // not login
        self.router.navigate(['account/login']);
      }
    }, err => {
      console.log('login failed');
    });
  }

  loginSuccessHandler(account: Account) {
    const roles = account.roles;
    if (roles && roles.length > 0 && roles.indexOf(Role.DRIVER) !== -1) {
      // const todayStart = moment().startOf('day').toDate();
      // const todayEnd = moment().endOf('day').toDate();
      // const q = { $lt: todayEnd, $gt: todayStart };
      // this.assignmentSvc.find(q).pipe(takeUntil(this.onDestroy$)).subscribe(x => {
        this.router.navigate(['order/package']);
      // });
    } else { // not authorized for opreration merchant
      this.router.navigate(['account/setting'], { queryParams: { merchant: false } });
    }
  }

  wechatLoginHandler(data: any) {
    const self = this;
    self.authSvc.setUserId(data.userId);
    self.authSvc.setAccessToken(data.id);
    self.accountSvc.getCurrentUser().pipe(takeUntil(this.onDestroy$)).subscribe((account: Account) => {
      if (account) {
        self.account = account;

        // this.snackBar.open('', '微信登录成功。', {
        //   duration: 1000
        // });
        // self.loading = false;
        // self.init(account);
      } else {
        // this.snackBar.open('', '微信登录失败。', {
        //   duration: 1000
        // });
      }
    });

    this.getCurrentLocation();
  }

  getCurrentLocation() {
    const self = this;
    self.places = [];
    this.locationSvc.getCurrentLocation().then(r => {
      // self.sharedSvc.emitMsg({name: 'OnUpdateAddress', addr: r});
      self.deliveryAddress = self.locationSvc.getAddrString(r); // set address text to input

      self.rx.dispatch<ILocationAction>({
        type: LocationActions.UPDATE,
        payload: r
      });
    },
      err => {
        console.log(err);
      });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

}
