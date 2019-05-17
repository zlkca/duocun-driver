import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MerchantPaymentPageComponent } from './merchant-payment-page/merchant-payment-page.component';

const routes: Routes = [
  {path: 'merchant', component: MerchantPaymentPageComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentRoutingModule { }
