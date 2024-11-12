import { Component } from '@angular/core';
import {
  IonApp,
  IonHeader,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonTitle, IonToolbar, IonHeader],
})
export class AppComponent {}
