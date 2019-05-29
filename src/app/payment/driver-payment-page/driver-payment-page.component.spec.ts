import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverPaymentPageComponent } from './driver-payment-page.component';

describe('DriverPaymentPageComponent', () => {
  let component: DriverPaymentPageComponent;
  let fixture: ComponentFixture<DriverPaymentPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DriverPaymentPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DriverPaymentPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
