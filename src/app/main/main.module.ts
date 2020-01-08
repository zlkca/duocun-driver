import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { HomeComponent } from './home/home.component';
import { LocationModule } from '../location/location.module';
import { SharedModule } from '../shared/shared.module';
import { AccountService } from '../account/account.service';
import { AuthService } from '../account/auth.service';
import { LocationService } from '../location/location.service';

@NgModule({
  imports: [
    CommonModule,
    MainRoutingModule,
    SharedModule,
    LocationModule,
  ],
  declarations: [
    HomeComponent,
  ],
  exports: [
  ],
  providers: [
    AccountService,
    LocationService,
    AuthService
  ]
})
export class MainModule { }
