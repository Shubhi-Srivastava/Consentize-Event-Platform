import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtistPortfolioPreviewComponent } from './artist-portfolio-preview.component';

describe('ArtistPortfolioPreviewComponent', () => {
  let component: ArtistPortfolioPreviewComponent;
  let fixture: ComponentFixture<ArtistPortfolioPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArtistPortfolioPreviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArtistPortfolioPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
