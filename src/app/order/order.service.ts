
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { EntityService } from '../entity.service';
import { AuthService } from '../account/auth.service';
import { IOrder, IOrderItem } from './order.model';
import { Observable } from '../../../node_modules/rxjs';



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

  // payOrder(req: Request, res: Response) {
  //   const toId = req.body.toId;
  //   const toName = req.body.toName;
  //   const received = +req.body.received;
  //   const orderId = req.body.orderId;
  //   const note = req.body.note;
  pay(toId: string, toName: string, received: number, orderId: string, note: string): Observable<any> {
    const url = this.url + '/pay';
    return this.doPost(url, { toId: toId, toName: toName, received: received, orderId: orderId, note: note });
  }
}
