import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
// Import other components as needed

import { SelectedMaterialService } from './selected-material.service';

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
  providers: [SelectedMaterialService],
  bootstrap: [AppComponent]
})
export class AppModule { }
