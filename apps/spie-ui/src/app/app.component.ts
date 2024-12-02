import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  documentOutline,
  settingsOutline,
  speedometerOutline,
  statsChartOutline,
  timeOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    addIcons({ cloudUploadOutline });
    addIcons({ documentOutline });
    addIcons({ settingsOutline });
    addIcons({ speedometerOutline });
    addIcons({ statsChartOutline });
    addIcons({ timeOutline });
  }
}
