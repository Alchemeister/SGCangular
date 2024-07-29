import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from './models/user';
import { AuthResponse } from './models/auth-response'; // Import the AuthResponse interface
import { RegisterResponse } from './models/register-response'; // Import the RegisterResponse interface

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = '/api/auth'; // Common base URL

  constructor(private http: HttpClient) {}

  registerUser(user: User): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, user);
  }

  loginUser(user: User): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, user).pipe(
      tap((response: AuthResponse) => {
        if (response && response.token) {
          localStorage.setItem('jwtToken', response.token);
          console.log('Token stored in localStorage:', response.token);
        }
      })
    );
  }
  

  // Helper to get JWT from local storage
  getToken(): string | null {
    const token = localStorage.getItem('jwtToken');
    console.log('Retrieved token:', token);
    return token;
  }
  

  // Helper to add JWT to request headers
  setAuthHeader(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  clearToken(): void {
    localStorage.removeItem('jwtToken');
  }

  validatePassword(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]+/.test(password);
    const hasLowerCase = /[a-z]+/.test(password);
    const hasNumeric = /[0-9]+/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
    
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;
  }

  
  // Method to check if the user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    // You can add more logic here to check if the token is valid
    return !!token;
  }
  
  changePassword(passwordData: any) {
    return this.http.post(`${this.apiUrl}/change-password`, passwordData);
  }
  
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`, { headers: this.setAuthHeader() });
  }
}
