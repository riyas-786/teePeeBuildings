import { Component, signal } from '@angular/core';
import {  RouterOutlet } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Login } from './login/login';
import { Signup } from './signup/signup';



@Component({
  imports: [RouterOutlet],
   standalone: true, 
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  // protected readonly title = signal('teePee');
}
