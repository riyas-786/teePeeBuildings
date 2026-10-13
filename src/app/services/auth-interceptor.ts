import { HttpInterceptorFn } from '@angular/common/http';

// Attaches "Authorization: Bearer <token>" to every outgoing request,
// so you don't have to pass headers manually in each service call.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (!token) return next(req);

  const cloned = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(cloned);
};

/* app.config.ts — register it:

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './services/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    // ...your other providers
  ],
};
*/
