import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ToastService } from '../../core/services/toast.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.scss']
})
export class ChangePasswordDialogComponent implements OnInit {
  changePasswordForm: FormGroup;
  isSubmitting = false;
  hideOldPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private toast: ToastService
  ) {
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Component initialization
  }

  /**
   * Custom validator để kiểm tra mật khẩu mới và xác nhận có khớp không
   */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    if (confirmPassword.value === '') {
      return null;
    }

    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  /**
   * Xử lý submit form đổi mật khẩu
   */
  onSubmit(): void {
    if (this.changePasswordForm.valid) {
      this.isSubmitting = true;
      const formData = {
        oldPassword: this.changePasswordForm.value.oldPassword,
        newPassword: this.changePasswordForm.value.newPassword
      };

      this.userService.changePassword(formData).subscribe({
        next: (response) => {
          if (response.result === 1) {
            this.toast.success('Đổi mật khẩu thành công!');
            setTimeout(() => {
              this.dialogRef.close({ success: true });
            }, 1500);
          } else {
            this.toast.error(response.description || 'Có lỗi xảy ra khi đổi mật khẩu');
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Lỗi khi đổi mật khẩu:', error);
          this.toast.error('Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.');
          this.isSubmitting = false;
        }
      });
    } else {
      // Đánh dấu tất cả các field là touched để hiển thị lỗi validation
      Object.keys(this.changePasswordForm.controls).forEach(key => {
        this.changePasswordForm.get(key)?.markAsTouched();
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
    const field = this.changePasswordForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return 'Trường này là bắt buộc';
    }
    
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Mật khẩu phải có ít nhất ${minLength} ký tự`;
    }
    
    if (field?.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength'].requiredLength;
      return `Mật khẩu không được vượt quá ${maxLength} ký tự`;
    }
    
    if (fieldName === 'confirmPassword' && this.changePasswordForm.hasError('passwordMismatch')) {
      return 'Mật khẩu xác nhận không khớp';
    }
    
    return '';
  }

  /**
   * Kiểm tra field có lỗi không
   */
  hasError(fieldName: string): boolean {
    const field = this.changePasswordForm.get(fieldName);
    
    if (fieldName === 'confirmPassword') {
      return !!(field?.invalid && field?.touched) || 
             !!(this.changePasswordForm.hasError('passwordMismatch') && field?.touched);
    }
    
    return !!(field?.invalid && field?.touched);
  }

  /**
   * Toggle visibility của old password
   */
  toggleOldPasswordVisibility(): void {
    this.hideOldPassword = !this.hideOldPassword;
  }

  /**
   * Toggle visibility của new password
   */
  toggleNewPasswordVisibility(): void {
    this.hideNewPassword = !this.hideNewPassword;
  }

  /**
   * Toggle visibility của confirm password
   */
  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
}
