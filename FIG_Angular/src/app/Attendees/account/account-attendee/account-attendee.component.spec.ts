import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AccountAttendeeComponent } from "./account-attendee.component";

describe("AccountAttendeeComponent", () => {
  let component: AccountAttendeeComponent;
  let fixture: ComponentFixture<AccountAttendeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AccountAttendeeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountAttendeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
