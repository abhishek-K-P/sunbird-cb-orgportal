import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingApprovalEventsComponent } from './pending-approval-events.component';

describe('PendingApprovalEventsComponent', () => {
  let component: PendingApprovalEventsComponent;
  let fixture: ComponentFixture<PendingApprovalEventsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PendingApprovalEventsComponent]
    });
    fixture = TestBed.createComponent(PendingApprovalEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
