import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DraftEventsComponent } from './draft-events.component';

describe('DraftEventsComponent', () => {
  let component: DraftEventsComponent;
  let fixture: ComponentFixture<DraftEventsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DraftEventsComponent]
    });
    fixture = TestBed.createComponent(DraftEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
