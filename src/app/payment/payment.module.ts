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

import { AccountService } from '../account/account.service';
import { MerchantPaymentService } from './merchant-payment.service';
import { DriverPaymentPageComponent } from './driver-payment-page/driver-payment-page.component';
import { MerchantBalanceService } from './merchant-balance.service';

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
  ],
  declarations: [
    MerchantPaymentPageComponent,
    DriverPaymentPageComponent
  ],
  providers: [
    AccountService,
    MerchantPaymentService,
    MerchantBalanceService
  ]
})
export class PaymentModule { }
