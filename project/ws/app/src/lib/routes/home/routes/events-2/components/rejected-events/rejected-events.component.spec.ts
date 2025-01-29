import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RejectedEventsComponent } from './rejected-events.component';

describe('RejectedEventsComponent', () => {
  let component: RejectedEventsComponent;
  let fixture: ComponentFixture<RejectedEventsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RejectedEventsComponent]
    });
    fixture = TestBed.createComponent(RejectedEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
