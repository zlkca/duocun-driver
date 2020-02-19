
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { EntityService } from '../entity.service';
import { AuthService } from '../account/auth.service';
import { IOrder, IOrderItem } from './order.model';
import { Observable } from '../../../node_modules/rxjs';
import { SharedService } from '../shared/shared.service';



@Injectable()
export class OrderService extends EntityService {
  url;

  constructor(
    public authSvc: AuthService,
    public sharedSvc: SharedService,
    public http: HttpClient
  ) {
    super(authSvc, http);
    this.url = super.getBaseUrl() + 'Orders';
  }

  getPickupTimes(orders: IOrder[]): string[] {
    const delivers = this.sharedSvc.getDistinctValues(orders, 'delivered');
    const a = [];
    delivers.map(x => {
      const t = this.sharedSvc.getTimeString(x);
      a.push(t);
    });
    return a;
  }

  // return -- eg. { status: 'success' }
  payOrder(toId: string, toName: string, received: number, orderId: string, note: string): Observable<any> {
    const url = this.url + '/payOrder';
    return this.doPost(url, { toId: toId, toName: toName, received: received, orderId: orderId, note: note });
  }
}
