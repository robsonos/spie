import { Component, inject, signal, viewChild } from '@angular/core';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
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
import {
  BehaviorSubject,
  type Observable,
  Subject,
  filter,
  from,
  map,
  merge,
  scan,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

import { type MonitorOptions } from '../../interfaces/app.interface';
import { ElectronService } from '../../services/electron.service';
import { MonitorAdvancedComponent } from '../monitor-advanced-modal/monitor-advanced-modal.component';

@Component({
  selector: 'app-monitor-component',
  templateUrl: 'monitor.component.html',
  styleUrls: ['./monitor.component.scss'],
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
    MonitorAdvancedComponent,
  ],
})
export class MonitorComponent {
  private readonly electronService = inject(ElectronService);

  constructor() {
    this.dataEvent$.subscribe();
  }

  clearMonitorSubject = new Subject<void>();
  isPausedSubject = new BehaviorSubject<boolean>(false);

  data = signal('');
  monitorOptions = signal<MonitorOptions>({
    encoding: 'ascii',
    isAutoScrollEnabled: true,
    showTimestampsEnabled: false,
    scrollbackLength: 10000,
    rows: 30,
    useReadlineParser: false,
  });

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

  private onData$: Observable<DataEvent> = toObservable(this.isOpen).pipe(
    switchMap(() => this.electronService.serialPort.onEvent()),
    filter((serialPortEvent) => serialPortEvent.type === 'data')
  );

  private onDataDelimited$: Observable<DataEvent> = toObservable(
    this.isOpen
  ).pipe(
    switchMap(() => this.electronService.serialPort.onEvent()),
    filter((serialPortEvent) => serialPortEvent.type === 'data-delimited')
  );

  private dataEvent$ = merge(
    toObservable(this.monitorOptions).pipe(
      map((monitorOptions) => monitorOptions.useReadlineParser),
      switchMap((useReadlineParser) =>
        useReadlineParser ? this.onDataDelimited$ : this.onData$
      ),
      filter(() => !this.isPausedSubject.getValue())
    ),
    this.clearMonitorSubject.pipe(map(() => ({ type: 'clear' } as DataEvent)))
  ).pipe(
    tap(async (dataEvent) => {
      if (dataEvent.type === 'clear') {
        this.data.set('');
        return;
      }

      const data = dataEvent.data;

      this.data.update((prevData) => {
        // Append timestamp if it is enabled
        if (this.monitorOptions().showTimestampsEnabled) {
          const date = new Date();
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const seconds = date.getSeconds().toString().padStart(2, '0');

          prevData += `[${hours}:${minutes}:${seconds}] `;
        }

        // Append data
        prevData += `${data}`;

        // Append new line if hex encoding
        if (this.monitorOptions().encoding === 'hex') {
          prevData += '\n';
        }

        const excess = prevData.length - this.monitorOptions().scrollbackLength;

        if (excess > 0) {
          return prevData.slice(excess);
        }

        return prevData;
      });

      // Apply autoscroll
      const isAutoScrollEnabled = this.monitorOptions().isAutoScrollEnabled;
      if (isAutoScrollEnabled) {
        const monitorTextArea = this.monitorTextArea();
        const textarea = await monitorTextArea.getInputElement();
        textarea.scrollTo({
          top: textarea.scrollHeight,
          behavior: 'instant',
        });
      }
    }),
    takeUntilDestroyed()
  );

  monitorTextArea = viewChild.required<IonTextarea>('monitorTextArea');
  private monitorAdvancedComponent = viewChild.required(
    MonitorAdvancedComponent
  );

  onClickClearMonitor(): void {
    this.clearMonitorSubject.next();
  }

  onClickPauseMonitor(): void {
    const currentValue = this.isPausedSubject.getValue();
    this.isPausedSubject.next(!currentValue);
  }

  async onClickMonitorAdvancedModal() {
    this.monitorAdvancedComponent().monitorAdvancedModal().present();
  }
}
