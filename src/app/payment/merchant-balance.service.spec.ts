import { TestBed, inject } from '@angular/core/testing';

import { MerchantBalanceService } from './merchant-balance.service';

describe('MerchantBalanceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MerchantBalanceService]
    });
  });

  it('should be created', inject([MerchantBalanceService], (service: MerchantBalanceService) => {
    expect(service).toBeTruthy();
  }));
});
