import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantPaymentPageComponent } from './merchant-payment-page.component';

describe('MerchantPaymentPageComponent', () => {
  let component: MerchantPaymentPageComponent;
  let fixture: ComponentFixture<MerchantPaymentPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MerchantPaymentPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MerchantPaymentPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
