import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiveCashDialogComponent } from './receive-cash-dialog.component';

describe('ReceiveCashDialogComponent', () => {
  let component: ReceiveCashDialogComponent;
  let fixture: ComponentFixture<ReceiveCashDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReceiveCashDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiveCashDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
