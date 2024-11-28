import { Component, input, model, viewChild } from '@angular/core';
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
import { type SerialPortEvent } from '@spie/types';
import { type Subject } from 'rxjs';

import { TerminalAdvancedComponent } from './terminal-advanced-modal/terminal-advanced-modal.component';
import { type TerminalOptions } from '../../../interfaces/app.interface';

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
  clearTerminalSubject = input.required<Subject<SerialPortEvent>>();
  data = input.required<string>();
  terminalOptions = model.required<TerminalOptions>();

  terminalTextArea = viewChild.required<IonTextarea>('terminalTextArea');
  private terminalAdvancedComponent = viewChild.required(
    TerminalAdvancedComponent
  );

  onClickClearTerminal(): void {
    this.clearTerminalSubject().next({ event: 'data', data: '' });
  }

  async onClickTerminalAdvancedModal() {
    this.terminalAdvancedComponent().terminalAdvancedModal().present();
  }
}
