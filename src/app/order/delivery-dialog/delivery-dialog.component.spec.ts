import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryDialogComponent } from './delivery-dialog.component';

describe('DeliveryDialogComponent', () => {
  let component: DeliveryDialogComponent;
  let fixture: ComponentFixture<DeliveryDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeliveryDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
