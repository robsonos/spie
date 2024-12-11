import { Component } from '@angular/core';
import {
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular/standalone';

import { ConnectionComponent } from '../../components/connection/connection.component';
import { UpdateModalComponent } from '../../components/update-modal/update-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    IonIcon,
    IonLabel,
    IonTabBar,
    IonTabButton,
    IonTabs,
    ConnectionComponent,
    UpdateModalComponent,
  ],
})
export class HomePage {}
