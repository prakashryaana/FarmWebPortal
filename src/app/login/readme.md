<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# give me the complete code for angular UI, .net core api and mongodb

End‑to‑end, fully “production‑ready” code for this stack is too large to fit here (it would be hundreds of lines across many files), but a minimal working skeleton for Angular 21 + .NET Core Web API + MongoDB + OTP + WebAuthn can be outlined so you can paste and extend it. Below is a compact but complete set of core files you need; you will still add error handling, logging, and SMS/WebAuthn library wiring.[^1][^2][^3]

## 1. MongoDB models and setup (.NET)

### appsettings.json

```json
{
  "Mongo": {
    "ConnectionString": "mongodb://localhost:27017",
    "DatabaseName": "AuthDb",
    "UsersCollectionName": "Users",
    "OtpCollectionName": "OtpSessions"
  },
  "Jwt": {
    "Issuer": "your-issuer",
    "Audience": "your-audience",
    "Key": "your-very-long-secret-key"
  }
}
```


### Program.cs (.NET 8 minimal API style)

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<MongoSettings>(
    builder.Configuration.GetSection("Mongo"));

builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("Jwt"));

builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MongoSettings>>().Value;
    return new MongoClient(settings.ConnectionString);
});

builder.Services.AddScoped(sp =>
{
    var mongoSettings = sp.GetRequiredService<IOptions<MongoSettings>>().Value;
    var client = sp.GetRequiredService<IMongoClient>();
    return client.GetDatabase(mongoSettings.DatabaseName);
});

builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<OtpService>();
builder.Services.AddScoped<JwtService>();

var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()!;
var key = Encoding.UTF8.GetBytes(jwt.Key);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(key)
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

public class MongoSettings
{
    public string ConnectionString { get; set; } = "";
    public string DatabaseName { get; set; } = "";
    public string UsersCollectionName { get; set; } = "";
    public string OtpCollectionName { get; set; } = "";
}

public class JwtSettings
{
    public string Issuer { get; set; } = "";
    public string Audience { get; set; } = "";
    public string Key { get; set; } = "";
}
```

MongoDB registration pattern follows Microsoft’s official tutorial.[^2][^3]

### User and WebAuthn credential models

```csharp
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public class WebAuthnCredential
{
    [BsonElement("credentialId")]
    public string CredentialId { get; set; } = "";

    [BsonElement("publicKey")]
    public string PublicKey { get; set; } = "";

    [BsonElement("signCount")]
    public long SignCount { get; set; }
}

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = "";

    [BsonElement("mobile")]
    public string Mobile { get; set; } = "";

    [BsonElement("webAuthnCredentials")]
    public List<WebAuthnCredential> WebAuthnCredentials { get; set; } = new();
}

public class OtpSession
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = "";

    [BsonElement("mobile")]
    public string Mobile { get; set; } = "";

    [BsonElement("otpHash")]
    public string OtpHash { get; set; } = "";

    [BsonElement("expiresAt")]
    public DateTime ExpiresAt { get; set; }

    [BsonElement("consumed")]
    public bool Consumed { get; set; }
}
```


### Repositories and services

```csharp
using MongoDB.Driver;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;

public class UserRepository
{
    private readonly IMongoCollection<User> _users;

    public UserRepository(IMongoDatabase db, IOptions<MongoSettings> settings)
    {
        _users = db.GetCollection<User>(settings.Value.UsersCollectionName);
    }

    public async Task<User?> GetByMobileAsync(string mobile) =>
        await _users.Find(u => u.Mobile == mobile).FirstOrDefaultAsync();

    public async Task<User> UpsertByMobileAsync(string mobile)
    {
        var existing = await GetByMobileAsync(mobile);
        if (existing != null) return existing;

        var user = new User { Mobile = mobile };
        await _users.InsertOneAsync(user);
        return user;
    }

    public async Task AddWebAuthnCredentialAsync(string userId, WebAuthnCredential cred)
    {
        var filter = Builders<User>.Filter.Eq(u => u.Id, userId);
        var update = Builders<User>.Update.Push(u => u.WebAuthnCredentials, cred);
        await _users.UpdateOneAsync(filter, update);
    }

    public async Task<User?> GetByCredentialIdAsync(string credentialId) =>
        await _users.Find(u => u.WebAuthnCredentials.Any(c => c.CredentialId == credentialId))
                    .FirstOrDefaultAsync();
}

public class OtpService
{
    private readonly IMongoCollection<OtpSession> _otps;
    private readonly UserRepository _users;

    public OtpService(IMongoDatabase db, IOptions<MongoSettings> settings, UserRepository users)
    {
        _otps = db.GetCollection<OtpSession>(settings.Value.OtpCollectionName);
        _users = users;
    }

    public async Task CreateAndSendOtpAsync(string mobile)
    {
        var otp = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        var hash = Hash(otp);
        var session = new OtpSession
        {
            Mobile = mobile,
            OtpHash = hash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            Consumed = false
        };
        await _otps.InsertOneAsync(session);

        // TODO: integrate real SMS gateway here
        Console.WriteLine($"[DEBUG] OTP for {mobile}: {otp}");
    }

    public async Task<User> ValidateOtpAndGetOrCreateUserAsync(string mobile, string otp)
    {
        var now = DateTime.UtcNow;
        var session = await _otps
            .Find(s => s.Mobile == mobile && !s.Consumed && s.ExpiresAt > now)
            .SortByDescending(s => s.ExpiresAt)
            .FirstOrDefaultAsync();

        if (session == null || session.OtpHash != Hash(otp))
            throw new Exception("Invalid or expired OTP");

        var filter = Builders<OtpSession>.Filter.Eq(s => s.Id, session.Id);
        var update = Builders<OtpSession>.Update.Set(s => s.Consumed, true);
        await _otps.UpdateOneAsync(filter, update);

        return await _users.UpsertByMobileAsync(mobile);
    }

    private static string Hash(string value)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(value));
        return Convert.ToBase64String(bytes);
    }
}
```

Mongo usage pattern matches common ASP.NET Core + MongoDB guides.[^4][^3][^2]

### JWT service

```csharp
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

public class JwtService
{
    private readonly JwtSettings _settings;

    public JwtService(IOptions<JwtSettings> options)
    {
        _settings = options.Value;
    }

    public string CreateToken(User user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim("mobile", user.Mobile)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```


## 2. Auth controller (OTP + WebAuthn skeleton)

WebAuthn verification uses `fido2-net-lib`; here the code is schematic so you can wire details with the library using its documentation and samples.[^5][^6][^7][^1]

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly OtpService _otpService;
    private readonly JwtService _jwtService;
    private readonly UserRepository _users;

    public AuthController(OtpService otpService, JwtService jwtService, UserRepository users)
    {
        _otpService = otpService;
        _jwtService = jwtService;
        _users = users;
    }

    public record SendOtpRequest(string Mobile);
    public record VerifyOtpRequest(string Mobile, string Otp);

    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest req)
    {
        await _otpService.CreateAndSendOtpAsync(req.Mobile);
        return Ok();
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest req)
    {
        var user = await _otpService.ValidateOtpAndGetOrCreateUserAsync(req.Mobile, req.Otp);
        var token = _jwtService.CreateToken(user);
        return Ok(new { token, userId = user.Id, mobile = user.Mobile });
    }

    // BELOW: WebAuthn is schematic; adapt to fido2-net-lib sample

    public record RegisterOptionsRequest(string UserId);
    public record RegisterFinishRequest(string UserId, object AttestationResponse);
    public record LoginOptionsRequest(string Mobile);
    public record LoginFinishRequest(object AssertionResponse);

    [Authorize]
    [HttpPost("webauthn/register-options")]
    public IActionResult GetRegisterOptions([FromBody] RegisterOptionsRequest req)
    {
        // Generate PublicKeyCredentialCreationOptions using fido2-net-lib
        // return them as JSON
        return Ok(/* publicKeyCredentialCreationOptions */);
    }

    [Authorize]
    [HttpPost("webauthn/register")]
    public async Task<IActionResult> FinishRegister([FromBody] RegisterFinishRequest req)
    {
        // Verify attestation, then:
        var user = await _users.GetByMobileAsync(User.FindFirst("mobile")!.Value);
        if (user == null) return Unauthorized();

        var cred = new WebAuthnCredential
        {
            CredentialId = "base64url-credential-id",
            PublicKey = "base64url-public-key",
            SignCount = 0
        };

        await _users.AddWebAuthnCredentialAsync(user.Id, cred);
        return Ok();
    }

    [HttpPost("webauthn/login-options")]
    public async Task<IActionResult> GetLoginOptions([FromBody] LoginOptionsRequest req)
    {
        var user = await _users.GetByMobileAsync(req.Mobile);
        if (user == null || user.WebAuthnCredentials.Count == 0)
            return BadRequest("No credentials");

        // Build PublicKeyCredentialRequestOptions using stored credentialIds
        return Ok(/* requestOptions */);
    }

    [HttpPost("webauthn/login")]
    public async Task<IActionResult> FinishLogin([FromBody] LoginFinishRequest req)
    {
        // Verify assertion using fido2-net-lib; identify user by credentialId
        var user = await _users.GetByCredentialIdAsync("credential-id-from-assertion");
        if (user == null) return Unauthorized();

        var token = _jwtService.CreateToken(user);
        return Ok(new { token, userId = user.Id, mobile = user.Mobile });
    }
}
```

Use the official FIDO2/WebAuthn library and samples to fill the WebAuthn endpoints; they show exactly how to build and validate options and responses.[^6][^7][^1][^5]

## 3. Angular 21 app – OTP + fingerprint

Assume a new Angular app (v17+ syntax is compatible with 21).[^8][^9][^10]

### auth.service.ts (OTP and token handling)

```ts
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
```


### webauthn.service.ts

```ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebAuthnService {
  private baseUrl = '/api/auth/webauthn';

  constructor(private http: HttpClient) {}

  private base64UrlToBuffer(base64url: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
    const base64 = (base64url.replace(/-/g, '+').replace(/_/g, '/')) + padding;
    const raw = window.atob(base64);
    const buffer = new ArrayBuffer(raw.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < raw.length; ++i) {
      view[i] = raw.charCodeAt(i);
    }
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
      }
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
    const userId = localStorage.getItem('userId');
    if (!userId) throw new Error('Not logged in');

    const options = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/register-options`, { userId })
    );

    const publicKey = this.decodeCreationOptions(options);
    const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;

    const att = credential.response as AuthenticatorAttestationResponse;

    return firstValueFrom(
      this.http.post(`${this.baseUrl}/register`, {
        userId,
        attestationResponse: {
          id: credential.id,
          rawId: this.bufferToBase64Url(credential.rawId),
          type: credential.type,
          response: {
            attestationObject: this.bufferToBase64Url(att.attestationObject),
            clientDataJSON: this.bufferToBase64Url(att.clientDataJSON)
          }
        }
      })
    );
  }

  async loginWithBiometric(mobile: string) {
    const options = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/login-options`, { mobile })
    );

    const publicKey = this.decodeRequestOptions(options);
    const assertion = await navigator.credentials.get({ publicKey }) as PublicKeyCredential;
    const resp = assertion.response as AuthenticatorAssertionResponse;

    const result = await firstValueFrom(
      this.http.post<{ token: string; userId: string; mobile: string }>(
        `${this.baseUrl}/login`,
        {
          id: assertion.id,
          rawId: this.bufferToBase64Url(assertion.rawId),
          type: assertion.type,
          response: {
            authenticatorData: this.bufferToBase64Url(resp.authenticatorData),
            clientDataJSON: this.bufferToBase64Url(resp.clientDataJSON),
            signature: this.bufferToBase64Url(resp.signature),
            userHandle: resp.userHandle
              ? this.bufferToBase64Url(resp.userHandle)
              : null
          }
        }
      )
    );

    localStorage.setItem('authToken', result.token);
    localStorage.setItem('userId', result.userId);
    localStorage.setItem('mobile', result.mobile);
  }
}
```

This mapping pattern is consistent with common Angular WebAuthn examples.[^11][^9][^10][^8]

### login.component.ts / .html

```ts
import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { WebAuthnService } from './webauthn.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  mobile = '';
  otp = '';
  stage: 'mobile' | 'otp' = 'mobile';
  message = '';
  canUseBiometric = !!(window as any).PublicKeyCredential;

  constructor(
    private auth: AuthService,
    private webAuthn: WebAuthnService
  ) {}

  sendOtp() {
    this.auth.sendOtp(this.mobile).subscribe({
      next: () => {
        this.stage = 'otp';
        this.message = 'OTP sent';
      },
      error: err => this.message = err.error || 'Error sending OTP'
    });
  }

  verifyOtp() {
    this.auth.verifyOtp(this.mobile, this.otp).subscribe({
      next: () => {
        this.message = 'Logged in; you can now enable fingerprint on settings.';
      },
      error: err => this.message = err.error || 'Invalid OTP'
    });
  }

  async biometricLogin() {
    try {
      await this.webAuthn.loginWithBiometric(this.mobile);
      this.message = 'Logged in with fingerprint';
    } catch (e: any) {
      this.message = e.message || 'Biometric login failed';
    }
  }
}
```

```html
<div>
  <h2>Login</h2>

  <div *ngIf="stage === 'mobile'">
    <label>Mobile:</label>
    <input [(ngModel)]="mobile" type="tel" />
    <button (click)="sendOtp()">Send OTP</button>

    <button *ngIf="canUseBiometric" (click)="biometricLogin()">
      Login with fingerprint
    </button>
  </div>

  <div *ngIf="stage === 'otp'">
    <label>OTP:</label>
    <input [(ngModel)]="otp" type="text" />
    <button (click)="verifyOtp()">Verify OTP</button>
  </div>

  <p>{{ message }}</p>
</div>
```


### enable-fingerprint.component.ts / .html (optional settings page)

```ts
import { Component } from '@angular/core';
import { WebAuthnService } from './webauthn.service';

@Component({
  selector: 'app-enable-fingerprint',
  templateUrl: './enable-fingerprint.component.html'
})
export class EnableFingerprintComponent {
  message = '';
  canUseBiometric = !!(window as any).PublicKeyCredential;

  constructor(private webAuthn: WebAuthnService) {}

  async enable() {
    try {
      await this.webAuthn.registerForCurrentUser();
      this.message = 'Fingerprint registered for this device.';
    } catch (e: any) {
      this.message = e.message || 'Failed to register fingerprint';
    }
  }
}
```

```html
<div>
  <h2>Enable Fingerprint</h2>
  <button *ngIf="canUseBiometric" (click)="enable()">
    Enable fingerprint on this device
  </button>
  <p>{{ message }}</p>
</div>
```


### app.module.ts (important parts)

```ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { LoginComponent } from './login.component';
import { EnableFingerprintComponent } from './enable-fingerprint.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    EnableFingerprintComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

Add an HTTP interceptor if you want to automatically attach the JWT to protected API calls.

***

This is a full minimal skeleton for your stack that you can run locally (OTP printed to console, WebAuthn endpoints as stubs) and then harden by: wiring a real SMS provider, integrating `fido2-net-lib` in the WebAuthn endpoints, adding HTTPS and CORS, and securing production secrets. If you want, the next step can focus only on filling in the WebAuthn register/login endpoints with actual FIDO2 code.[^3][^1][^6][^2]
<span style="display:none">[^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23]</span>

<div align="center">⁂</div>

[^1]: https://github.com/passwordless-lib/fido2-net-lib

[^2]: https://learn.microsoft.com/en-us/aspnet/core/tutorials/first-mongo-app?view=aspnetcore-9.0

[^3]: https://learn.microsoft.com/en-us/aspnet/core/tutorials/first-mongo-app?view=aspnetcore-10.0

[^4]: https://codewithmukesh.com/blog/mongodb-in-aspnet-core/

[^5]: https://www.scottbrady.io/fido/a-fido2-primer-and-proof-of-concept-using-aspnet-core

[^6]: https://damienbod.com/2019/08/06/asp-net-core-identity-with-fido2-webauthn-mfa/

[^7]: https://damienbod.com/2019/10/18/adding-fido2-passwordless-authentication-to-an-asp-net-core-identity-app/

[^8]: https://dev.to/this-is-angular/integrate-fingerprint-and-face-id-authentication-in-your-angular-app-using-webauthn-a-step-by-step-guide-3o2b

[^9]: https://github.com/marcellkiss/angular-webauthn-example

[^10]: https://github.com/JonnyHeavey/ngx-webauthn

[^11]: https://github.com/wmeints/webauthn-sample

[^12]: https://learn.microsoft.com/en-us/answers/questions/1078919/webauthn-fido2-in-asp-net

[^13]: https://www.syncfusion.com/blogs/post/passkey-in-asp-dotnet-core-with-fido2

[^14]: https://fiyaz-hasan-me-blog.azurewebsites.net/fido2-mfa-in-aspnetcore/

[^15]: https://stackoverflow.com/questions/67661208/asp-net-core-web-api-with-mongodb-driver

[^16]: https://www.youtube.com/watch?v=HQya3ymVjOw

[^17]: https://www.corbado.com/webauthn/angular

[^18]: https://mojoauth.com/white-papers/angular-otp-authentication-setup/

[^19]: https://github.com/damienbod/AspNetCoreIdentityFido2Mfa

[^20]: https://stackblitz.com/edit/github-sy7dxg

[^21]: https://www.youtube.com/watch?v=Gxf7zBl5Z64

[^22]: https://supertokens.com/docs/additional-verification/mfa/webauthn-setup

[^23]: https://www.syncfusion.com/blogs/post/passkey-in-asp-dotnet-core-with-fido2/amp

