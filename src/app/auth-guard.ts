import { CanActivateFn, Router } from '@angular/router';
import { AuthTokenService } from './login/auth-token.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthTokenService);
  const router = inject(Router);
  if (authService.isLoggedIn) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
