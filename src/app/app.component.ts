import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { LoginDialogComponent } from './components/login-dialog/login-dialog.component';
import { UserProfileDialogComponent } from './components/user-profile-dialog/user-profile-dialog.component';
import { ChangePasswordDialogComponent } from './components/change-password-dialog/change-password-dialog.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { AuthenticationService } from './core/guards/authentication.service';
import { UserToken } from './core/models/user-token';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatMenuModule,
    MatDividerModule,
    CommonModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    ToastContainerComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'VOSCO EDU - Sailor Web App';
  currentUser: UserToken | null = null;
  private subscriptions = new Subscription();
  
  // Observable for template - khởi tạo trong constructor
  isLoggedIn$!: Observable<boolean>;

  // Mobile menu state
  mobileMenuOpen = false;
  isMobile = false;

  constructor(
    private dialog: MatDialog,
    public authenticationService: AuthenticationService,
    private toast: ToastService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Khởi tạo isLoggedIn$ observable sau khi authenticationService đã được inject
    this.isLoggedIn$ = this.authenticationService.user.pipe(
      map(user => {
        // Kiểm tra token có tồn tại và không rỗng
        if (!user || !user.token || user.token.trim() === '') {
          return false;
        }
        // Kiểm tra token chưa hết hạn
        try {
          return !this.authenticationService.jwtHelper.isTokenExpired(user.token);
        } catch (error) {
          console.error('Error checking token expiration:', error);
          return false;
        }
      })
    );
  }

  ngOnInit(): void {
    // Subscribe để cập nhật currentUser cho hiển thị tên
    this.subscriptions.add(
      this.authenticationService.user.subscribe(user => {
        this.currentUser = user;
        console.log('User updated:', {
          hasUser: !!user,
          hasToken: !!user?.token,
          token: user?.token?.substring(0, 20) + '...',
          userName: user?.userName
        });
      })
    );

    // Debug isLoggedIn$ observable
    this.subscriptions.add(
      this.isLoggedIn$.subscribe(isLoggedIn => {
        console.log('isLoggedIn$ emitted:', isLoggedIn);
      })
    );

    // Check if mobile on init
    this.checkIfMobile();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  openLoginDialog(): void {
    const dialogRef = this.dialog.open(LoginDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
      panelClass: 'login-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success && result.user) {
        // Authentication service sẽ tự động cập nhật state qua observable
        // Không cần manually set state ở đây
      }
    });
  }

  openUserProfileDialog(): void {
    this.dialog.open(UserProfileDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
      panelClass: 'user-profile-dialog-container'
    });
  }

  /**
   * Mở dialog thay đổi mật khẩu
   */
  openChangePasswordDialog(): void {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
      panelClass: 'change-password-dialog-container'
    });
  }

  logout(): void {
    this.authenticationService.logout();
    this.toast.success('Đã đăng xuất thành công!', 3000);
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  /**
   * Open mobile menu overlay
   */
  openMobileMenu(event: Event): void {
    event.preventDefault();
    this.mobileMenuOpen = true;
  }

  /**
   * Close mobile menu overlay
   */
  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  /**
   * Check if device is mobile
   */
  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkIfMobile();
  }

  private checkIfMobile(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth <= 768;
    } else {
      this.isMobile = false; // Default to false on server
    }
  }
}
