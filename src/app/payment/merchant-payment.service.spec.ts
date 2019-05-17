import { TestBed, inject } from '@angular/core/testing';

import { MerchantPaymentService } from './merchant-payment.service';

describe('MerchantPaymentService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MerchantPaymentService]
    });
  });

  it('should be created', inject([MerchantPaymentService], (service: MerchantPaymentService) => {
    expect(service).toBeTruthy();
  }));
});
