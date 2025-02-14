import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventMaterialsComponent } from './event-materials.component';

describe('EventMaterialsComponent', () => {
  let component: EventMaterialsComponent;
  let fixture: ComponentFixture<EventMaterialsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EventMaterialsComponent]
    });
    fixture = TestBed.createComponent(EventMaterialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
