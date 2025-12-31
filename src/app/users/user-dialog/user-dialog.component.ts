import { Component, inject, signal, computed, effect } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UserService } from '../user.service';
import { User, UserRole } from '../user.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioButton, MatRadioModule } from "@angular/material/radio";

interface DialogData {
  mode: 'create' | 'edit';
  user?: User;
}

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule,
    MatRadioButton, MatRadioModule
],
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.css']
})
export class UserDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UserDialogComponent>);
  private userService = inject(UserService);
  public data = inject<DialogData>(MAT_DIALOG_DATA);

  readonly availableRoles = signal<UserRole[]>([
    'FARMOWNER', 'FARMHELP', 'EASYGROWADMIN', 'UNKNOWN'
  ]);

  readonly isSubmitting = signal(false);
  readonly userForm = signal<FormGroup>(new FormGroup({}));

  readonly nameControl = computed(() => this.userForm().get('name') as FormControl);
  readonly mobileControl = computed(() => this.userForm().get('mobile') as FormControl);
  readonly emailControl = computed(() => this.userForm().get('email') as FormControl);
  readonly passwordControl = computed(() => this.userForm().get('password') as FormControl);

  constructor() {
    effect(() => {
      this.buildForm();
    });
  }

  private buildForm() {
    const currentData = this.data;
    const user = currentData.user;
    const mode = currentData.mode;
    // const user = this.data().user;
    // const mode = this.data().mode;

    const form = this.fb.group({
      name: [user?.name || '', [Validators.required, Validators.minLength(5)]],
      mobile: [user?.mobile || '', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
      email: [user?.email || '', [Validators.email]],
      ...(mode === 'create' && {
        password: ['', [Validators.required, Validators.minLength(8)]]
      }),
      role: [user?.roles?.[0] || this.availableRoles()[3], Validators.required]  // Single role
    });

    this.userForm.set(form);
  }

  getRoleDisplayName(role: UserRole): string {
    const displayNames: Record<UserRole, string> = {
      FARMOWNER: 'Farm Owner',
      FARMHELP: 'Farm Help',
      EASYGROWADMIN: 'EasyGrow Admin',
      UNKNOWN: 'UNKNOWN'
    };
    return displayNames[role] || role;
  }

  onSave() {
    if (this.userForm().invalid) return;

    this.isSubmitting.set(true);

    const formValue = this.userForm().value;

    const userData: any = {
      name: formValue.name,
      mobile: formValue.mobile,
      email: formValue.email,
      roles: [formValue.role as UserRole]  // Single role array
    };

    if (this.data.mode === 'create') {
      userData.password = formValue.password;
    }

    this.dialogRef.close(userData);
  }
  onCancel() {  // ← ADD THIS METHOD
    this.dialogRef.close(null);
  }
}
