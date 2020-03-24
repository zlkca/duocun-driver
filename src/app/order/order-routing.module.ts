import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { SummaryPageComponent } from './summary-page/summary-page.component';
import { SettlementPageComponent } from './settlement-page/settlement-page.component';
import { MapPageComponent } from './map-page/map-page.component';
import { PickupPageComponent } from './pickup-page/pickup-page.component';
import { PackagePageComponent } from './package-page/package-page.component';

const routes: Routes = [
  { path: 'history', component: OrderHistoryComponent },
  { path: 'summary', component: SummaryPageComponent },
  { path: 'pickup', component: PackagePageComponent },
  { path: 'settlement', component: SettlementPageComponent },
  { path: 'map', component: MapPageComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrderRoutingModule { }
