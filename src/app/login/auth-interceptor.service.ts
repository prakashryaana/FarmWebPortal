import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthTokenService } from './auth-token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthTokenService);
  const token = auth.token;

  if (!token) return next(req);

  const cloned = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });

  return next(cloned);
};
