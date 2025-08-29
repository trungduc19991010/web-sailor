import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Import services và interfaces
import { Course } from '../services/course.service';
import { AuthService } from '../../../services/auth.service';

export interface CourseEnrollmentData {
  course: Course;
  isLoggedIn: boolean;
  currentUser?: any;
}

export interface EnrollmentFormData {
  fullName: string;
  phoneNumber: string;
  idNumber: string;
  dateOfBirth: Date;
  address: string;
  email: string;
}

@Component({
  selector: 'app-course-enrollment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './course-enrollment.component.html',
  styleUrl: './course-enrollment.component.scss'
})
export class CourseEnrollmentComponent implements OnInit {
  enrollmentForm: FormGroup;
  loading = false;
  course: Course;
  isLoggedIn: boolean;
  currentUser: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CourseEnrollmentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CourseEnrollmentData
  ) {
    this.course = data.course;
    this.isLoggedIn = data.isLoggedIn;
    this.currentUser = data.currentUser;

    // Initialize form
    this.enrollmentForm = this.createForm();
  }

  ngOnInit(): void {
    // Pre-fill form if user is logged in
    if (this.isLoggedIn && this.currentUser) {
      this.prefillUserData();
    }
  }

  /**
   * Create enrollment form
   */
  private createForm(): FormGroup {
    return this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      idNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{9,12}$/)]],
      dateOfBirth: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Pre-fill form with user data if logged in
   */
  private prefillUserData(): void {
    if (this.currentUser) {
      this.enrollmentForm.patchValue({
        fullName: this.currentUser.name || '',
        email: this.currentUser.email || '',
        phoneNumber: this.currentUser.phoneNumber || '',
        idNumber: this.currentUser.idNumber || '',
        dateOfBirth: this.currentUser.dateOfBirth || '',
        address: this.currentUser.address || ''
      });
    }
  }

  /**
   * Get form control error message
   */
  getErrorMessage(controlName: string): string {
    const control = this.enrollmentForm.get(controlName);
    if (!control || !control.errors) return '';

    const errors = control.errors;

    if (errors['required']) {
      return 'Trường này là bắt buộc';
    }

    if (errors['email']) {
      return 'Email không hợp lệ';
    }

    if (errors['pattern']) {
      switch (controlName) {
        case 'phoneNumber':
          return 'Số điện thoại phải có 10-11 chữ số';
        case 'idNumber':
          return 'CCCD/CMND phải có 9-12 chữ số';
        default:
          return 'Định dạng không hợp lệ';
      }
    }

    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      switch (controlName) {
        case 'fullName':
          return `Họ tên phải có ít nhất ${requiredLength} ký tự`;
        case 'address':
          return `Địa chỉ phải có ít nhất ${requiredLength} ký tự`;
        default:
          return `Phải có ít nhất ${requiredLength} ký tự`;
      }
    }

    return 'Dữ liệu không hợp lệ';
  }

  /**
   * Check if form control has error
   */
  hasError(controlName: string): boolean {
    const control = this.enrollmentForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Format price display
   */
  formatPrice(price: number): string {
    if (price === 0) {
      return 'Miễn phí';
    }
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  /**
   * Submit enrollment
   */
  onSubmit(): void {
    if (this.enrollmentForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.enrollmentForm.controls).forEach(key => {
        this.enrollmentForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const formData: EnrollmentFormData = this.enrollmentForm.value;

    // Simulate API call
    setTimeout(() => {
      this.loading = false;
      
      // Show success message
      this.showSuccessMessage('Đăng ký khóa học thành công!');
      
      // Close dialog with success result
      this.dialogRef.close({
        success: true,
        data: formData
      });
    }, 2000);
  }

  /**
   * Cancel enrollment
   */
  onCancel(): void {
    this.dialogRef.close({
      success: false
    });
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Đóng', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Đóng', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Validate date of birth
   */
  validateDateOfBirth(): boolean {
    const dateOfBirth = this.enrollmentForm.get('dateOfBirth')?.value;
    if (!dateOfBirth) return false;

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    
    // Check if user is at least 16 years old
    if (age < 16) {
      this.enrollmentForm.get('dateOfBirth')?.setErrors({ 'minAge': true });
      return false;
    }

    // Check if date is not in the future
    if (birthDate > today) {
      this.enrollmentForm.get('dateOfBirth')?.setErrors({ 'futureDate': true });
      return false;
    }

    return true;
  }

  /**
   * Get date of birth error message
   */
  getDateOfBirthErrorMessage(): string {
    const control = this.enrollmentForm.get('dateOfBirth');
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return 'Ngày sinh là bắt buộc';
    }

    if (control.errors['minAge']) {
      return 'Bạn phải đủ 16 tuổi để đăng ký';
    }

    if (control.errors['futureDate']) {
      return 'Ngày sinh không thể là ngày trong tương lai';
    }

    return 'Ngày sinh không hợp lệ';
  }

  /**
   * Format duration display
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} phút`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} giờ`;
    }
    
    return `${hours} giờ ${remainingMinutes} phút`;
  }
}
