import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccountService } from '../../account/account.service';
import { OrderService } from '../../order/order.service';
import { SharedService } from '../../shared/shared.service';
import { Order } from '../order.model';
import { SocketService } from '../../shared/socket.service';
import { Subject } from '../../../../node_modules/rxjs';
import { takeUntil } from '../../../../node_modules/rxjs/operators';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss']
})
export class OrderHistoryComponent implements OnInit, OnDestroy {
  private onDestroy$ = new Subject();
  account;
  restaurant;
  orders = [];

  constructor(
    private accountSvc: AccountService,
    private orderSvc: OrderService,
    private sharedSvc: SharedService,
    private socketSvc: SocketService
  ) {

  }
  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
  ngOnInit() {
    const self = this;
    this.accountSvc.getCurrentUser().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      self.account = account;
      if (account && account.id) {
        self.reload(account.id);
      } else {
        // should never be here.
        self.orders = [];
      }
    });

    // this.socket.connect(this.authSvc.getToken());
    this.socketSvc.on('updateOrders', x => {
      // self.onFilterOrders(this.selectedRange);
      if (x.clientId === self.account.id) {
        const index = self.orders.findIndex(i => i.id === x.id);
        if (index !== -1) {
          self.orders[index] = x;
        } else {
          self.orders.push(x);
        }
        self.orders.sort((a: Order, b: Order) => {
          if (this.sharedSvc.compareDateTime(a.created, b.created)) {
            return -1;
          } else {
            return 1;
          }
        });
      }
    });
  }

  reload(clientId) {
    const self = this;
    self.orderSvc.find({ clientId: clientId, status: { $nin: ['del', 'bad', 'tmp'] } }).subscribe(orders => {
      orders.sort((a: Order, b: Order) => {
        if (this.sharedSvc.compareDateTime(a.created, b.created)) {
          return -1;
        } else {
          return 1;
        }
      });
      self.orders = orders;
    });
  }

  onSelect(c) {
    // this.select.emit({ order: c });
  }

  toDateTimeString(s) {
    return s ? this.sharedSvc.toDateTimeString(s) : '';
  }

  // takeOrder(order) {
  //   const self = this;
  //   order.workerStatus = 'process';
  //   this.orderSvc.replace(order).subscribe(x => {
  //     // self.afterSave.emit({name: 'OnUpdateOrder'});
  //     self.reload(self.account.id);
  //   });
  // }

  // sendForDeliver(order) {
  //   const self = this;
  //   order.workerStatus = 'done';
  //   this.orderSvc.replace(order).subscribe(x => {
  //     // self.afterSave.emit({name: 'OnUpdateOrder'});
  //     self.reload(self.account.id);
  //   });
  // }
}
