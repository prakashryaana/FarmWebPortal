import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  userId: string;
  name: string;
  mobile: string;
  email: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private baseUrl = `${environment.baseApiUrl}api`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getMyProfile() {
  return this.http.get<UserProfile>(`${this.baseUrl}/profile/me`).pipe(
    switchMap(profile => this.authService.validate() ? of(profile) : throwError(() => new Error('Not authenticated')))
  );
}

updateMyProfile(profile: { name: string; email: string; mobile: string; }) {
  return this.http.put<UserProfile>(`${this.baseUrl}/profile/me`, profile);
}

}
