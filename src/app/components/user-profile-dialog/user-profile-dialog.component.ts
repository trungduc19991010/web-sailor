import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '../../core/services/toast.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../core/services/user.service';
import { AuthenticationService } from '../../core/guards/authentication.service';

@Component({
  selector: 'app-user-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user-profile-dialog.component.html',
  styleUrls: ['./user-profile-dialog.component.scss']
})
export class UserProfileDialogComponent implements OnInit {
  profileForm: FormGroup;
  isLoading = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthenticationService,
    private dialogRef: MatDialogRef<UserProfileDialogComponent>,
    private toast: ToastService
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadUserInfo();
  }

  /**
   * Load thông tin người dùng từ API
   */
  loadUserInfo(): void {
    this.isLoading = true;
    this.userService.getUserInfo().subscribe({
      next: (response) => {
        if (response.result === 1 && response.data) {
          this.profileForm.patchValue({
            fullName: response.data.fullName || '',
            email: response.data.email || '',
            description: response.data.description || ''
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Lỗi khi tải thông tin người dùng:', error);
        this.toast.error('Không thể tải thông tin người dùng');
        this.isLoading = false;
      }
    });
  }

  /**
   * Xử lý submit form cập nhật thông tin
   */
  onSubmit(): void {
    if (this.profileForm.valid) {
      this.isSubmitting = true;
      const formData = this.profileForm.value;

      this.userService.updateUserInfo(formData).subscribe({
        next: (response) => {
          if (response.result === 1) {
            this.toast.success('Cập nhật thông tin thành công!');

            // Refresh lại user info trong authentication service
            this.authService.getUserInformation().subscribe({
              next: (userInfoResponse) => {
                if (userInfoResponse.result === 1) {
                  const currentUser = this.authService.userTokenValue;
                  if (currentUser) {
                    currentUser.userInfo = userInfoResponse.data;
                    // Trigger update cho subscribers
                    this.authService['userSubject'].next(currentUser);
                  }
                }
              }
            });

            // Đóng dialog sau khi cập nhật thành công
            setTimeout(() => {
              this.dialogRef.close({ success: true });
            }, 1500);
          } else {
            this.toast.error(response.description || 'Có lỗi xảy ra khi cập nhật');
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Lỗi khi cập nhật thông tin:', error);
          this.toast.error('Không thể cập nhật thông tin');
          this.isSubmitting = false;
        }
      });
    } else {
      // Đánh dấu tất cả các field là touched để hiển thị lỗi validation
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Đóng dialog
   */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Kiểm tra lỗi validation của field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Trường này là bắt buộc';
    }
    if (field?.hasError('email')) {
      return 'Email không hợp lệ';
    }
    if (field?.hasError('minlength')) {
      return `Tối thiểu ${field.errors?.['minlength'].requiredLength} ký tự`;
    }
    return '';
  }

  /**
   * Kiểm tra field có lỗi không
   */
  hasError(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }
}
