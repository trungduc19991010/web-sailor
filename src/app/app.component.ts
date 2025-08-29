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
import { Subscription } from 'rxjs';

import { LoginDialogComponent } from './components/login-dialog/login-dialog.component';
import { AuthenticationService } from './core/guards/authentication.service';
import { UserToken } from './core/models/user-token';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'VOSCO EDU - Sailor Web App';
  isLoggedIn = false;
  currentUser: UserToken | null = null;
  private subscriptions = new Subscription();

  // Mobile menu state
  mobileMenuOpen = false;
  isMobile = false;

  constructor(
    private dialog: MatDialog,
    public authenticationService: AuthenticationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication state
    this.subscriptions.add(
      this.authenticationService.user.subscribe(user => {
        this.isLoggedIn = this.authenticationService.isAuthenticated();
        this.currentUser = user;
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
        this.isLoggedIn = true;
        this.currentUser = result.user;
      }
    });
  }

  logout(): void {
    this.authenticationService.logout();
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
