import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  documentOutline,
  helpCircleOutline,
  logInOutline,
  logOutOutline,
  pauseOutline,
  playOutline,
  pulseOutline,
  sendOutline,
  settingsOutline,
  speedometerOutline,
  statsChartOutline,
  terminalOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    addIcons({
      cloudUploadOutline,
      documentOutline,
      helpCircleOutline,
      logInOutline,
      logOutOutline,
      pauseOutline,
      playOutline,
      pulseOutline,
      sendOutline,
      settingsOutline,
      speedometerOutline,
      statsChartOutline,
      terminalOutline,
      timeOutline,
      trashOutline,
    });
  }
}
