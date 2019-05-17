import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PaymentRoutingModule } from './payment-routing.module';
import { MerchantPaymentPageComponent } from './merchant-payment-page/merchant-payment-page.component';
import { FormsModule, ReactiveFormsModule } from '../../../node_modules/@angular/forms';
import { MatSnackBarModule } from '../../../node_modules/@angular/material';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { AccountService } from '../account/account.service';
import { MerchantPaymentService } from './merchant-payment.service';

@NgModule({
  imports: [
    CommonModule,
    PaymentRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatSlideToggleModule
  ],
  declarations: [
    MerchantPaymentPageComponent
  ],
  providers: [
    AccountService,
    MerchantPaymentService
  ]
})
export class PaymentModule { }
