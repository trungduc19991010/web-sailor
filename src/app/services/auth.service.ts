import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Kiểm tra localStorage để duy trì trạng thái đăng nhập (chỉ trong browser)
    if (isPlatformBrowser(this.platformId)) {
      this.checkStoredAuth();
    }
  }

  private checkStoredAuth(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('auth_token');
      const user = localStorage.getItem('current_user');

      if (token && user) {
        this.isLoggedInSubject.next(true);
        this.currentUserSubject.next(JSON.parse(user));
      }
    }
  }

  // Phương thức đăng nhập (sẽ thay thế bằng API call thực tế)
  login(loginData: LoginRequest): Observable<any> {
    // Giả lập API call
    return new Observable(observer => {
      setTimeout(() => {
        // Giả lập response từ server
        const mockUser: User = {
          id: '1',
          email: loginData.email,
          name: 'Người dùng',
          avatar: 'https://via.placeholder.com/40'
        };

        const mockToken = 'mock_jwt_token_' + Date.now();

        // Lưu vào localStorage nếu remember me (chỉ trong browser)
        if (loginData.rememberMe && isPlatformBrowser(this.platformId)) {
          localStorage.setItem('auth_token', mockToken);
          localStorage.setItem('current_user', JSON.stringify(mockUser));
        }

        // Cập nhật state
        this.isLoggedInSubject.next(true);
        this.currentUserSubject.next(mockUser);

        observer.next({ success: true, user: mockUser, token: mockToken });
        observer.complete();
      }, 1500);
    });
  }

  // Phương thức đăng xuất
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
    }
    this.isLoggedInSubject.next(false);
    this.currentUserSubject.next(null);
  }

  // Getter cho trạng thái đăng nhập hiện tại
  get isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  // Getter cho user hiện tại
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Phương thức để set trạng thái đăng nhập (dùng tạm)
  setLoginStatus(status: boolean): void {
    this.isLoggedInSubject.next(status);
  }

  // Phương thức kiểm tra token hợp lệ (sẽ implement sau)
  isTokenValid(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('auth_token');
      // TODO: Implement token validation logic
      return !!token;
    }
    return false;
  }
}
