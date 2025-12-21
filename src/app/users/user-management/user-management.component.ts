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
  
  // openCreateDialog() {
  //   const dialogRef = this.dialog.open(UserDialogComponent, {
  //     //width: '500px', 
  //     data: { mode: 'create' }
  //   });
    
  //   dialogRef.afterClosed().pipe(
  //     switchMap(result => result ? this.userService.createUser(result) : of(null)),
  //     catchError(err => {
  //       this.snackBar.open('Create failed', 'Close', { duration: 3000 });
  //       return of(null);
  //     })
  //   ).subscribe({ 
  //     next:() => {
  //     this.loadUsers();
  //     this.snackBar.open('User created', 'Close', { duration: 2000 });
  //   },
  //   error:(err) => {
  //     this.snackBar.open('Create failed', 'Close', { duration: 3000 });
  //   }
  // });
  // }

  openCreateDialog() {
  const dialogRef = this.dialog.open(UserDialogComponent, {
    //width: '500px',
    data: { mode: 'create' }
  });

  dialogRef.afterClosed()
    .subscribe({
      next: result => {
        if (!result) return;  // Dialog cancelled
        
        // Call API directly
        this.userService.createUser(result).subscribe({
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
      next: result => {
        if (!result) return;  // Dialog cancelled
        
        // Call API directly  
        this.userService.updateUser(user.userId!, result).subscribe({
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
    const tempPassword = '12345678';
    this.userService.setTempPassword(user.userId!, tempPassword)
      .subscribe({
        next: updatedUser => {
          this.snackBar.open('Temporary password updated', 'Close', { duration: 2000 });
        },
        error: err => {
          console.error('Update failed', err);
          this.snackBar.open('Update failed', 'Close', { duration: 3000 });
        }});
  }

  setSystemStatus(user: User) {
    //this.snackBar.open('Do you want to action this ?','Yes',con)
    const newStatus = user.systemStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    this.userService.setSystemStatus(user.userId!, newStatus)
    .subscribe({
      next: result => {
        this.users.update(users => 
        users.map(u => u.userId === user.userId ? { ...u, status: newStatus } : u)
        );
        this.snackBar.open(`User is ${newStatus.toLowerCase()}`, 'Close');
      },
      error: err => {
        this.snackBar.open(`Update failed`, 'Close');
        console.error('Update failed', err);
      }
    });
  }
  
  deleteUser(user: User) {
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
  }
}
