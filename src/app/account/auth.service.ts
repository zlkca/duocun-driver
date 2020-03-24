import { Injectable } from '@angular/core';
import * as Cookies from 'js-cookie';

const COOKIE_EXPIRY_DAYS = 36;


@Injectable()
export class AuthService {

  constructor(
  ) {

  }

  setAccessTokenId(token: string) {
    if (token) {
      Cookies.set('duocun-staff-token-id', token, { expires: COOKIE_EXPIRY_DAYS });
    }
  }

  getAccessTokenId(): string {
    const tokenId = Cookies.get('duocun-staff-token-id');
    return tokenId ? tokenId : null;
  }


  // setLocation(loc: ILocation) {
  //   Cookies.remove('duocun-location');
  //   Cookies.set('duocun-location', JSON.stringify(loc));
  // }

  // getLocation(): ILocation {
  //   const s = Cookies.get('duocun-location');
  //   return s ? JSON.parse(s) : null;
  // }

  // removeLocation() {
  //   Cookies.remove('duocun-location');
  // }

  removeCookies() {
    Cookies.remove('duocun-staff-token-id');
  }
}
