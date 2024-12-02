import { Injectable, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { type OpenOptions } from '@serialport/bindings-interface';
import { type SerialPortEvent } from '@spie/types';
import { Subject, filter, from, map, merge, scan, switchMap } from 'rxjs';

import { ElectronService } from './electron.service';
import {
  type SendOptions,
  type TerminalOptions,
} from '../interfaces/app.interface';

@Injectable({
  providedIn: 'root',
})
export class SerialPortService {
  private readonly electronService = inject(ElectronService);

  openOptions = signal<OpenOptions>({
    path: '',
    baudRate: 9600,
    dataBits: 8,
    lock: true,
    stopBits: 1,
    parity: 'none',
    rtscts: false,
    xon: false,
    xoff: false,
    xany: false,
    hupcl: true,
  });

  terminalOptions = signal<TerminalOptions>({
    encoding: 'ascii',
    isAutoScrollEnabled: true,
    showTimestampsEnabled: false,
    scrollbackLength: 1,
  });

  sendOptions = signal<SendOptions>({
    delimiter: 'lf',
    encoding: 'ascii',
    isSendInputValid: false,
  });

  clearDataSubject = new Subject<SerialPortEvent>();

  isOpen = toSignal(
    from(this.electronService.serialPort.isOpen()).pipe(
      switchMap((isOpen) =>
        this.electronService.serialPort.onEvent().pipe(
          filter(
            (serialPortEvent) =>
              serialPortEvent.event === 'close' ||
              serialPortEvent.event === 'open'
          ),
          scan((currentIsOpen, serialPortEvent) => {
            if (serialPortEvent.event === 'open') {
              return true;
            }

            if (serialPortEvent.event === 'close') {
              return false;
            }

            return currentIsOpen;
          }, isOpen)
        )
      )
    ),
    { initialValue: false }
  );

  data = toSignal(
    toObservable(this.isOpen).pipe(
      switchMap(() =>
        merge(
          // Emissions to this.isOpen will resubscribe these
          this.electronService.serialPort.onEvent(),
          this.clearDataSubject
        )
      ),
      filter((serialPortEvent) => serialPortEvent.event === 'data'),
      map((serialPortEvent) => {
        const data = serialPortEvent.data;
        // If data it a "clear terminal" signal
        if (data === '') {
          return '';
        }

        if (this.terminalOptions().showTimestampsEnabled) {
          const date = new Date();
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const seconds = date.getSeconds().toString().padStart(2, '0');
          return `[${hours}:${minutes}:${seconds}] ${data}`;
        }

        return data;
      }),
      scan(
        (acc, value) => {
          // Reset on empty string
          if (value === '') {
            return { items: [] as string[], length: 0 };
          }

          acc.items.push(value);
          acc.length += value.length;
          const maxLength = this.terminalOptions().scrollbackLength * 10000;

          while (acc.length > maxLength) {
            const removed = acc.items.shift();
            if (removed) {
              acc.length -= removed.length;
            }
          }

          return acc;
        },
        { items: [] as string[], length: 0 }
      ),
      map((buffer) => {
        if (this.terminalOptions().encoding === 'hex') {
          return buffer.items.join('\n');
        }

        return buffer.items.join('');
      })
    ),
    { initialValue: '' }
  );
}
