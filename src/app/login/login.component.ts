import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../user.service';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth-response';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule],
  standalone: true
})
export class LoginComponent {
  user: User = {
    username: '',
    password: '',
    email: ''
  };

  constructor(private userService: UserService, private router: Router) { }

  onSubmit() {
    this.userService.loginUser(this.user)
      .subscribe({
        next: (response: AuthResponse) => {
          console.log('Login successful:', response);

          // Store JWT in local storage
          localStorage.setItem('jwtToken', response.token);

          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Login error:', error);
        }
      });
  }
}
