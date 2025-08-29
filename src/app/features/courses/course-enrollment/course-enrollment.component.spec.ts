import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CourseEnrollmentComponent, CourseEnrollmentData } from './course-enrollment.component';
import { AuthService } from '../../../services/auth.service';
import { CourseLevel, CourseStatus } from '../services/course.service';

describe('CourseEnrollmentComponent', () => {
  let component: CourseEnrollmentComponent;
  let fixture: ComponentFixture<CourseEnrollmentComponent>;
  let mockDialogRef: any;
  let mockAuthService: any;
  let mockSnackBar: any;

  const mockCourse = {
    id: 1,
    title: 'Test Course',
    description: 'Test Description',
    category: 'Test Category',
    instructor: 'Test Instructor',
    duration: 120,
    level: CourseLevel.BEGINNER,
    status: CourseStatus.PUBLISHED,
    price: 0
  };

  const mockData: CourseEnrollmentData = {
    course: mockCourse,
    isLoggedIn: false,
    currentUser: null
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: jasmine.createSpy('close')
    };

    mockAuthService = {
      isLoggedIn$: jasmine.createSpy('isLoggedIn$'),
      currentUser$: jasmine.createSpy('currentUser$')
    };

    mockSnackBar = {
      open: jasmine.createSpy('open')
    };

    await TestBed.configureTestingModule({
      imports: [
        CourseEnrollmentComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CourseEnrollmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values when not logged in', () => {
    expect(component.enrollmentForm.get('fullName')?.value).toBe('');
    expect(component.enrollmentForm.get('email')?.value).toBe('');
  });

  it('should validate required fields', () => {
    const form = component.enrollmentForm;
    
    expect(form.get('fullName')?.hasError('required')).toBe(true);
    expect(form.get('email')?.hasError('required')).toBe(true);
    expect(form.get('phoneNumber')?.hasError('required')).toBe(true);
  });

  it('should validate email format', () => {
    const emailControl = component.enrollmentForm.get('email');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBe(true);
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBe(false);
  });

  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ success: false });
  });
});
