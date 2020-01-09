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
import { FormBuilder } from '../../../../node_modules/@angular/forms';

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
  group;
  clientIds = [];
  accounts;
  forms = {};

  constructor(
    private orderSvc: OrderService,
    private sharedSvc: SharedService,
    private locationSvc: LocationService,
    private accountSvc: AccountService,
    private assignmentSvc: AssignmentService,
    private router: Router,
    private snackBar: MatSnackBar,
    // private rx: NgRedux<IAppState>,
    private fb: FormBuilder,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<DeliveryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IDeliveryDialogData
  ) {
    dialogRef.disableClose = true;

    const self = this;
    this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      self.account = account;
      if (account) {
        const location = self.data.location;
        const pickup = self.data.pickup;
        this.reload(account, pickup, location).then(() => { });
      } else {
        this.router.navigate(['account/login']);
      }
    });
  }

  ngOnInit() {
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

  reload(account: IAccount, pickupTime: string, location: ILocation): Promise<any> {
    const self = this;
    const accountId = account._id;
    const range = { $gt: moment().startOf('day').toISOString(), $lt: moment().endOf('day').toISOString() };
    const placeId = location.placeId;
    const orderQuery = { 'location.placeId': placeId, pickup: pickupTime, status: { $nin: ['del', 'bad', 'tmp'] } };
    const assignmentQuery = { delivered: range, driverId: accountId };

    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve, reject) => {
      this.assignmentSvc.quickFind(assignmentQuery).pipe(takeUntil(this.onDestroy$)).subscribe(assignments => {
        this.assignments = assignments;
        self.clientIds = this.sharedSvc.getDistinctValues(assignments, 'clientId');
        const q = { _id: { $in: self.clientIds } };
        self.accountSvc.quickFind(q).pipe(takeUntil(this.onDestroy$)).subscribe((accounts: IAccount[]) => {
          this.accounts = accounts;
          this.orderSvc.find(orderQuery).pipe(takeUntil(this.onDestroy$)).subscribe((orders: IOrder[]) => {
            orders.map(order => {
              const infoText = order.client.info;
              this.forms[order._id] = this.fb.group({
                info: [infoText]
              });
            });
            self.group = this.groupByAddress(location, accounts, orders, this.assignments);
            resolve(self.group);
          });
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

  groupByAddress(location: ILocation, accounts: IAccount[], orders: IOrder[], assignments: any[]) {
    const address = this.locationSvc.getAddrString(location);
    const group = { placeId: location.placeId, address: address, items: [] };
    orders.map(order => {
      const assignment = assignments.find(a => a.orderId === order._id);
      const account = accounts.find(a => a._id === order.clientId);
      if (assignment) {
        const code = assignment ? assignment.code : 'N/A';
        const status = assignment ? assignment.status : 'new';
        const balance = account.balance;
        group.items.push({ balance: balance, order: order, code: code, status: status, paid: (order.status === 'paid') });
      }
    });
    return group;
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

    // return {status: 'success'}
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy$)).subscribe(result => {
      if (result) {
        this.reload(this.account, this.data.pickup, this.data.location).then(group => {
          let isDone = true; // place.status === 'done';
          // group.items.push({ balance: balance, order: order, code: code, status: status, paid: (order.status === 'paid') });
          group.items.map(x => {
            if (x.status !== 'done') {
              isDone = false;
            }
          });

          if (isDone) {
            this.dialogRef.close(group);
          }
        });
      }
    });
  }

  finishDelivery(order: IOrder) {
    this.assignmentSvc.update({ orderId: order._id }, { status: 'done' }).pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      this.snackBar.open('', '此订单已完成', { duration: 1800 });
      this.reload(this.account, this.data.pickup, this.data.location).then(group => {
        this.dialogRef.close(group);
      });
    });
  }

  onSubmitClientInfo(order) {
    if (order) {
      const clientId = order.clientId;
      const info = this.forms[order._id].get('info').value;
      const data = {info: info};
      this.accountSvc.update({_id: clientId}, data).pipe(takeUntil(this.onDestroy$)).subscribe(() => {
        this.snackBar.open('', '客户信息已经更新', { duration: 1800 });
      });
    }
  }
}
