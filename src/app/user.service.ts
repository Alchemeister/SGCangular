import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './models/user';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = '/api/files/auth'; // Common base URL

  constructor(private http: HttpClient) {}

  registerUser(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user); 
  }

  loginUser(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, user); 
  }
}
