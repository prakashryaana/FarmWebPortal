import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User } from './user.model';
import { environment } from '../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.baseApiUrl}api`;
  
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/User/GetAllUsers`);
  }
  
  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/User/CreateUser`, user);
  }
  
  updateUser(userId: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/User/UpdateUserByUserId/${userId}`, user);
  }
  
  deleteUser(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/User/RemoveUserByUserId/${userId}`);
  }
  
  setSystemStatus(userId: string, systemStatus: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/User/UpdateUserSystemStatus`, {userId, systemStatus});
  }

  setTempPassword(userId: string, password: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/User/UpdateUserPasswordByUserId`, {userId, password});
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => new Error(error.error?.message || 'An error occurred'));
  }
}