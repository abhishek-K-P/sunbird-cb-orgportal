import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventBasicDetailsComponent } from './event-basic-details.component';

describe('EventBasicDetailsComponent', () => {
  let component: EventBasicDetailsComponent;
  let fixture: ComponentFixture<EventBasicDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EventBasicDetailsComponent]
    });
    fixture = TestBed.createComponent(EventBasicDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
