import { Component } from '@angular/core';

import { UserService } from '../user.service';

import { User } from '../models/user'; // Assuming you have a User model
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
  imports: [FormsModule],
  standalone: true
})
export class RegistrationComponent {
  user: User = {
    username: '',
    password: '',
    email: ''
  };

  constructor(private userService: UserService) {}

  onSubmit() {
    this.userService.registerUser(this.user) 
      .subscribe(
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
