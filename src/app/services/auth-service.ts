
// return this.http.post(`http://localhost:3000/teePeeBuildings/auth/login`, { email, password });

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';


export interface CurrentUser {
  email: string;
  role: 'admin' | 'staff';
  assignedBuildings: string[];
}


@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  // signup(email: string, password: string): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/signup`, { email, password });
  // }

  // login(email: string, password: string): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/login`, { email, password });
  // }

  // logout() {
  //   localStorage.removeItem('token');
  // }

  // isLoggedIn(): boolean {
  //   return !!localStorage.getItem('token');
  // }

  // getToken(): string | null {
  //   return localStorage.getItem('token');
  // }
  signup(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, { email, password }).pipe(
      tap((res: any) => this.storeSession(res))
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res: any) => this.storeSession(res))
    );
  }

  private storeSession(res: any) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): CurrentUser | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  isAdmin(): boolean {
    return this.getUser()?.role === 'admin';
  }

  // Convenience for any HttpClient call that needs the auth header.
  authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
  }
}
