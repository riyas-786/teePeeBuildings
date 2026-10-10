
    // return this.http.post(`http://localhost:3000/teePeeBuildings/auth/login`, { email, password });

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // private apiUrl = `${environment.apiUrl}/auth`;
  private apiUrl = `http://localhost:3000/auth`;

  constructor(private http: HttpClient) {}

  signup(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, { email, password });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password });
  }

  logout() {
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
