import { TestBed, inject } from '@angular/core/testing';

import { ClientBalanceService } from './client-balance.service';

describe('ClientBalanceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClientBalanceService]
    });
  });

  it('should be created', inject([ClientBalanceService], (service: ClientBalanceService) => {
    expect(service).toBeTruthy();
  }));
});
