import { Component, effect, inject, viewChild } from '@angular/core';
import {
  IonButton,
  IonCard,
  IonCardHeader,
  IonCol,
  IonGrid,
  IonIcon,
  IonItem,
  IonRow,
  IonText,
  IonTextarea,
} from '@ionic/angular/standalone';

import { TerminalAdvancedComponent } from './terminal-advanced-modal/terminal-advanced-modal.component';
import { SerialPortService } from '../../../services/serial-port.service';

@Component({
  selector: 'app-terminal',
  templateUrl: 'terminal.component.html',
  styleUrls: ['./terminal.component.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonCard,
    IonCardHeader,
    IonCol,
    IonGrid,
    IonIcon,
    IonItem,
    IonRow,
    IonText,
    IonTextarea,
    TerminalAdvancedComponent,
  ],
})
export class TerminalComponent {
  private readonly serialPortService = inject(SerialPortService);

  constructor() {
    effect(async () => {
      if (this.data() !== '') {
        // Apply auto scroll
        const isAutoScrollEnabled = this.terminalOptions().isAutoScrollEnabled;
        if (isAutoScrollEnabled) {
          const terminalTextArea = this.terminalTextArea();
          const textarea = await terminalTextArea.getInputElement();
          textarea.scrollTo({
            top: textarea.scrollHeight,
            behavior: 'instant',
          });
        }
      }
    });
  }

  clearDataSubject = this.serialPortService.clearDataSubject;
  data = this.serialPortService.data;
  terminalOptions = this.serialPortService.terminalOptions;

  terminalTextArea = viewChild.required<IonTextarea>('terminalTextArea');
  private terminalAdvancedComponent = viewChild.required(
    TerminalAdvancedComponent
  );

  onClickClearTerminal(): void {
    this.clearDataSubject.next({ event: 'data', data: '' });
  }

  async onClickTerminalAdvancedModal() {
    this.terminalAdvancedComponent().terminalAdvancedModal().present();
  }
}
