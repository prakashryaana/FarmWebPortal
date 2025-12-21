import { CanActivateFn, Router } from '@angular/router';
import { AuthTokenService } from './auth/auth-token.service';
import { inject } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { take, map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
console.log('[GUARD] Protecting route:', state.url);
  
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.validate().pipe(
    map(isValid => {
      if (isValid) {
        console.log('[GUARD] Access GRANTED');
        return true;
      }
      console.log('[GUARD] Access DENIED → Redirect to login');
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }),
    catchError(() => {
      console.log('[GUARD] Error → Redirect to login');
      return of(router.createUrlTree(['/login']));
    })
  );
};
//   const authService = inject(AuthService);
//   const router = inject(Router);
  
//   return authService.validate().pipe(
//     take(1),
//     map(isValid => {
//       if (isValid) return true;
//       return router.createUrlTree(['/login']);
//     }),
//     catchError(() => of(router.createUrlTree(['/login'])))
//   );
// };
