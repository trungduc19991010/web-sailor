import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../../core/guards/authentication.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { first } from 'rxjs';

@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './login-dialog.component.html',
  styleUrl: './login-dialog.component.scss'
})
export class LoginDialogComponent implements OnInit {
  loginForm!: FormGroup;
  hidePassword = true;
  isLoading = false;
  hasRememberUser = false;

  constructor(
    private fb: FormBuilder,
    private authenticationService: AuthenticationService,
    private dialogRef: MatDialogRef<LoginDialogComponent>,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.hasRememberUser = localStorage.getItem('remember-user') === 'true';

    let rememberUserName = '';
    if (this.hasRememberUser) {
      rememberUserName = localStorage.getItem('remember_user_name')?.toString() ?? '';
    }

    this.loginForm = this.fb.group({
      username: [rememberUserName, [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [this.hasRememberUser]
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.snackBar.open('Vui lòng nhập tên đăng nhập và mật khẩu', 'Đóng', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const { username, password, rememberMe } = this.loginForm.value;
    this.hasRememberUser = rememberMe;

    // Lưu trạng thái remember user
    localStorage.setItem('remember-user', this.hasRememberUser.toString());

    this.authenticationService.login(username, password, this.hasRememberUser)
      .pipe(first())
      .subscribe({
        next: (user) => {
          this.isLoading = false;
          this.snackBar.open('Đăng nhập thành công!', 'Đóng', { duration: 3000 });
          this.dialogRef.close({ success: true, user: user });
        },
        error: (error) => {
          this.isLoading = false;
          console.error(error);
          const message = error?.error?.description || 'Tên đăng nhập hoặc mật khẩu không chính xác';
          this.snackBar.open(message, 'Đóng', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }


}
