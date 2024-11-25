import { Component, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
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
  ToastController,
} from '@ionic/angular/standalone';
import {
  type OpenOptions,
  type PortInfo,
} from '@serialport/bindings-interface';
import type { Delimiter, Encoding } from '@spie/types';
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';
import { Subject, map, scan, startWith, switchMap, tap } from 'rxjs';

import { ElectronService } from './electron.service';

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
  private readonly loadingController = inject(LoadingController);
  private readonly toastController = inject(ToastController);
  private readonly electronService = inject(ElectronService);

  constructor() {
    addIcons({ settingsOutline });
    effect(() => {
      if (this.unhandledError()) {
        this.presentErrorToast(this.unhandledError());
      }
    });
  }
  terminalTextArea = viewChild<IonTextarea>('terminalTextArea');
  sendInput = viewChild<IonInput>('sendInput');

  private clearTerminalSubject = new Subject<void>();

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
  isOpen = signal(false);
  isAutoScrollEnabled = signal(true);
  showTimestampsEnabled = signal(false);
  isSendInputValid = signal(false);
  unhandledError = toSignal(this.electronService.serialPort.onError());
  data = toSignal<string>(
    this.clearTerminalSubject.pipe(
      startWith(''),
      switchMap(() =>
        this.electronService.serialPort.onData(this.terminalEncoding()).pipe(
          startWith(''),
          map((value) => {
            if (!value) {
              return '';
            }

            if (!this.showTimestampsEnabled()) {
              return value;
            }

            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
            const timestamp = `${hours}:${minutes}:${seconds}`;

            return `[${timestamp}] ${value}`;
          }),
          scan(
            (acc, value) => {
              if (value) {
                acc.items.push(value);
                acc.length += value.length;
              }

              while (acc.length > this.scrollbackLength() * 10000) {
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
          tap(async () => {
            const terminalTextArea = this.terminalTextArea();
            if (this.isAutoScrollEnabled() && terminalTextArea) {
              const textarea = await terminalTextArea.getInputElement();
              textarea.scrollTo({
                top: textarea.scrollHeight,
                behavior: 'instant',
              });
            }
          })
        )
      )
    )
  );

  async onClickSerialPort(event: MouseEvent): Promise<void> {
    const pointerEvent = event as PointerEvent;
    const isOpenFromMouse =
      pointerEvent.pointerId > 0 && pointerEvent.pointerType === 'mouse';
    const isOpenFromKeyboard =
      pointerEvent.pointerId === -1 &&
      pointerEvent.clientX === 0 &&
      pointerEvent.clientY === 0;

    if (isOpenFromMouse || isOpenFromKeyboard) {
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
      this.isOpen.set(true);
    } catch (error) {
      // TODO: port is already connected. disconnect and retry
      this.presentErrorToast(error);
    }

    await loading.dismiss();
  }

  async onClickDisconnect(): Promise<void> {
    const loading = await this.loadingController.create();
    await loading.present();

    try {
      await this.electronService.serialPort.close();
      this.isOpen.set(false);
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
    this.clearTerminalSubject.next();
  }

  onChangeTerminalEncoding(event: SelectCustomEvent<Encoding>): void {
    const selectedOption = event.detail.value;
    this.terminalEncoding.set(selectedOption);
    this.clearTerminalSubject.next();
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
        const waitForDrainNeeded = !this.electronService.serialPort.write(
          data,
          this.sendEncoding()
        );

        if (!waitForDrainNeeded) {
          console.warn('waitForDrainNeeded'); // TODO: improve this
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

  async applyConnectAdvanced(): Promise<void> {
    const isOpen = await this.electronService.serialPort.isOpen();

    if (isOpen && this.isOpen()) {
      const loading = await this.loadingController.create();
      await loading.present();
      try {
        await this.electronService.serialPort.close();
        this.isOpen.set(false);
        await this.electronService.serialPort.open(this.openOptions());
        this.isOpen.set(true);
      } catch (error) {
        this.presentErrorToast(error);
      }
      await loading.dismiss();
    }
  }

  async presentErrorToast(error: unknown): Promise<void> {
    const toast = await this.toastController.create({
      message: `${error}`,
      duration: 3000,
      position: 'bottom',
      color: 'danger',
    });

    await toast.present();
  }
}
