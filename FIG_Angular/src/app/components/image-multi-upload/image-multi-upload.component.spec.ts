import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageMultiUploadComponent } from './image-multi-upload.component';

describe('ImageMultiUploadComponent', () => {
  let component: ImageMultiUploadComponent;
  let fixture: ComponentFixture<ImageMultiUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImageMultiUploadComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageMultiUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
