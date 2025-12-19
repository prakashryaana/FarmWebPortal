import { Injectable } from '@angular/core';

export interface CurrentUser {
  userId: string;
  mobile: string;
  email?: string;
  ownerId: string;
  maintainerId?: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  get token(): string | null {
    return localStorage.getItem('authToken');
  }

  /*
  //Use this as guard against illigal/unauthenticated url calls/changes
  //returns true if loggedIn
  //returns false if not loggedIn
  */
  get isLoggedIn() {
    return !!this.token;
  }

  getCurrentUser(): CurrentUser | null {
    const token = this.token;
    if (!token) return null;

    const payloadJson = atob(token.split('.')[1]);
    const payload = JSON.parse(payloadJson);

    const rolesField =
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      payload['role'] ??
      [];

    const roles = Array.isArray(rolesField) ? rolesField : [rolesField];

    return {
      userId: payload.sub,
      mobile: payload.mobile,
      email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      ownerId: payload.ownerId,
      maintainerId: payload.maintainerId,
      roles
    };
  }

  isInRole(role: string): boolean {
    const u = this.getCurrentUser();
    return !!u && u.roles.includes(role);
  }

  logout() {
    localStorage.clear();
  }
}
