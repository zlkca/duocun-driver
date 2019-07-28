import { TestBed } from '@angular/core/testing';

import { DriverHourService } from './driver-hour.service';

describe('DriverHourService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DriverHourService = TestBed.get(DriverHourService);
    expect(service).toBeTruthy();
  });
});
