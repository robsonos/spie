import { Injectable, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { type OpenOptions } from '@serialport/bindings-interface';
import { type DataEvent } from '@spie/types';
import {
  type Observable,
  Subject,
  filter,
  from,
  map,
  merge,
  scan,
  startWith,
  switchMap,
} from 'rxjs';

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
    scrollbackLength: 10000,
  });

  sendOptions = signal<SendOptions>({
    delimiter: 'lf',
    encoding: 'ascii',
    isSendInputValid: false,
  });

  clearDataSubject = new Subject<void>();

  isOpen = toSignal(
    from(this.electronService.serialPort.isOpen()).pipe(
      switchMap((isOpen) =>
        this.electronService.serialPort.onEvent().pipe(
          startWith({ type: isOpen ? 'open' : 'close' }),
          scan((currentIsOpen, serialPortEvent) => {
            if (serialPortEvent.type === 'open') {
              return true;
            }

            if (serialPortEvent.type === 'close') {
              return false;
            }

            return currentIsOpen;
          }, isOpen)
        )
      )
    ),
    { initialValue: false }
  );

  dataEvent$: Observable<DataEvent> = toObservable(this.isOpen).pipe(
    switchMap(() =>
      merge(
        this.electronService.serialPort.onEvent(),
        this.clearDataSubject.pipe(map(() => ({ type: 'clear' } as DataEvent)))
      )
    ),
    filter(
      (serialPortEvent) =>
        serialPortEvent.type === 'data' || serialPortEvent.type === 'clear'
    )
  );

  dataDelimitedEvent$: Observable<DataEvent> = toObservable(this.isOpen).pipe(
    switchMap(() =>
      merge(
        this.electronService.serialPort.onEvent(),
        this.clearDataSubject.pipe(map(() => ({ type: 'clear' } as DataEvent)))
      )
    ),
    filter(
      (serialPortEvent) =>
        serialPortEvent.type === 'data-delimited' ||
        serialPortEvent.type === 'clear'
    )
  );
}
