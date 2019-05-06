import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgRedux } from '../../../../node_modules/@angular-redux/store';
import { IAppState } from '../../store';
import { ILocation } from '../../location/location.model';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { Subject } from '../../../../node_modules/rxjs';
import { OrderService } from '../order.service';
import * as moment from 'moment';
import { SharedService } from '../../shared/shared.service';
import { Order, IOrder } from '../order.model';
@Component({
  selector: 'app-map-page',
  templateUrl: './map-page.component.html',
  styleUrls: ['./map-page.component.scss']
})
export class MapPageComponent implements OnInit, OnDestroy {
  private onDestroy$ = new Subject();
  currLocation;
  places = [];
  orders = [];
  dateRange;

  constructor(
    private rx: NgRedux<IAppState>,
    private orderSvc: OrderService,
    private sharedSvc: SharedService
  ) {
    this.rx.select<ILocation>('location').pipe(
      takeUntil(this.onDestroy$)
    ).subscribe(loc => {
      if (loc) {
        this.currLocation = loc;
      } else {
        this.currLocation = { lat: 43.8461479, lng: -79.37935279999999 };
      }

    });
  }

  ngOnInit() {
    this.dateRange = this.getDateRange();
    this.reload();
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  reload() {
    const self = this;
    self.orderSvc.find({ where: { delivered: self.dateRange } }).pipe(
      takeUntil(this.onDestroy$)
    ).subscribe(orders => {
      self.orders = orders;
      orders.map((x: IOrder) => {
        if (x.status !== 'paid') {
          const loc = x.location;
          const obj = { name: x.clientName, lat: loc.lat, lng: loc.lng };
          this.places.push(obj);
        }
      });
    });
  }

  getDateRange() {
    const now = this.sharedSvc.getNow();
    const dayEnd = this.sharedSvc.getStartOf('day').set({ hour: 19, minute: 30, second: 0, millisecond: 0 });

    if (now.isAfter(dayEnd)) {
      // this.deliverTime = this.sharedSvc.getStartOf('day').add(1, 'days')
      //   .set({ hour: 11, minute: 45, second: 0, millisecond: 0 })
      //   .format('YYYY-MM-DD HH:mm:ss');

      const tomorrowStart = this.sharedSvc.getStartOf('day').add(1, 'days').toDate();
      const tomorrowEnd = this.sharedSvc.getEndOf('day').add(1, 'days').toDate();
      return { $lt: tomorrowEnd, $gt: tomorrowStart };
    } else {
      // this.deliverTime = this.sharedSvc.getStartOf('day')
      //   .set({ hour: 11, minute: 45, second: 0, millisecond: 0 })
      //   .format('YYYY-MM-DD HH:mm:ss');

      const todayStart = this.sharedSvc.getStartOf('day').toDate();
      const todayEnd = this.sharedSvc.getEndOf('day').toDate();
      return { $lt: todayEnd, $gt: todayStart };
    }
  }
}
