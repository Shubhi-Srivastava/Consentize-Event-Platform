import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendeeEventHistoryComponent } from './attendee-event-history.component';

describe('AttendeeEventHistoryComponent', () => {
  let component: AttendeeEventHistoryComponent;
  let fixture: ComponentFixture<AttendeeEventHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AttendeeEventHistoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendeeEventHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
