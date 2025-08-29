import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { GuideComponent } from './guide.component';
import { GuideService } from './services/guide.service';

describe('GuideComponent', () => {
  let component: GuideComponent;
  let fixture: ComponentFixture<GuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GuideComponent,
        NoopAnimationsModule,
        MatSnackBarModule
      ],
      providers: [
        GuideService
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load guides on init', () => {
    expect(component.guides.length).toBeGreaterThan(0);
  });

  it('should select first guide automatically', () => {
    expect(component.selectedGuide).toBeTruthy();
  });
});
