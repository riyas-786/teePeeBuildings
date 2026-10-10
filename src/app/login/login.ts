import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  constructor(private authService: AuthService, private router: Router) {}

  email = signal('');
  password = signal('');
  errorMessage = signal('');
  loading = signal(false);

  setEmail(value: string) {
    this.email.set(value);
    this.errorMessage.set('');
  }

  setPassword(value: string) {
    this.password.set(value);
    this.errorMessage.set('');
  }

  submit() {
    if (!this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('Enter your email and password');
      return;
    }

    this.loading.set(true);
    this.authService.login(this.email().trim(), this.password()).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        // Store the token so future requests can send it, and so the app
        // knows the user is logged in after a page refresh.
        localStorage.setItem('token', res.token);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.status === 400 ? 'Incorrect email or password' : 'Could not log in. Try again.'
        );
      },
    });
  }
}
