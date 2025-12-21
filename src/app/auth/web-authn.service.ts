import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebAuthnService {
  private baseUrl = `${environment.baseApiUrl}api/auth/passkey`;
  // private baseUrl = '/api/auth/passkey';

  constructor(private http: HttpClient) {}

  private base64UrlToBuffer(base64url: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
    const base64 = (base64url.replace(/-/g, '+').replace(/_/g, '/')) + padding;
    const raw = window.atob(base64);
    const buffer = new ArrayBuffer(raw.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < raw.length; ++i) view[i] = raw.charCodeAt(i);
    return buffer;
  }

  private bufferToBase64Url(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private decodeCreationOptions(opts: any): PublicKeyCredentialCreationOptions {
    return {
      ...opts,
      challenge: this.base64UrlToBuffer(opts.challenge),
      user: {
        ...opts.user,
        id: this.base64UrlToBuffer(opts.user.id)
      },
      excludeCredentials: opts.excludeCredentials?.map((c: any) => ({
        ...c,
        id: this.base64UrlToBuffer(c.id)
      }))
    };
  }

  private decodeRequestOptions(opts: any): PublicKeyCredentialRequestOptions {
    return {
      ...opts,
      challenge: this.base64UrlToBuffer(opts.challenge),
      allowCredentials: opts.allowCredentials?.map((c: any) => ({
        ...c,
        id: this.base64UrlToBuffer(c.id)
      }))
    };
  }

  async registerForCurrentUser() {
    // const userId = localStorage.getItem('userId');
    // if (!userId) throw new Error('Not logged in');

    const options = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/register-options`, { withCredentials:true})
    );

    const publicKey = this.decodeCreationOptions(options);
    const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;

    const att = credential.response as AuthenticatorAttestationResponse;

    const anyCred = credential as any;

    const clientExtensionResults =
      anyCred.getClientExtensionResults?.() || {};   // may be empty [web:280]

    const transports =
      (att as any).getTransports?.() || [];          // may be [] [web:275]

    const payload = {
      id: credential.id,
      rawId: this.bufferToBase64Url(credential.rawId),
      type: credential.type,
      clientExtensionResults,
      response: {
        attestationObject: this.bufferToBase64Url(att.attestationObject),
        clientDataJSON: this.bufferToBase64Url(att.clientDataJSON),
        transports
      }
    };

    const res = await firstValueFrom(
      this.http.post<{ token: string; userId: string; mobile: string }>(
        `${this.baseUrl}/register`,
        payload,
        {withCredentials:true}
      )
    );
  }

  async loginWithPasskey(mobile: string) {
    const options = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/login-options`, { mobile }, {withCredentials:true})
    );

    const publicKey = this.decodeRequestOptions(options);
    const assertion = await navigator.credentials.get({ publicKey }) as PublicKeyCredential;
    const resp = assertion.response as AuthenticatorAssertionResponse;

    const anyCred = assertion as any;

    // NEW: extension results for assertion
    const clientExtensionResults =
      anyCred.getClientExtensionResults?.() || {};  // returns {} if none [web:280][web:278]

    const payload = {
      id: assertion.id,
      rawId: this.bufferToBase64Url(assertion.rawId),
      type: assertion.type,
      clientExtensionResults,
      response: {
        authenticatorData: this.bufferToBase64Url(resp.authenticatorData),
        clientDataJSON: this.bufferToBase64Url(resp.clientDataJSON),
        signature: this.bufferToBase64Url(resp.signature),
        userHandle: resp.userHandle
          ? this.bufferToBase64Url(resp.userHandle)
          : null
      }
    };

    const res = await firstValueFrom(
      this.http.post<{ token: string; userId: string; mobile: string }>(
        `${this.baseUrl}/login`,
        payload,
        { withCredentials: true }
      )
    );
  }
}
