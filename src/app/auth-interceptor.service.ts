import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthTokenService } from './auth/auth-token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // console.log('🚀 INTERCEPTOR:', req.method, req.url);
  // console.log('   withCredentials:', req.withCredentials); // MUST be true
  
  const newReq = req.clone({
    withCredentials: true  // CRITICAL
  });
  
  //console.log('   AFTER clone - withCredentials:', newReq.withCredentials);
  return next(newReq);
};