import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = '/api/auth';

  constructor(private http: HttpClient) {}

  sendOtp(mobile: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/send-otp`, { mobile });
  }

  verifyOtp(mobile: string, otp: string) {
    return this.http.post<{ token: string; userId: string; mobile: string }>(
      `${this.baseUrl}/verify-otp`,
      { mobile, otp }
    ).pipe(
      tap(res => {
        localStorage.setItem('authToken', res.token);
        localStorage.setItem('userId', res.userId);
        localStorage.setItem('mobile', res.mobile);
      })
    );
  }

  get token(): string | null {
    return localStorage.getItem('authToken');
  }

  logout() {
    localStorage.clear();
  }
}
