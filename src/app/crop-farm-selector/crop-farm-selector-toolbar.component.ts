import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CropFarmSelectorService } from './crop-farm-selector.service';
import { CropFarmSelectorDialogComponent } from './crop-farm-selector-dialog.component';
import { AuthService } from '../auth/auth.service';
import { UserProfileService } from '../user-profile/user-profile.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-crop-farm-selector-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    TranslateModule
  ],
  templateUrl: './crop-farm-selector-toolbar.component.html',
  styleUrls: ['./crop-farm-selector-toolbar.component.css']
})
export class CropFarmSelectorToolbarComponent implements OnInit, OnDestroy {
  selectedFarmId = '';
  selectedCropId = '';
  selectedFarmName = '';
  selectedCropName = '';
  hasSelection = false;
  private updateInterval: any;
  private authService = inject(AuthService)

  constructor(
    private selectorService: CropFarmSelectorService,
    private dialog: MatDialog
  ) {
    this.loadCropFarmForLoggedInUser();
  }

  ngOnInit(): void {
    
    // Subscribe to signals for reactive updates
    this.updateSelection();

    // Set up effect to watch for changes
    this.updateInterval = setInterval(() => {
      this.updateSelection();
    }, 100); // Light polling to detect signal changes
  }

  loadCropFarmForLoggedInUser(): void {
    let userId;
    let mobile;
    let roles: string[] = [];
    this.authService.currentUser$.subscribe(
      currentUser => {
        if (currentUser) {
          console.log('CurrentUser: ',currentUser.userId, currentUser.mobile, currentUser.roles);
          userId = currentUser.userId;
          mobile = currentUser.mobile;
          roles = currentUser.roles;
        } else {
          console.log('No current user loaded.');
        }
      }
    );
    
    if (userId) {
      //this.selectorService.getCropFarmForUser();
      // this.selectorService.getSearchResults()
      //     .subscribe(results => {
      //       this.selectorService.selectCropFarm(results[0]);
      //     });
    }
    
  }

  private updateSelection(): void {
    this.selectedFarmId = this.selectorService.selectedFarmId() || '';
    this.selectedCropId = this.selectorService.selectedCropId() || '';
    this.selectedFarmName = this.selectorService.selectedFarmName() || '';
    this.selectedCropName = this.selectorService.selectedCropName() || '';
    this.hasSelection = !!(this.selectedFarmId && this.selectedCropId);
  }

  openSelectorDialog(): void {
    const dialogRef = this.dialog.open(CropFarmSelectorDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      disableClose: false,
      closeOnNavigation: true
    });

    dialogRef.afterClosed().subscribe(() => {
      // Update display when dialog closes
      setTimeout(() => {
        this.updateSelection();
      }, 100);
    });
  }

  clearSelection(): void {
    this.selectorService.clearSelection();
    this.updateSelection();
  }

  ngOnDestroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
