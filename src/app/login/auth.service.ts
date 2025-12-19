import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface AuthResponse {
  token: string;
  userId: string;
  mobile: string;
}

export interface CurrentUser {
  userId: string;
  mobile: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.baseApiUrl}api/auth`;
  //private baseUrl = '/api/auth';
  private _currentUser: CurrentUser | null = null;

  // Auth state
  private _isAuthenticated$ = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this._isAuthenticated$.asObservable();

  // User + roles
  private readonly _currentUser$ = new BehaviorSubject<CurrentUser | null>(null);
  readonly currentUser$ = this._currentUser$.asObservable();

  constructor(private http: HttpClient, private router:Router) {}

  get currentUser() : CurrentUser | null  {
    return this._currentUser;
  }

  private setAuthenticated(value: boolean) {
    this._isAuthenticated$.next(value);
  }

  private setCurrentUser(user: CurrentUser | null) {
    this._currentUser$.next(user);
  }

  hasRole(required: string | string[]): boolean {
    const user = this._currentUser$.value;
    if (!user) return false;

    const roles = user.roles || [];
    const needed = Array.isArray(required) ? required : [required];
    return needed.some(r => roles.includes(r));
  }

  loadCurrentUser(): Observable<CurrentUser | null> {
    return this.http.get<CurrentUser>(`${this.baseUrl}/me`, {
      withCredentials: true
    }).pipe(
      tap(user => {
        this.setCurrentUser(user);
        this.setAuthenticated(!!user);
      }),
      catchError(() =>  {
        this.setCurrentUser(null);
        return of(null);
      })
    );
  }

  // call this after successful login/passkey login
  afterLogin(): Observable<void> {
    return this.loadCurrentUser().pipe(map(() => void 0));
  }

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

  // loginWithPassword(mobile: string, password: string) {
  //   return this.http.post<AuthResponse>(
  //     `${this.baseUrl}/login-with-password`,
  //     { mobile, password }
  //   ).pipe(
  //     tap(res => {
  //       localStorage.setItem('authToken', res.token);
  //       localStorage.setItem('userId', res.userId);
  //       localStorage.setItem('mobile', res.mobile);
  //     })
  //   );
  // }

   loginWithPassword(credentials: { mobile: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login-with-password`, credentials, {withCredentials:true}).pipe(
      //switchMap(() => this.loadCurrentUser()),     // hit /me, cache user
      //tap(user => this.setAuthenticated(!!user)),
      map(() => void 0),
      catchError(err => {
        console.error('Login failed', err);
        return of(null);
      })
    );
  }

  // validate(): Observable<boolean> {
  //   console.log('VALIDATE CALL withCredentials: true');
  
  //   return this.http.get<{ isValid: boolean }>(`${this.baseUrl}/validate`, {
  //     withCredentials: true
  //   }).pipe(
  //     map(res => {
  //       console.log('RAW RESPONSE:', res); // { isValid: true }
  //       return res.isValid; // ← Extract boolean
  //     }),
  //     tap(isValid => console.log('VALIDATE RESULT:', isValid)), // true/false
  //     catchError(err => {
  //       console.error('VALIDATE ERROR:', err);
  //       return of(false);
  //     })
  //   );
  // }

  // Called by guard or app init: sync cookie → Angular state
  validate(): Observable<boolean> {
    return this.http.get<{ isValid: boolean }>(`${this.baseUrl}/validate`, {
      withCredentials: true
    }).pipe(
      switchMap(res => {
        if (!res.isValid) {
          this.unSetUser();
          return of(false);
        }
        // Cookie valid → load full user with roles
        return this.loadCurrentUser().pipe(map(user => !!user));
      }),
      tap(isValid => this.setAuthenticated(isValid)),
      catchError(() => {
        this.unSetUser();
        return of(false);
      })
    );
  }

  private unSetUser() {
    this.setAuthenticated(false);
    this.setCurrentUser(null);
  }

  // validate(): Observable<boolean> {
  //   return this.http.get<{ isValid: boolean }>(`${this.baseUrl}/validate`).pipe(
  //     map(res => res.isValid),
  //     catchError(() => of(false))
  //   );
  // }

  // logout(): Observable<any> {
  //   return this.http.post(`${this.baseUrl}/logout`, {}).pipe(
  //     tap(() => this.router.navigate(['/login']))
  //   );
  // }

  // logout(): Observable<void> {
  //   return this.http.post(`${this.baseUrl}/logout`, {}, {
  //     withCredentials: true
  //   }).pipe(
  //     tap(() => {
  //       this.unSetUser();
  //       this.router.navigate(['/login']);
  //     }),
  //     map((e) => void 0),
  //     catchError((e) => {
  //       console.log(e);
  //       this.unSetUser();
  //       return of(false);
  //     })
  //   );
  // }

  logout(): void {
  // Always clear local state first
  this.unSetUser();
  this.router.navigate(['/login']);
  
  // Fire API call but don't wait
  this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true })
    .subscribe({
      error: (err) => console.error('Logout API failed:', err)
    });
}

  // register(mobile: string, email?: string, asOwner = true, ownerId?: string): Observable<AuthResponse> {
  //   return this.http.post<AuthResponse>(`${this.baseUrl}/register`, {
  //     mobile,
  //     email,
  //     asOwner,
  //     ownerId
  //   }).pipe(
  //     tap(res => {
  //       localStorage.setItem('authToken', res.token);
  //       localStorage.setItem('userId', res.userId);
  //       localStorage.setItem('mobile', res.mobile);
  //     })
  //   );
  // }

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
