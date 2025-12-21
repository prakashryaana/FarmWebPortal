// src/app/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[] | undefined;
  if (!requiredRoles || requiredRoles.length === 0) {
    return of(true);
  }

  const current = (auth as any)._currentUser$.value as any | null; // or expose a getter
  const ensureUser$ = current ? of(current) : auth.loadCurrentUser();

  return ensureUser$.pipe(
    map(user => {
      if (user && auth.hasRole(requiredRoles)) {
        return true;
      }
      return router.createUrlTree(['/unauthorized']);
    })
  );
};
