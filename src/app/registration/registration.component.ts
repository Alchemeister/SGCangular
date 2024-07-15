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
      password: ['', [Validators.required, this.passwordValidator]]
    });
  }

  ngOnInit() {
    this.registrationForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordValidator]]
    });
  }

  passwordValidator(control: AbstractControl): ValidationErrors | null {
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