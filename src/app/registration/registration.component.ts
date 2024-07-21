import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidationErrors, AbstractControl } from '@angular/forms';
import { UserService } from '../user.service';
import { User } from '../models/user';
import { CommonModule } from '@angular/common';

function passwordValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  const hasUpperCase = /[A-Z]+/.test(value);
  const hasLowerCase = /[a-z]+/.test(value);
  const hasNumeric = /[0-9]+/.test(value);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);
  
  if (value.length < 8 || !hasUpperCase || !hasLowerCase || !hasNumeric || !hasSpecialChar) {
    return { passwordComplexity: true };
  }
  
  return null;
}

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})

export class RegistrationComponent implements OnInit {
  registrationForm: FormGroup;

  constructor(private userService: UserService, private fb: FormBuilder) {
    this.registrationForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Form is already initialized in the constructor, so we don't need to reinitialize it here
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword) {
      confirmPassword.setErrors(null);
    }
  }
  
  onSubmit() {
    if (this.registrationForm.valid) {
      const user: User = this.registrationForm.value;
      this.userService.registerUser(user).subscribe(
        (response) => {
          console.log('Registration successful:', response);
          // Handle successful registration (e.g., display a message, redirect)
        },
        (error) => {
          console.error('Registration error:', error);
          // Handle registration errors (e.g., display error messages)
        }
      );
    }
  }
}
