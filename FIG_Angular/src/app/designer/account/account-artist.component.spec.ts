import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AccountArtistComponent } from "./account-artist.component";

describe("AccountComponent", () => {
  let component: AccountArtistComponent;
  let fixture: ComponentFixture<AccountArtistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AccountArtistComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountArtistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
