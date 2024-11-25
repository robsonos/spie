import { Component, inject, signal, viewChild } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  type AlertButton,
  AlertController,
  IonApp,
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCheckbox,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonModal,
  IonRange,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
  LoadingController,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import {
  type OpenOptions,
  type PortInfo,
} from '@serialport/bindings-interface';
import type { Delimiter, Encoding, SerialPortEvent } from '@spie/types';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  documentOutline,
  settingsOutline,
  speedometerOutline,
  statsChartOutline,
  timeOutline,
} from 'ionicons/icons';
import { Subject, filter, from, map, merge, scan, switchMap, tap } from 'rxjs';

import { ElectronService } from './electron.service';
import { UpdateModalComponent } from './update-modal.component';

interface SelectChangeEventDetail<T> {
  value: T;
}
interface SelectCustomEvent<T> extends CustomEvent {
  detail: SelectChangeEventDetail<T>;
  target: HTMLIonSelectElement;
}

interface CheckboxChangeEventDetail<T> {
  value: T;
  checked: boolean;
}

interface CheckboxCustomEvent<T> extends CustomEvent {
  detail: CheckboxChangeEventDetail<T>;
  target: HTMLIonCheckboxElement;
}

type RangeValue = number | { lower: number; upper: number };

interface RangeChangeEventDetail {
  value: RangeValue;
}

interface RangeCustomEvent extends CustomEvent {
  detail: RangeChangeEventDetail;
  target: HTMLIonRangeElement;
}

interface InputChangeEventDetail {
  value?: string | undefined | null;
}
interface IonInputCustomEvent extends CustomEvent {
  detail: InputChangeEventDetail;
  target: HTMLIonInputElement;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    IonText,
    IonApp,
    IonButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCheckbox,
    IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonList,
    IonModal,
    IonRange,
    IonRow,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
})
export class AppComponent {
  private readonly alertController = inject(AlertController);
  private readonly loadingController = inject(LoadingController);
  private readonly modalController = inject(ModalController);
  private readonly toastController = inject(ToastController);
  private readonly electronService = inject(ElectronService);

  constructor() {
    addIcons({ settingsOutline });
    addIcons({ documentOutline });
    addIcons({ cloudUploadOutline });
    addIcons({ speedometerOutline });
    addIcons({ statsChartOutline });
    addIcons({ timeOutline });
  }

  terminalTextArea = viewChild<IonTextarea>('terminalTextArea');
  sendInput = viewChild<IonInput>('sendInput');

  baudRates = [
    110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 31250, 38400,
    57600, 115200,
  ];

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
  scrollbackLength = signal(1);
  delimiter = signal<Delimiter>('lf');
  sendEncoding = signal<Encoding>('ascii');
  terminalEncoding = signal<Encoding>('ascii');
  serialPorts = signal<PortInfo[]>([]);
  isAutoScrollEnabled = signal(true);
  showTimestampsEnabled = signal(false);
  isSendInputValid = signal(false);
  private clearTerminalSubject = new Subject<SerialPortEvent>();

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

  data = toSignal<string>(
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
        // If data it is clear terminal indication
        if (data === '') {
          return '';
        }

        if (this.showTimestampsEnabled()) {
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
          const maxLength = this.scrollbackLength() * 10000;

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
        if (this.terminalEncoding() === 'hex') {
          return buffer.items.join('\n');
        }

        return buffer.items.join('');
      }),
      tap(async () => this.handleAutoScroll())
    )
  );

  autoUpdaterEvent = toSignal(
    this.electronService.onUpdateEvent().pipe(
      tap((autoUpdaterEvent) => {
        if (autoUpdaterEvent.event === 'checking-for-update') {
          this.presentInfoToast('Checking for Updates');
        }

        if (autoUpdaterEvent.event === 'update-not-available') {
          this.presentInfoToast('No Updates Available');
        }

        if (autoUpdaterEvent.event === 'update-available') {
          this.presentAlert(
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
                  const modal = await this.modalController.create({
                    component: UpdateModalComponent,
                    backdropDismiss: false,
                    id: 'update-modal',
                    componentProps: {
                      autoUpdaterEvent: this.autoUpdaterEvent,
                    },
                  });
                  await modal.present();
                },
              },
            ]
          );
        }

        if (autoUpdaterEvent.event === 'update-downloaded') {
          this.presentAlert(
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
          this.presentErrorToast('Update Cancelled');
        }
      })
    )
  );

  async onClickSerialPort(event: MouseEvent): Promise<void> {
    const pointerEvent = event as PointerEvent;
    const isClickFromMouse =
      pointerEvent.pointerId > 0 && pointerEvent.pointerType === 'mouse';
    const isClickFromKeyboard =
      pointerEvent.pointerId === -1 &&
      pointerEvent.clientX === 0 &&
      pointerEvent.clientY === 0;

    if (isClickFromMouse || isClickFromKeyboard) {
      const loading = await this.loadingController.create();
      await loading.present();

      try {
        const serialPorts = await this.electronService.serialPort.list();
        this.serialPorts.set(serialPorts);
      } catch (error) {
        this.presentErrorToast(error);
      }

      await loading.dismiss();
    }
  }

  onChangeSerialPort(event: SelectCustomEvent<string>): void {
    const selectedOption = event.detail.value;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      path: selectedOption,
    }));
  }

  onChangeBaudRate(event: SelectCustomEvent<string>): void {
    const selectedOption = event.detail.value;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      baudRate: parseInt(selectedOption, 10),
    }));

    this.applyConnectAdvanced();
  }

  async onClickConnect(): Promise<void> {
    const loading = await this.loadingController.create();
    await loading.present();

    try {
      await this.electronService.serialPort.open(this.openOptions());
    } catch (error) {
      this.presentErrorToast(error);
    }

    await loading.dismiss();
  }

  async onClickDisconnect(): Promise<void> {
    const loading = await this.loadingController.create();
    await loading.present();

    try {
      await this.electronService.serialPort.close();
    } catch (error) {
      this.presentErrorToast(error);
    }

    await loading.dismiss();
  }

  onChangeDataBits(event: SelectCustomEvent<string>): void {
    const selectedOption = event.detail.value;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      dataBits: parseInt(selectedOption, 10) as 5 | 6 | 7 | 8,
    }));

    this.applyConnectAdvanced();
  }

  onChangeStopBits(event: SelectCustomEvent<string>): void {
    const selectedOption = event.detail.value;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      stopBits: parseFloat(selectedOption) as 1 | 1.5 | 2,
    }));

    this.applyConnectAdvanced();
  }

  onChangeParity(event: SelectCustomEvent<string>): void {
    const selectedOption = event.detail.value;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      parity: selectedOption,
    }));

    this.applyConnectAdvanced();
  }

  onChangeRtscts(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      rtscts: selectedOption,
    }));

    this.applyConnectAdvanced();
  }

  onChangeXon(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      xon: selectedOption,
    }));

    this.applyConnectAdvanced();
  }

  onChangeXoff(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      xoff: selectedOption,
    }));

    this.applyConnectAdvanced();
  }

  onChangeXany(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      xany: selectedOption,
    }));

    this.applyConnectAdvanced();
  }

  onChangeHupcl(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      hupcl: selectedOption,
    }));

    this.applyConnectAdvanced();
  }

  onClickClearTerminal(): void {
    this.clearTerminalSubject.next({ event: 'data', data: '' });
  }

  onChangeTerminalEncoding(event: SelectCustomEvent<Encoding>): void {
    const selectedOption = event.detail.value;
    this.terminalEncoding.set(selectedOption);
    this.electronService.serialPort.setReadEncoding(selectedOption);
    this.onClickClearTerminal();
  }

  onChangeAutoScroll(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.isAutoScrollEnabled.set(selectedOption);
  }

  onChangeShowTimestamps(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.showTimestampsEnabled.set(selectedOption);
  }

  onScrollbackLength(event: RangeCustomEvent): void {
    const selectedOption = event.detail.value as number;
    this.scrollbackLength.set(selectedOption);
  }

  pinFormatter(value: number): string {
    return `${value}0k`;
  }

  async onClickSend(): Promise<void> {
    const rawData = this.sendInput()?.value as string;
    if (rawData) {
      const formatHexData = (data: string): string => data.replace(/\s+/g, '');
      const formatDelimitedData = (data: string): string => {
        const delimiterMap: Record<Delimiter, string> = {
          none: '',
          cr: '\r',
          lf: '\n',
          crlf: '\r\n',
        };
        return data.concat(delimiterMap[this.delimiter()]);
      };

      const data =
        this.sendEncoding() === 'hex'
          ? formatHexData(rawData)
          : formatDelimitedData(rawData);

      try {
        const canDandleMoreData = await this.electronService.serialPort.write(
          data,
          this.sendEncoding()
        );

        if (!canDandleMoreData) {
          this.presentWarningToast('Write buffer is full!');
        }
      } catch (error) {
        this.presentErrorToast(error);
      }
    }
  }

  onChangeSendInput(event: IonInputCustomEvent): void {
    const inputValue = event.detail.value;
    if (!inputValue) {
      this.isSendInputValid.set(false);
      return;
    }

    if (this.sendEncoding() !== 'hex') {
      this.isSendInputValid.set(true);
      return;
    }

    const formattedHexValue =
      inputValue
        .replace(/[^a-fA-F0-9]/g, '')
        .toUpperCase()
        .match(/.{1,2}/g)
        ?.join(' ') ?? '';
    event.target.value = formattedHexValue;
    const isEvenLength = formattedHexValue.replace(/\s+/g, '').length % 2 === 0;
    this.isSendInputValid.set(isEvenLength);
  }

  onChangeSendEncoding(event: SelectCustomEvent<Encoding>): void {
    const selectedOption = event.detail.value;
    this.sendEncoding.set(selectedOption);
    const input = this.sendInput();
    if (input) {
      input.value = '';
    }
  }

  onChangeDelimiter(event: SelectCustomEvent<Delimiter>): void {
    const selectedOption = event.detail.value;
    this.delimiter.set(selectedOption);
    this.applyConnectAdvanced();
  }

  private async applyConnectAdvanced(): Promise<void> {
    if (this.isOpen()) {
      const loading = await this.loadingController.create();
      await loading.present();
      try {
        await this.electronService.serialPort.close();
        await this.electronService.serialPort.open(this.openOptions());
        this.onClickClearTerminal();
      } catch (error) {
        this.presentErrorToast(error);
      }
      await loading.dismiss();
    }
  }

  private async presentToast(
    header: string,
    message?: string,
    color?: string
  ): Promise<void> {
    const toast = await this.toastController.create({
      header,
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });

    await toast.present();
  }

  private async presentInfoToast(header: string): Promise<void> {
    await this.presentToast(header, undefined);
  }

  private async presentWarningToast(message: string): Promise<void> {
    await this.presentToast('Warning', message, 'warning');
  }

  private async presentErrorToast(error: unknown): Promise<void> {
    await this.presentToast('Error', `${error}`, 'danger');
  }

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
    alert.present();
  }

  private formatTimestamp(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `[${hours}:${minutes}:${seconds}]`;
  }

  private async handleAutoScroll(): Promise<void> {
    const terminalTextArea = this.terminalTextArea();
    if (this.isAutoScrollEnabled() && terminalTextArea) {
      const textarea = await terminalTextArea.getInputElement();
      textarea.scrollTo({
        top: textarea.scrollHeight,
        behavior: 'instant',
      });
    }
  }
}
