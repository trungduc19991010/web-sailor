import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthenticationService } from '../guards/authentication.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    private isRefreshing = false;
    private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    
    constructor(private authenticationService: AuthenticationService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // add authorization header with jwt token if available
        const token = this.authenticationService.getToken();
        if (this.authenticationService.isAuthenticated() && token) {
            request = this.addTokenHeader(request, token);
        }

        return next.handle(request).pipe(
            catchError(error => {
                if (error instanceof HttpErrorResponse && !request.url.includes('/Account/authentication') && error.status === 401) {
                    return this.handle401Error(request, next);
                }
                return throwError(() => error);
            })
        );
    }

    private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
        return request.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            const refreshToken = this.authenticationService.cookieService.get('r-token');
            
            if (refreshToken) {
                return this.authenticationService.refreshToken().pipe(
                    switchMap((token: any) => {
                        this.isRefreshing = false;
                        this.refreshTokenSubject.next(token.data?.token);
                        return next.handle(this.addTokenHeader(request, token.data?.token));
                    }),
                    catchError((err) => {
                        this.isRefreshing = false;
                        this.authenticationService.logout();
                        return throwError(() => err);
                    })
                );
            } else {
                this.isRefreshing = false;
                // Không logout nếu user chưa bao giờ đăng nhập
                // Chỉ return lỗi 401 để component tự xử lý
                return throwError(() => new HttpErrorResponse({
                  status: 401,
                  statusText: 'Unauthorized',
                  error: { message: 'Bạn cần đăng nhập để truy cập tính năng này' }
                }));
            }
        } else {
            return this.refreshTokenSubject.pipe(
                filter(token => token !== null),
                take(1),
                switchMap((token) => next.handle(this.addTokenHeader(request, token)))
            );
        }
    }
}

