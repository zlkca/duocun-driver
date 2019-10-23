import { Injectable } from '@angular/core';
import { EntityService } from '../entity.service';
import { AuthService } from '../account/auth.service';
import { HttpClient } from '../../../node_modules/@angular/common/http';
import { Observable } from '../../../node_modules/rxjs';

@Injectable({
  providedIn: 'root'
})
@Injectable()
export class ClientPaymentService extends EntityService {
  url;
  constructor(
    public authSvc: AuthService,
    public http: HttpClient,
  ) {
    super(authSvc, http);
    this.url = super.getBaseUrl() + 'ClientPayments';
  }

  pay(toId: string, toName: string, received: number, balance: number, orderId: string): Observable<any> {
    const url = this.url + '/pay';
    return this.doPost(url, { toId: toId, toName: toName, received: received, balance: balance, orderId: orderId });
  }
}
