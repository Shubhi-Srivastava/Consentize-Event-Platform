import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoothComponent } from './booth.component';

describe('BoothComponent', () => {
  let component: BoothComponent;
  let fixture: ComponentFixture<BoothComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BoothComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoothComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
