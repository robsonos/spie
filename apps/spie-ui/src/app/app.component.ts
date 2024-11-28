import { Component, inject, signal, viewChild } from '@angular/core';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import {
  type AlertButton,
  AlertController,
  IonApp,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  LoadingController,
} from '@ionic/angular/standalone';
import { type OpenOptions } from '@serialport/bindings-interface';
import { type SerialPortEvent } from '@spie/types';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  documentOutline,
  settingsOutline,
  speedometerOutline,
  statsChartOutline,
  timeOutline,
} from 'ionicons/icons';
import {
  Subject,
  filter,
  from,
  map,
  merge,
  of,
  scan,
  switchMap,
  tap,
} from 'rxjs';

import { SendComponent } from './components/send/send.component';
import { SerialPortComponent } from './components/serial-port/serial-port.component';
import { TerminalComponent } from './components/terminal/terminal.component';
import { UpdateModalComponent } from './components/update-modal/update-modal.component';
import {
  type SendOptions,
  type TerminalOptions,
} from './interfaces/app.interface';
import { ElectronService } from './services/electron.service';
import { ToasterService } from './services/toaster.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    IonApp,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    SerialPortComponent,
    TerminalComponent,
    SendComponent,
    UpdateModalComponent,
  ],
})
export class AppComponent {
  private readonly alertController = inject(AlertController);
  private readonly loadingController = inject(LoadingController);
  private readonly toasterService = inject(ToasterService);
  private readonly electronService = inject(ElectronService);

  constructor() {
    addIcons({ settingsOutline });
    addIcons({ documentOutline });
    addIcons({ cloudUploadOutline });
    addIcons({ speedometerOutline });
    addIcons({ statsChartOutline });
    addIcons({ timeOutline });

    this.reconnectSubject
      .pipe(
        takeUntilDestroyed(),
        tap(async () => {
          if (this.isOpen()) {
            const loading = await this.loadingController.create();
            await loading.present();
            try {
              await this.electronService.serialPort.close();
              await this.electronService.serialPort.open(this.openOptions());
              this.clearTerminalSubject.next({ event: 'data', data: '' });
            } catch (error) {
              await this.toasterService.presentErrorToast(error);
            }
            await loading.dismiss();
          }
        })
      )
      .subscribe();
  }

  private terminalComponent =
    viewChild.required<TerminalComponent>(TerminalComponent);
  private updateModalComponent = viewChild.required(UpdateModalComponent);

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

  reconnectSubject = new Subject<void>();
  clearTerminalSubject = new Subject<SerialPortEvent>();
  clearInputSubject = new Subject<void>();

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
          this.clearTerminalSubject
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
          return `${this.formatTimestamp(new Date())} ${data}`;
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
      }),
      tap(async () => await this.handleAutoScroll())
    ),
    { initialValue: '' }
  );

  progressInfo = toSignal(
    this.electronService.onUpdateEvent().pipe(
      tap(async (autoUpdaterEvent) => {
        if (autoUpdaterEvent.event === 'checking-for-update') {
          await this.toasterService.presentInfoToast('Checking for Updates');
        }

        if (autoUpdaterEvent.event === 'update-not-available') {
          await this.toasterService.presentInfoToast('No Updates Available');
        }

        if (autoUpdaterEvent.event === 'update-available') {
          await this.presentAlert(
            'Update Available for Download',
            `Version ${autoUpdaterEvent.updateInfo.version} is ready for download.`,
            [
              {
                text: 'Cancel',
                role: 'cancel',
              },
              {
                text: 'Download',
                role: 'confirm',
                handler: async () => {
                  this.electronService.downloadUpdate();
                  await this.updateModalComponent().updateModal().present();
                },
              },
            ]
          );
        }

        if (autoUpdaterEvent.event === 'update-downloaded') {
          await this.presentAlert(
            'Update Ready to Install',
            `Version ${autoUpdaterEvent.updateDownloadedEvent.version} is ready to install.`,
            [
              {
                text: 'Cancel',
                role: 'cancel',
              },
              {
                text: 'Install',
                role: 'confirm',
                handler: () => {
                  this.electronService.installUpdate();
                },
              },
            ]
          );
        }

        if (autoUpdaterEvent.event === 'update-cancelled') {
          await this.toasterService.presentErrorToast('Update Cancelled');
        }

        if (
          autoUpdaterEvent.event === 'update-downloaded' ||
          autoUpdaterEvent.event === 'update-cancelled' ||
          autoUpdaterEvent.event === 'error'
        ) {
          await this.updateModalComponent().updateModal().dismiss();
        }
      }),
      switchMap((autoUpdaterEvent) => {
        if (autoUpdaterEvent.event === 'download-progress') {
          return of(autoUpdaterEvent.progressInfo);
        }

        return of({
          total: 0,
          delta: 0,
          transferred: 0,
          percent: 0,
          bytesPerSecond: 0,
        });
      })
    ),
    {
      initialValue: {
        total: 0,
        delta: 0,
        transferred: 0,
        percent: 0,
        bytesPerSecond: 0,
      },
    }
  );

  private async presentAlert(
    header: string,
    message?: string,
    buttons?: (AlertButton | string)[]
  ): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons,
    });
    await alert.present();
  }

  private formatTimestamp(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `[${hours}:${minutes}:${seconds}]`;
  }

  async handleAutoScroll(): Promise<void> {
    const isAutoScrollEnabled = this.terminalOptions().isAutoScrollEnabled;

    if (isAutoScrollEnabled) {
      const terminalTextArea = this.terminalComponent().terminalTextArea();
      const textarea = await terminalTextArea.getInputElement();

      textarea.scrollTo({
        top: textarea.scrollHeight,
        behavior: 'instant',
      });
    }
  }
}
