import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
// Import other components as needed

@NgModule({
  declarations: [
    AppComponent,
    // other components...
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    // other modules...
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
