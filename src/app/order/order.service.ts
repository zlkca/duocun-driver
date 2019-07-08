
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { EntityService } from '../entity.service';
import { AuthService } from '../account/auth.service';
import { IOrder, IOrderItem } from './order.model';



@Injectable()
export class OrderService extends EntityService {
  url;

  constructor(
    public authSvc: AuthService,
    public http: HttpClient
  ) {
    super(authSvc, http);
    this.url = super.getBaseUrl() + 'Orders';
  }

  getCost(order: IOrder) {
    let total = 0;
    order.items.map((item: IOrderItem) => {
      total += item.cost * item.quantity;
    });
    return total;
  }
}
