import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  token: string;
  userId: string;
  mobile: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.baseApiUrl}api/auth`;
  //private baseUrl = '/api/auth';

  constructor(private http: HttpClient) {}

  registerWithPassword(
    mobile: string,
    password: string,
    email?: string,
    asOwner = true,
    ownerId?: string
  ) {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/register-with-password`,
      { mobile, password, email, asOwner, ownerId }
    ).pipe(
      tap(res => {
        // localStorage.setItem('authToken', res.token);
        // localStorage.setItem('userId', res.userId);
        // localStorage.setItem('mobile', res.mobile);
      })
    );
  }

  loginWithPassword(mobile: string, password: string) {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/login-with-password`,
      { mobile, password }
    ).pipe(
      tap(res => {
        localStorage.setItem('authToken', res.token);
        localStorage.setItem('userId', res.userId);
        localStorage.setItem('mobile', res.mobile);
      })
    );
  }

  register(mobile: string, email?: string, asOwner = true, ownerId?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, {
      mobile,
      email,
      asOwner,
      ownerId
    }).pipe(
      tap(res => {
        localStorage.setItem('authToken', res.token);
        localStorage.setItem('userId', res.userId);
        localStorage.setItem('mobile', res.mobile);
      })
    );
  }

  requestMagicLink(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/magic/request`, { email });
  }

  validateMagicLink(token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/magic/validate`, { token }).pipe(
      tap(res => {
        localStorage.setItem('authToken', res.token);
        localStorage.setItem('userId', res.userId);
        localStorage.setItem('mobile', res.mobile);
      })
    );
  }
}
