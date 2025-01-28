import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventCompetenciesComponent } from './event-competencies.component';

describe('EventCompetenciesComponent', () => {
  let component: EventCompetenciesComponent;
  let fixture: ComponentFixture<EventCompetenciesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EventCompetenciesComponent]
    });
    fixture = TestBed.createComponent(EventCompetenciesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
