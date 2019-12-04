import { Injectable } from '@angular/core';
import { EntityService } from '../entity.service';
// import { CookieService } from '../cookie.service';
import { AuthService } from '../account/auth.service';
import { HttpClient } from '@angular/common/http';
import { IAccount } from '../account/account.model';
import { IAssignment } from './assignment.model';
import { SharedService } from '../shared/shared.service';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService extends EntityService {
  public url;

  constructor(
    public cookieSvc: AuthService,
    public sharedSvc: SharedService,
    public http: HttpClient
  ) {
    super(cookieSvc, http);
    this.url = this.getBaseUrl() + 'Assignments';
  }

  getPickupTimes(xs: IAssignment[]): string[] {
    const delivers = this.sharedSvc.getDistinctValues(xs, 'delivered');
    const a = [];
    delivers.map(x => {
      const t = this.sharedSvc.getTimeString(x);
      a.push(t);
    });
    return a;
  }
}
