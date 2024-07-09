import { Routes } from '@angular/router';
import { DashboardComponent } from '../app/dashboard.component';
import { RegistrationComponent } from './registration/registration.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'register', component : RegistrationComponent },
  { path: 'login', component : LoginComponent },
  { path: '**', redirectTo: '' }
];
