import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { CookieService } from 'ngx-cookie-service';
import { NgxPermissionsModule } from 'ngx-permissions';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';
import { AuthenticationService } from './core/guards/authentication.service';

// Factory function cho APP_INITIALIZER
export function initializeApp(authService: AuthenticationService) {
  return () => authService.startApp();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    importProvidersFrom(NgxPermissionsModule.forRoot()),
    { provide: JWT_OPTIONS, useValue: JWT_OPTIONS },
    JwtHelperService,
    CookieService,
    CurrencyPipe,
    DatePipe,
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthenticationService],
      multi: true
    }
  ]
};
