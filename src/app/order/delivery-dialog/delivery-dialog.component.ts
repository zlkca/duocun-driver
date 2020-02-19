import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatSnackBar } from '../../../../node_modules/@angular/material';
import { OrderService } from '../order.service';
import { AccountService } from '../../account/account.service';
import { Router } from '../../../../node_modules/@angular/router';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { Subject } from '../../../../node_modules/rxjs';
import { IAccount, IAccountAttribute } from '../../account/account.model';
import { IOrder, IOrderItem, OrderStatus } from '../order.model';
import * as moment from 'moment';
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
  group;
  clientIds = [];
  accounts;
  forms = {};  // { orderId: any }
  bAllowSave = {}; // { orderId: bool }
  Status = OrderStatus;
  attributes;

  constructor(
    private orderSvc: OrderService,
    private locationSvc: LocationService,
    private accountSvc: AccountService,
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
        this.reload(account, pickup, location).then((group) => {
          this.group = group;
        });
      } else {
        this.router.navigate(['account/login']);
      }
    });

    this.accountSvc.getAttributes().pipe(takeUntil(this.onDestroy$)).subscribe((rs: IAccountAttribute[]) => {
      this.attributes = rs;
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

  getProductCssClass(item) {
    if (item && item.product && item.product.categoryId === '5cbc5df61f85de03fd9e1f12') {
      return 'beverage';
    } else {
      return 'product';
    }
  }

  hasBeverage(item) {
    return item && item.product && item.product.categoryId === '5cbc5df61f85de03fd9e1f12';
  }

  getQuantity(order: IOrder) {
    let quantity = 0;
    order.items.map((item: IOrderItem) => {
      quantity += item.quantity;
    });
    return quantity;
  }

  reload(account: IAccount, pickupTime: string, location: ILocation): Promise<any> {
    // const accountId = account._id;
    // const range = { $gt: moment().startOf('day').toISOString(), $lt: moment().endOf('day').toISOString() };
    const placeId = location.placeId;
    const orderQuery = {
      'location.placeId': placeId, pickup: pickupTime,
      status: { $nin: [OrderStatus.BAD, OrderStatus.DELETED, OrderStatus.TEMP] }
    };
    return new Promise((resolve, reject) => {
      this.orderSvc.find(orderQuery).pipe(takeUntil(this.onDestroy$)).subscribe((orders: IOrder[]) => {
        orders.map(order => {
          const infoText = order.client.info;
          this.forms[order._id] = this.fb.group({
            info: [infoText]
          });
          this.bAllowSave[order._id] = false;
        });
        const group = this.groupByAddress(location, orders);
        resolve(group);
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

  groupByAddress(location: ILocation, orders: IOrder[]) {
    const address = this.locationSvc.getAddrString(location);
    const group = { placeId: location.placeId, address: address, items: [] };
    orders.map(order => {
      if (order.driverId) {
        const code = order.code;
        const status = order.status;
        const balance = order.client ? order.client.balance : 0;
        group.items.push({ balance: balance, order: order, code: code, status: status });
      }
    });
    return group;
  }

  hasInvalidateStreetNumber(location: ILocation) {
    return location.streetNumber.indexOf('-') !== -1 ||
      location.streetNumber.indexOf('\\') !== -1 ||
      location.streetNumber.indexOf(',') !== -1 ||
      location.streetNumber.indexOf('/') !== -1
      ;
  }


  navigateTo(location: ILocation) {
    if (this.hasInvalidateStreetNumber(location)) {
      alert('该地址的街道号有问题，请打电话给客户确认地址，再手工导航。');
    } else {
      (<any>window).location = encodeURI('https://www.google.com/maps/dir/?api=1' +
        '&destination='
        + location.streetNumber + '+' + location.streetName + '+'
        + (location.subLocality ? location.subLocality : location.city) + '+'
        + location.province
        + '&destination_placeId=' + location.placeId); // more accurate
    }
  }

  openReceiveCashDialog(order: IOrder) {
    const clientId = order.clientId;
    this.accountSvc.find({ _id: clientId }).pipe(takeUntil(this.onDestroy$)).subscribe((accounts) => {
      const client = accounts[0];
      if (client && client.attributes && client.attributes.length > 0) {
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
              group.items.map(x => {
                if (x.status !== OrderStatus.DONE) {
                  isDone = false;
                }
              });

              if (isDone) {
                this.group = group;
                this.dialogRef.close(group);
              }
            });
          }
        });
      } else {
        alert('请选择客户属性。');
      }
    });
  }

  finishDelivery(order: IOrder) {
    const clientId = order.clientId;
    this.accountSvc.find({ _id: clientId }).pipe(takeUntil(this.onDestroy$)).subscribe((accounts) => {
      const client = accounts[0];
      if (client && client.attributes && client.attributes.length > 0) {
        this.orderSvc.update({ _id: order._id }, { status: OrderStatus.DONE }).pipe(takeUntil(this.onDestroy$)).subscribe(() => {
          this.snackBar.open('', '此订单已完成', { duration: 1800 });
          this.reload(this.account, this.data.pickup, this.data.location).then(group => {
            // if finish all delivery in this address, close the dialog; otherwise keep the dialog open
            // this.dialogRef.close(group);
            let isDone = true; // place.status === 'done';
            group.items.map(x => {
              if (x.status !== OrderStatus.DONE) {
                isDone = false;
              }
            });

            if (isDone) {
              // this.group = group;
              this.dialogRef.close(group);
            } else {
              this.group = group;
            }
          });
        });
      } else {
        alert('请选择客户属性。');
      }
    });
  }

  onSubmitClientInfo(order) {
    if (order) {
      const clientId = order.clientId;
      const info = this.forms[order._id].get('info').value;
      const data = { info: info };
      this.accountSvc.update({ _id: clientId }, data).pipe(takeUntil(this.onDestroy$)).subscribe(() => {
        this.snackBar.open('', '客户信息已经更新', { duration: 1800 });
        this.bAllowSave[order._id] = false;
      });
    }
  }

  onClickClientInfo(order) {
    this.bAllowSave[order._id] = true;
  }

  onAttributesChanged(client, $event) {
    client.attributes = $event.value;
  }

  onSave(client, bOpened) {
    if (!bOpened) {
      const attrs = client.attributes ? client.attributes : [];
      this.accountSvc.update({ _id: client._id }, { attributes: attrs }).pipe(takeUntil(this.onDestroy$)).subscribe(() => {
        this.snackBar.open('', client.username + '属性已更新', { duration: 1000 });

        // const client = this.clients.find(c => c._id === d._id);
        // client.attributes = attrs;
        // this.dataSource = new MatTableDataSource(this.clients);
        // this.dataSource.sort = this.sort;
      });
    }
  }
}
