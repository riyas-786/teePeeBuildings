import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { authGuard } from './services/auth-guard';
import { ManageUsers } from './manage-users/manage-users';

export const routes: Routes = [
    { path: "login", component: Login, },
    { path: "signup", component: Signup, },
    { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'manage-users', component: ManageUsers, canActivate: [authGuard] },
];
