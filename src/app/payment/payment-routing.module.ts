import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MerchantPaymentPageComponent } from './merchant-payment-page/merchant-payment-page.component';
import { DriverPaymentPageComponent } from './driver-payment-page/driver-payment-page.component';
import { DriverSalaryPageComponent } from './driver-salary-page/driver-salary-page.component';

const routes: Routes = [
  { path: 'merchant', component: MerchantPaymentPageComponent },
  { path: 'driver', component: DriverPaymentPageComponent },
  { path: 'salary', component: DriverSalaryPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentRoutingModule { }
