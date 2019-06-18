import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverSalaryPageComponent } from './driver-salary-page.component';

describe('DriverSalaryPageComponent', () => {
  let component: DriverSalaryPageComponent;
  let fixture: ComponentFixture<DriverSalaryPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DriverSalaryPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DriverSalaryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
