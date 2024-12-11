import { Component } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { SendComponent } from '../../../components/send/send.component';
import { TerminalComponent } from '../../../components/terminal/terminal.component';

@Component({
  selector: 'app-terminal',
  templateUrl: 'terminal.page.html',
  styleUrls: ['./terminal.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    SendComponent,
    TerminalComponent,
  ],
})
export class TerminalPage {}
