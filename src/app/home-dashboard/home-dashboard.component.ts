// home-dashboard.component.ts
import { Component, inject } from '@angular/core';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { DashboardService, SummaryDto } from '../home-dashboard/dashboard.service';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthTokenService } from '../login/auth-token.service';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './home-dashboard.component.html',
  styleUrls: ['./home-dashboard.component.css']
})
export class HomeDashboardComponent {
  private dashboardService = inject(DashboardService);

  summary$: Observable<SummaryDto> = this.dashboardService.getSummary();
  liveActivitiesToday$: Observable<number> =
    this.dashboardService.pollTodayLiveActivitiesCount(15); // every 15s

  constructor(private auth: AuthTokenService) {}

  get user() {
    return this.auth.getCurrentUser();
  }

  get isOwner() {
    return this.auth.isInRole('Owner');
  }

  get isMaintainer() {
    return this.auth.isInRole('Maintainer');
  }

  logout() {
    this.auth.logout();
    window.location.href = '/login';
  }
}
