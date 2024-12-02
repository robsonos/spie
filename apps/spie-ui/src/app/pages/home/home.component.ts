import { Component } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { ConnectionComponent } from './connection/connection.component';
import { SendComponent } from './send/send.component';
import { TerminalComponent } from './terminal/terminal.component';
import { UpdateModalComponent } from './update-modal/update-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    SendComponent,
    ConnectionComponent,
    TerminalComponent,
    UpdateModalComponent,
  ],
})
export class HomeComponent {}
