import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth-service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  constructor(private authService: AuthService, private router: Router) {}

  email = signal('');
  password = signal('');
  confirmPassword = signal('');
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

  setConfirmPassword(value: string) {
    this.confirmPassword.set(value);
    this.errorMessage.set('');
  }

  submit() {
    if (!this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('Enter an email and password');
      return;
    }
    if (this.password().length < 6) {
      this.errorMessage.set('Password must be at least 6 characters');
      return;
    }
    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    this.loading.set(true);
    this.authService.signup(this.email().trim(), this.password()).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        localStorage.setItem('token', res.token);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.status === 400 ? err.error : 'Could not create account. Try again.'
        );
      },
    });
  }
}
