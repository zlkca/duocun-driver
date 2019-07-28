import { TestBed } from '@angular/core/testing';

import { PickupService } from './pickup.service';

describe('PickupService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PickupService = TestBed.get(PickupService);
    expect(service).toBeTruthy();
  });
});
