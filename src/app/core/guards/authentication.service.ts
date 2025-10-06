import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable, PLATFORM_ID, Inject} from '@angular/core';
import {Router} from '@angular/router';
import {JwtHelperService} from "@auth0/angular-jwt";
import {BehaviorSubject, Observable, of} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {UserToken} from '../models/user-token';
import {environment} from "../../../environments/environment";
import {CookieService} from 'ngx-cookie-service';
import {ResponseApi} from '../models/response-api';
import {UserInfo} from '../models/user-info';
import {NgxPermissionsService} from 'ngx-permissions';
import {CurrencyPipe, DatePipe, isPlatformBrowser} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})

export class AuthenticationService {

  private userSubject!: BehaviorSubject<UserToken>;
  public user!: Observable<UserToken>;
  private refreshTokenTimeout: any;
  public permissions: string[] = [];
  public currentUser: UserToken = new UserToken();

  public ipAddress = '';

  constructor(
    public jwtHelper: JwtHelperService,
    private permissionsService: NgxPermissionsService,
    public router: Router,
    private http: HttpClient,
    public currencyPipe: CurrencyPipe,
    public datePipe: DatePipe,
    public dialog: MatDialog,
    public cookieService: CookieService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.userSubject = new BehaviorSubject<UserToken>(new UserToken());
    this.user = this.userSubject.asObservable();
    // this.loadOldPermission();
  }

  public getToken() {
    // return sessionStorage.getItem('a-token');
    return this.cookieService.get('a-token');
  }

  public getPermissions() {
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem('permissions');
    }
    return null;
  }

  public convertObjectToString = (object: any) => JSON.stringify(object);

  public isAuthenticated(): boolean {
    const token = this.getToken();

    if (!token || token === null || token === '' || token === undefined) {
      return false;
    }
    
    try {
      const isExpired = this.jwtHelper.isTokenExpired(token.toString());
      return !isExpired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return false;
    }
  }


  public get userTokenValue(): UserToken {
    return this.userSubject.value;
  }

  public convertStringToObject = (str: string) => JSON.parse(str);

  login = (username: string, password: string, hasRemember: boolean) => this.http.post<ResponseApi<UserToken>>(`${environment.services_domain}/Account/authentication`, {
    username,
    password
  }, {withCredentials: true})
    .pipe(
      switchMap((loginResponse: ResponseApi<UserToken>) => {
        // Step 1: Process login response and save the token immediately
        const userToken = loginResponse.data;
        userToken.userName = username;

        // Save tokens to cookies so the interceptor can use them
        this.saveTokens(userToken);

        // Step 2: Now call getUserInformation, the interceptor will find the token
        return this.getUserInformation().pipe(
          map(userInfoResponse => {
            if (userInfoResponse.result === 1) {
              userToken.userInfo = userInfoResponse.data;
            }
            return userToken; // Pass the enriched userToken down the stream
          })
        );
      }),
      map((userTokenWithInfo: UserToken) => {
        // Step 3: Set the final user object and finish the login process
        if (hasRemember && isPlatformBrowser(this.platformId)) {
          localStorage.setItem('remember_user_name', userTokenWithInfo.userName);
        }

        this.finalizeUserAuthentication(userTokenWithInfo);
        return this.currentUser;
      })
    );

  otpAuthen = (username: string, otp: string) => this.http.post<UserToken>(`${environment.services_domain}/user/authentication/otp`, {
    userName: username,
    otpCode: otp
  }, {withCredentials: true})
    .pipe(map((user: UserToken) => {
      // Save tokens and complete authentication
      this.saveTokens(user);
      this.finalizeUserAuthentication(user);
      return user;
    }));


  logout() {
    let refToken = this.cookieService.get('r-token');

    if (refToken) {
      this.http.post<any>(`${environment.services_domain}/Account/revoke`, {refreshToken: refToken}).subscribe();
    }
    
    this.stopRefreshTokenTimer();
    this.clearSession(true); // Navigate to login after logout
  }

  refreshToken() {
    const cookie = this.cookieService.get('r-token');
    return this.http.post<ResponseApi<UserToken>>(`${environment.services_domain}/Account/refresh-token`, {refreshToken: cookie}, {withCredentials: true})
      .pipe(
        switchMap((user: ResponseApi<UserToken>) => {
          this.currentUser = user?.data;
          
          // Clear old session data
          this.cookieService.deleteAll();
          if (isPlatformBrowser(this.platformId)) {
            sessionStorage.clear();
          }
          
          // Save new tokens
          this.saveTokens(this.currentUser);
          
          // Restore company ID to session
          if (isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem('companyId', this.currentUser.company?.id);
          }
          
          // Load permissions
          this.loadPermissionsFromUser(this.currentUser);

          // Gọi getUserInformation để lấy thông tin user mới nhất
          return this.getUserInformation().pipe(
            map(userInfoResponse => {
              if (userInfoResponse.result === 1) {
                this.currentUser.userInfo = userInfoResponse.data;
              }
              this.userSubject.next(this.currentUser);
              this.startRefreshTokenTimer();
              return user;
            }),
            catchError(userInfoError => {
              console.error('Lỗi khi lấy thông tin user:', userInfoError);
              // Vẫn tiếp tục với user data hiện tại nếu không lấy được user info
              this.userSubject.next(this.currentUser);
              this.startRefreshTokenTimer();
              return of(user);
            })
          );
        }),
        catchError(err => {
          this.clearSession(); // Don't navigate, let the caller decide
          return of('error', err);
        })
      );
  }


  refreshTokenAsync = () => new Promise<UserToken>((resolve) => {
    const cookie = this.cookieService.get('r-token');
    this.http.post<ResponseApi<UserToken>>(`${environment.services_domain}/Account/refresh-token`, {refreshToken: cookie}, {withCredentials: true}).subscribe({
      next: (user: ResponseApi<UserToken>) => {
        // Clear old session data
        this.cookieService.deleteAll();
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.clear();
        }
        
        if (user?.data == null) {
          this.logout();
          return;
        }
        
        const userData = user.data;
        
        // Save new tokens
        this.saveTokens(userData);
        
        // Restore company ID to session
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.setItem('companyId', userData.company?.id);
        }
        
        // Load permissions
        this.loadPermissionsFromUser(userData);

        // Gọi getUserInformation để lấy thông tin user mới nhất
        this.getUserInformation().subscribe({
          next: (userInfoResponse) => {
            if (userInfoResponse.result === 1) {
              userData.userInfo = userInfoResponse.data;
              this.currentUser = userData;
            }
            this.userSubject.next(userData);
            this.startRefreshTokenTimer();
            resolve(userData);
          },
          error: (error) => {
            console.error('Lỗi khi lấy thông tin user:', error);
            // Vẫn tiếp tục với user data hiện tại nếu không lấy được user info
            this.userSubject.next(userData);
            this.startRefreshTokenTimer();
            resolve(userData);
          }
        });
      },
      error: _error => {
        this.clearSession();
        resolve(new UserToken());
      }
    });
  });


  async startApp() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async (resolve) => {
      if (this.isAuthenticated()) {
        try {
          const token = await this.refreshTokenAsync();
          if ('' === token.token || null === token.token) {
            this.clearSession();
          }
        } catch (error) {
          this.clearSession();
        }
      } else {
        // Không clear session nếu chưa có token, chỉ đảm bảo state sạch
        this.userSubject.next(new UserToken());
      }
      resolve();
    });
  }

  private clearSession(shouldNavigateToLogin: boolean = false) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
      sessionStorage.clear();
    }
    this.cookieService.deleteAll();
    this.userSubject.next(new UserToken());
    
    if (shouldNavigateToLogin) {
      this.router.navigateByUrl('/login');
    }
  }

  getUserInformation = () => this.http.get<ResponseApi<UserInfo>>(`${environment.services_domain}/user/user-info`, {withCredentials: true});

  // helper methods

  getIpAddress = () => {
    const headers = new HttpHeaders()
      .set('content-type', 'application/json')
      .set('Access-Control-Allow-Origin', '*');

    return this.http.get("https://api.ipify.org/?format=json", {headers: headers}).pipe(map((ip: any) => {
      return ip;
    }));
  }


  /**
   * Save authentication tokens to cookies
   */
  private saveTokens(userToken: UserToken): void {
    const cookieOptions = {
      expires: new Date(userToken.tokenExpiration),
      path: '/',
      secure: false // TODO: Set to true in production with HTTPS
    };

    this.cookieService.set('a-token', userToken.token, cookieOptions);
    this.cookieService.set('r-token', userToken.refreshToken, cookieOptions);
  }

  /**
   * Load user permissions and save to session storage
   */
  private loadPermissionsFromUser(userToken: UserToken): void {
    let permissions = userToken.permissions;
    permissions = Array.isArray(permissions) ? permissions : [permissions];
    this.permissions = permissions;

    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('permissions', this.convertObjectToString(userToken.permissions));
      sessionStorage.setItem('companyId', userToken.company?.id);
    }

    this.permissionsService.loadPermissions(permissions);
  }

  /**
   * Complete user setup after successful authentication
   */
  private finalizeUserAuthentication(userToken: UserToken): void {
    this.currentUser = userToken;
    this.loadPermissionsFromUser(userToken);
    this.userSubject.next(this.currentUser);
    this.startRefreshTokenTimer();
  }

  private startRefreshTokenTimer() {
    // parse json object from base64 encoded jwt token
    const jwtToken = JSON.parse(atob(this.userTokenValue.token.split('.')[1]));

    // set a timeout to refresh the token a minute before it expires
    const expires = new Date(jwtToken.exp * 1000);
    const timeout = expires.getTime() - Date.now() - 30000;
    this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
  }

  private stopRefreshTokenTimer() {
    clearTimeout(this.refreshTokenTimeout);
  }

}

