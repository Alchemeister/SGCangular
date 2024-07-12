import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { routes } from './app.routes';

import { AuthInterceptor } from './auth.interceptor';

import { SelectedMaterialService } from './selected-material.service';
import { DashboardComponent } from './dashboard.component'; // Import DashboardComponent
import { RegistrationComponent } from './registration/registration.component';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { LoginComponent } from './login/login.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    RegistrationComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes), 
    FormsModule
  ],
  providers: [
    SelectedMaterialService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],  
  bootstrap: [AppComponent]
})
export class AppModule { }
