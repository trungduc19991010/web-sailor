import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CourseListComponent } from './course-list.component';
import { CourseService } from '../services/course.service';

describe('CourseListComponent', () => {
  let component: CourseListComponent;
  let fixture: ComponentFixture<CourseListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CourseListComponent,
        NoopAnimationsModule
      ],
      providers: [
        CourseService
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CourseListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load courses on init', () => {
    expect(component.courses.length).toBeGreaterThan(0);
  });

  it('should filter courses correctly', () => {
    component.searchQuery = 'an toàn';
    component.applyFilters();
    expect(component.filteredCourses.length).toBeGreaterThan(0);
  });
});
