import { Component, inject, viewChild } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { SendComponent } from '../../../components/send/send.component';
import { TerminalComponent } from '../../../components/terminal/terminal.component';
import { ElectronService } from '../../../services/electron.service';

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
export class TerminalPage {
  private readonly electronService = inject(ElectronService);
  terminalComponent = viewChild.required(TerminalComponent);

  ionViewWillEnter() {
    this.electronService.serialPort.getReadEncoding().then((readEncoding) => {
      this.terminalComponent().terminalOptions.update((terminalOptions) => ({
        ...terminalOptions,
        encoding: readEncoding,
      }));
    });
  }
}
