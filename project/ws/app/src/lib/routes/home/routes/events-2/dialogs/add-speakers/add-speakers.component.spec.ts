import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSpeakersComponent } from './add-speakers.component';

describe('AddSpeakersComponent', () => {
  let component: AddSpeakersComponent;
  let fixture: ComponentFixture<AddSpeakersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddSpeakersComponent]
    });
    fixture = TestBed.createComponent(AddSpeakersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
