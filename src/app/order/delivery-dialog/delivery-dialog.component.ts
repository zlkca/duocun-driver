import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatSnackBar } from '../../../../node_modules/@angular/material';
import { OrderService } from '../order.service';
import { AccountService } from '../../account/account.service';
import { AssignmentService } from '../../assignment/assignment.service';
import { Router } from '../../../../node_modules/@angular/router';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { Subject } from '../../../../node_modules/rxjs';
import { IAccount } from '../../account/account.model';
import { IOrder, IOrderItem } from '../order.model';
import * as moment from 'moment';
import { SharedService } from '../../shared/shared.service';
import { LocationService } from '../../location/location.service';
import { ILocation } from '../../location/location.model';
import { ReceiveCashDialogComponent } from '../receive-cash-dialog/receive-cash-dialog.component';

export interface IDeliveryDialogData {
  title: string;
  content: string;
  buttonTextNo: string;
  buttonTextYes: string;
  location: any;
  pickup: string;
}

@Component({
  selector: 'app-delivery-dialog',
  templateUrl: './delivery-dialog.component.html',
  styleUrls: ['./delivery-dialog.component.scss']
})
export class DeliveryDialogComponent implements OnInit, OnDestroy {
  onDestroy$ = new Subject();
  account;
  assignments;
  groups;
  clientIds = [];
  accounts;

  constructor(
    private orderSvc: OrderService,
    private sharedSvc: SharedService,
    private locationSvc: LocationService,
    private accountSvc: AccountService,
    private assignmentSvc: AssignmentService,
    private router: Router,
    private snackBar: MatSnackBar,
    // private rx: NgRedux<IAppState>,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<DeliveryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IDeliveryDialogData
  ) {
    dialogRef.disableClose = false;

    const self = this;
    this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      self.account = account;
      if (account) {
        const placeId = this.data.location.placeId;
        this.reload(account, this.data.pickup, placeId);
      } else {
        this.router.navigate(['account/login']);
      }
    });
  }

  ngOnInit() {
    const loc = this.data.location;
  }


  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  onNoClick() {
    this.dialogRef.close();
  }


  getQuantity(order: IOrder) {
    let quantity = 0;
    order.items.map((item: IOrderItem) => {
      quantity += item.quantity;
    });
    return quantity;
  }

  reload(account: IAccount, pickupTime: string, placeId: string) {
    const self = this;
    const accountId = account._id;
    const range = { $gt: moment().startOf('day').toISOString(), $lt: moment().endOf('day').toISOString() };

    const orderQuery = { 'location.placeId': placeId, pickup: pickupTime, status: { $nin: ['del', 'bad', 'tmp'] } };
    const assignmentQuery = { delivered: range, driverId: accountId };
    this.assignmentSvc.quickFind(assignmentQuery).pipe(takeUntil(this.onDestroy$)).subscribe(assignments => {
      this.assignments = assignments;
      self.clientIds = this.sharedSvc.getDistinctValues(assignments, 'clientId');
      const q = { _id: { $in: self.clientIds } };
      self.accountSvc.quickFind(q).pipe(takeUntil(this.onDestroy$)).subscribe((accounts: IAccount[]) => {
        this.accounts = accounts;
        this.orderSvc.find(orderQuery).pipe(takeUntil(this.onDestroy$)).subscribe((orders: IOrder[]) => {
          // this.forms = {};
          self.groups = this.groupByAddress(accounts, orders, this.assignments);
        });
      });
    });
  }

  isSameLocation(l1: any, l2: any) {
    if (l1) {
      return l1.streetNumber === l2.streetNumber &&
        l1.streetName === l2.streetName &&
        l1.city === l2.city &&
        l1.province === l2.province;
    } else {
      return false;
    }
  }

  groupByAddress(accounts: IAccount[], orders: IOrder[], assignments: any[]) {
    const groups = [];
    orders.map(order => {
      const grp = groups.find(g => g && g.placeId === order.location.placeId); // this.isSameLocation(g.location, order.location));

      const address = this.locationSvc.getAddrString(order.location);

      const assignment = assignments.find(a => a.orderId === order._id);
      const account = accounts.find(a => a._id === order.clientId);
      if (assignment) {
        const code = assignment ? assignment.code : 'N/A';
        const status = assignment ? assignment.status : 'new';

        const balance = account.balance;

        if (!grp) {
          const item = { balance: balance, order: order, code: code, status: status, paid: (order.status === 'paid') };
          groups.push({ placeId: order.location.placeId, address: address, items: [item] });
        } else {
          grp.items.push({ balance: balance, order: order, code: code, status: status, paid: (order.status === 'paid') });
        }
      }
    });
    return groups;
  }


  navigateTo(location: ILocation) {
    (<any>window).location = encodeURI('https://www.google.com/maps/dir/?api=1&destination=' +
      + location.streetNumber + '+' + location.streetName + '+'
      + (location.subLocality ? location.subLocality : location.city) + '+'
      + location.province
      + '&destination_placeId=' + location.placeId);
  }

  openReceiveCashDialog(order: IOrder) {
    const orderId = order._id;
    const params = {
      width: '300px',
      data: {
        title: '收款', content: '', buttonTextNo: '取消', buttonTextYes: '确认收款',
        orderId: orderId, accountId: this.account._id, accountName: this.account.username
      },
      panelClass: 'receive-cash-dialog'
    };
    const dialogRef = this.dialog.open(ReceiveCashDialogComponent, params);

    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy$)).subscribe(result => {

    });
  }

  finishDelivery(order: IOrder) {
    this.assignmentSvc.update({ orderId: order._id }, { status: 'done' }).pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      this.snackBar.open('', '此订单已完成', { duration: 1800 });
      this.reload(this.account, this.accounts, this.data.pickup);
    });
  }
}
