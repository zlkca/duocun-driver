import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientPaymentPageComponent } from './client-payment-page.component';

describe('ClientPaymentPageComponent', () => {
  let component: ClientPaymentPageComponent;
  let fixture: ComponentFixture<ClientPaymentPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClientPaymentPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientPaymentPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
