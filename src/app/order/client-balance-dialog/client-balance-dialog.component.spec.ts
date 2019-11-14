import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientBalanceDialogComponent } from './client-balance-dialog.component';

describe('ClientBalanceDialogComponent', () => {
  let component: ClientBalanceDialogComponent;
  let fixture: ComponentFixture<ClientBalanceDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClientBalanceDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientBalanceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
