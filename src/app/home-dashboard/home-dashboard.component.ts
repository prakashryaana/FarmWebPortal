// home-dashboard.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { DashboardService, SummaryDto } from '../home-dashboard/dashboard.service';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

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
export class HomeDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  summary$: Observable<SummaryDto> = this.dashboardService.getSummary();
  liveActivitiesToday$: Observable<number> =
    this.dashboardService.pollTodayLiveActivitiesCount(15); // every 15s

  constructor(public auth: AuthService) { }

  ngOnInit(): void {
    if (this.auth.hasRole('FARMOWNER')) {
      this.router.navigate(['/add-actions']);
    }
  }
}
