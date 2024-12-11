import { Component, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCol,
  IonGrid,
  IonIcon,
  IonItem,
  IonRow,
  IonText,
  IonTextarea,
} from '@ionic/angular/standalone';
import { type DataEvent } from '@spie/types';
import { BehaviorSubject, Subject, filter, map, merge, tap } from 'rxjs';

import { ElectronService } from '../../services/electron.service';
import { SerialPortService } from '../../services/serial-port.service';
import { TerminalAdvancedComponent } from '../terminal-advanced-modal/terminal-advanced-modal.component';

@Component({
  selector: 'app-terminal-component',
  templateUrl: 'terminal.component.html',
  styleUrls: ['./terminal.component.scss'],
  imports: [
    IonButton,
    IonCard,
    IonCardContent,
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
  private readonly electronService = inject(ElectronService);

  constructor() {
    // Retrieve previous readEncoding (useful for development)
    this.electronService.serialPort.getReadEncoding().then((readEncoding) => {
      this.terminalOptions.update((terminalOptions) => ({
        ...terminalOptions,
        encoding: readEncoding,
      }));
    });

    this.dataEvent$.subscribe();
  }

  clearTerminalSubject = new Subject<void>();
  isOpen = this.serialPortService.isOpen;
  terminalOptions = this.serialPortService.terminalOptions;
  private dataEvent$ = merge(
    this.serialPortService.dataEvent$.pipe(
      filter(() => !this.isDataEventPausedSubject.getValue())
    ),
    this.clearTerminalSubject.pipe(map(() => ({ type: 'clear' } as DataEvent)))
  ).pipe(
    tap(async (dataEvent) => {
      if (dataEvent.type === 'clear') {
        this.data.set('');
        return;
      }

      const data = dataEvent.data;
      const isDataTruncated = data.split('\n').length - 1 > 1;
      if (isDataTruncated) {
        console.warn('data truncated:');
        return;
      }

      this.data.update((prevData) => {
        // Append timestamp if it is enabled
        if (this.terminalOptions().showTimestampsEnabled) {
          const date = new Date();
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const seconds = date.getSeconds().toString().padStart(2, '0');

          prevData += `[${hours}:${minutes}:${seconds}] `;
        }

        // Append data
        prevData += `${data}`;

        // TODO: evaluate if this should also be done for ascii
        // Append new line if hex encoding
        if (this.terminalOptions().encoding === 'hex') {
          prevData += '\n';
        }

        const excess =
          prevData.length - this.terminalOptions().scrollbackLength * 10000;

        if (excess > 0) {
          return prevData.slice(excess);
        }

        return prevData;
      });

      // Apply autoscroll
      const isAutoScrollEnabled = this.terminalOptions().isAutoScrollEnabled;
      if (isAutoScrollEnabled) {
        const terminalTextArea = this.terminalTextArea();
        const textarea = await terminalTextArea.getInputElement();
        textarea.scrollTo({
          top: textarea.scrollHeight,
          behavior: 'instant',
        });
      }
    }),
    takeUntilDestroyed()
  );
  data = signal('');
  isDataEventPausedSubject = new BehaviorSubject<boolean>(false);

  terminalTextArea = viewChild.required<IonTextarea>('terminalTextArea');
  private terminalAdvancedComponent = viewChild.required(
    TerminalAdvancedComponent
  );

  onClickClearTerminal(): void {
    this.clearTerminalSubject.next();
  }

  onClickPauseTerminal(): void {
    const currentValue = this.isDataEventPausedSubject.getValue();
    this.isDataEventPausedSubject.next(!currentValue);
  }

  async onClickTerminalAdvancedModal() {
    this.terminalAdvancedComponent().terminalAdvancedModal().present();
  }
}
