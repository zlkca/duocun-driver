import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from '../../node_modules/rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, OnDestroy {

  options;
  account;
  deliveryAddress;
  onDestroy$ = new Subject<any>();

  constructor(
  ) {
    // window.addEventListener('orientationchange', function () {
    //   window.location.reload();
    // }, false);

    // window.addEventListener('unload', (event) => {
    //    self.authSvc.removeCookies();
    // });

    // this.rx.select<ILocation>('location').pipe(
    //   takeUntil(this.onDestroy$)
    // ).subscribe(loc => {
    //   self.deliveryAddress = self.locationSvc.getAddrString(loc);
    // });
  }

  ngOnInit() {

  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
  // onAddressChange(e) {
  //   this.rx.dispatch({
  //     type: CommandActions.SEND,
  //     payload: {name: 'input-address', args: e.input}
  //   });
  // }

  // onAddressClear(e) {
  //   this.rx.dispatch({
  //     type: CommandActions.SEND,
  //     payload: {name: 'clear-address-input', args: null}
  //   });
  // }

  // onAddressInputFocus(e) {
  //   this.rx.dispatch({
  //     type: CommandActions.SEND,
  //     payload: {name: 'show-location-history', args: null}
  //   });
  // }

  // useCurrentLocation() {
  //   this.rx.dispatch({
  //     type: CommandActions.SEND,
  //     payload: {name: 'use-current-location', args: null}
  //   });
  // }
}
