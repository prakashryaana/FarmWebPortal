import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../user.service';
import { UserDialogComponent } from '../user-dialog/user-dialog.component';
import { User, SystemStatus } from '../user.model';
import { catchError, switchMap, finalize, of } from 'rxjs';
import { inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTooltip } from "@angular/material/tooltip";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface UserRow extends User {
  displayRoles: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCardModule,
    MatTooltip, MatProgressSpinnerModule
],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent {
  readonly displayedColumns = ['name', 'mobile', 'email', 'roles', 'systemStatus', 'actions'] as const;
  
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(MatDialog);
  
  users = signal<UserRow[]>([]);
  loading = signal(false);
  
  userRows = computed(() => this.users().map(u => ({
    ...u,
    //roles: u.roles.join(', '),
    displayRoles: u.roles.join(', ')
  })));
  
  constructor() {
    this.loadUsers();
  }
  
  loadUsers() {
    this.loading.set(true);
    this.userService.getUsers()
      .pipe(
        catchError(err => {
          this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
          console.error('Load users error:', err);
          return [];
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe(users => this.users.set(users));
  }

  openCreateDialog() {
  const dialogRef = this.dialog.open(UserDialogComponent, {
    //width: '500px',
    data: { mode: 'create' }
  });

  dialogRef.afterClosed()
    .subscribe({
      next: userData => {
        if (!userData) return;  // Dialog cancelled
        
        // Call API directly
        this.userService.createUser(userData).subscribe({
          next: createdUser => {
            this.users.update(users => [...users, createdUser as UserRow]);
            this.snackBar.open('User created', 'Close', { duration: 2000 });
          },
          error: err => {
            console.error('Create failed', err);
            this.snackBar.open('Create failed', 'Close', { duration: 3000 });
          }
        });
      }
    });
}

  editUser(user: UserRow) {
  const dialogRef = this.dialog.open(UserDialogComponent, {
    width: '500px',
    data: { mode: 'edit', user }
  });

  dialogRef.afterClosed()
    .subscribe({
      next: userData => {
        if (!userData) return;  // Dialog cancelled
        
        // Call API directly  
        this.userService.updateUser(user.userId!, userData).subscribe({
          next: updatedUser => {
            this.users.update(users =>
              users.map(u => u.userId === user.userId ? { ...(u as any), ...updatedUser } : u)
            );
            this.snackBar.open('User updated', 'Close', { duration: 2000 });
          },
          error: err => {
            console.error('Update failed', err);
            this.snackBar.open('Update failed', 'Close', { duration: 3000 });
          }
        });
      }
    });
}

  
  setTempPassword(user: User) {
    const tempPassword = environment.tempPassword;
    const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
    width: '400px',
    data: { 
      title: 'Confirm Setting Temporary Password',
      message: `Are you sure you want to set temporary password: "${tempPassword}" for user: "${user.name}"?`,
      action: 'Yes'
      }
    });
    
    dialogRef.afterClosed()
    .subscribe(confirmed => {
      if (!confirmed) return;  // User cancelled

      this.userService.setTempPassword(user.userId!, tempPassword)
        .subscribe({
          next: updatedUser => {
            this.snackBar.open('Temporary password updated', 'Close', { duration: 2000 });
          },
          error: err => {
            console.error('Update failed', err);
            this.snackBar.open('Update failed', 'Close', { duration: 3000 });
          }});
      });
  }

  private showConfirmDialog(title: string, message: string, action: string): Promise<boolean> {
    const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title, message, action }
    });
    
    return lastValueFrom(dialogRef.afterClosed());  // Convert Observable to Promise
  }

  setSystemStatus(user: User) {
    const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
    width: '400px',
    data: { 
      title: 'Confirm Status Change',
      message: `Are you sure you want to ${user.systemStatus === 'ACTIVE' ? 'deactivate' : 'activate'} user "${user.name}"?`,
      action: user.systemStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'
      }
    });

    dialogRef.afterClosed()
    .subscribe(confirmed => {
      if (!confirmed) return;  // User cancelled

      const newStatus = user.systemStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
      this.userService.setSystemStatus(user.userId!, newStatus)
      .subscribe({
        next: result => {
          this.users.update(users => 
          users.map(u => u.userId === user.userId ? { ...u, systemStatus: newStatus } : u)
          );
          this.snackBar.open(`User is ${newStatus.toLowerCase()}`, 'Close');
        },
        error: err => {
          this.snackBar.open(`Update failed`, 'Close');
          console.error('Update failed', err);
        }
      });
    });
  }
  
  deleteUser(user: User) {
    const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
    width: '400px',
    data: { 
      title: 'Confirm User deletion',
      message: `Are you sure you want to delete user: "${user.name}"? A better option is to deactivate the user.`,
      action: 'Delete'
      }
    });

    dialogRef.afterClosed()
    .subscribe(confirmed => {
      if (!confirmed) return;  // User cancelled

      this.userService.deleteUser(user.userId!)
      .subscribe({
        next : result => {
          this.users.update(users => users.filter(u => u.userId !== user.userId));
          this.snackBar.open('User deleted', 'Close', { duration: 2000 });
        },
        error : err => {
          this.snackBar.open('Delete operation failed', 'Close');
          console.error('Delete operation failed', err);
        }
      });
    });
  }
}
