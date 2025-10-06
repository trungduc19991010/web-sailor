import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { CourseDetailComponent } from './course-detail.component';
import { CourseService } from '../services/course.service';
import { AuthenticationService } from '../../../core/guards/authentication.service';

describe('CourseDetailComponent', () => {
  let component: CourseDetailComponent;
  let fixture: ComponentFixture<CourseDetailComponent>;
  let mockActivatedRoute: any;
  let mockRouter: any;
  let mockCourseService: any;
  let mockAuthenticationService: any;
  let mockDialog: any;
  let mockSnackBar: any;

  beforeEach(async () => {
    mockActivatedRoute = {
      params: of({ id: '1' })
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    mockCourseService = {
      getCourseById: jasmine.createSpy('getCourseById').and.returnValue(of({
        id: 1,
        title: 'Test Course',
        description: 'Test Description',
        category: 'Test Category',
        instructor: 'Test Instructor',
        duration: 120,
        level: 'BEGINNER',
        status: 'PUBLISHED',
        price: 0
      }))
    };

    mockAuthenticationService = {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
      user: of(null),
      userTokenValue: null
    };

    mockDialog = {
      open: jasmine.createSpy('open').and.returnValue({
        afterClosed: () => of(false)
      })
    };

    mockSnackBar = {
      open: jasmine.createSpy('open')
    };

    await TestBed.configureTestingModule({
      imports: [
        CourseDetailComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: CourseService, useValue: mockCourseService },
        { provide: AuthenticationService, useValue: mockAuthenticationService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CourseDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load course on init', () => {
    expect(mockCourseService.getCourseById).toHaveBeenCalledWith(1);
    expect(component.course).toBeTruthy();
  });

  it('should check if user can access content', () => {
    component.isLoggedIn = true;
    component.course = { status: 'PUBLISHED' } as any;
    expect(component.canAccessContent()).toBe(true);

    component.isLoggedIn = false;
    expect(component.canAccessContent()).toBe(false);
  });
});
