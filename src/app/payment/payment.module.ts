import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PaymentRoutingModule } from './payment-routing.module';
import { MerchantPaymentPageComponent } from './merchant-payment-page/merchant-payment-page.component';
import { FormsModule, ReactiveFormsModule } from '../../../node_modules/@angular/forms';
import { MatSnackBarModule } from '../../../node_modules/@angular/material';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AccountService } from '../account/account.service';
import { DriverPaymentPageComponent } from './driver-payment-page/driver-payment-page.component';
import { MerchantBalanceService } from './merchant-balance.service';
import { DriverSalaryPageComponent } from './driver-salary-page/driver-salary-page.component';
import { OrderService } from '../order/order.service';
import { RestaurantService } from '../restaurant/restaurant.service';
import { ClientPaymentComponent } from './client-payment/client-payment.component';
import { ClientPaymentPageComponent } from './client-payment-page/client-payment-page.component';
import { ClientBalanceService } from './client-balance.service';

@NgModule({
  imports: [
    CommonModule,
    PaymentRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
  ],
  declarations: [
    MerchantPaymentPageComponent,
    DriverPaymentPageComponent,
    DriverSalaryPageComponent,
    ClientPaymentComponent,
    ClientPaymentPageComponent
  ],
  providers: [
    AccountService,
    MerchantBalanceService,
    OrderService,
    RestaurantService,
    ClientBalanceService
  ]
})
export class PaymentModule { }
