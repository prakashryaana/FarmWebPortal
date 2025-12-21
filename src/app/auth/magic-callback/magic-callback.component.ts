import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-magic-callback',
  template: '<p>Signing you in...</p>'
})
export class MagicCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authApi: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.authApi.validateMagicLink(token).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
