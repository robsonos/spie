import { Component, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonCard,
  IonCardContent,
  IonCol,
  IonGrid,
  IonIcon,
  IonItem,
  IonLabel,
  IonRow,
  IonSelect,
  IonSelectOption,
  LoadingController,
} from '@ionic/angular/standalone';
import {
  type OpenOptions,
  type PortInfo,
} from '@serialport/bindings-interface';
import { Subject, from, scan, startWith, switchMap, tap } from 'rxjs';

import { type SelectCustomEvent } from '../../interfaces/ionic.interface';
import { ElectronService } from '../../services/electron.service';
import { ToasterService } from '../../services/toaster.service';
import { ConnectionAdvancedComponent } from '../connection-advanced-modal/connection-advanced-modal.component';

@Component({
  selector: 'app-connection-component',
  templateUrl: 'connection.component.html',
  styleUrls: ['./connection.component.scss'],
  imports: [
    IonAccordion,
    IonAccordionGroup,
    IonButton,
    IonCard,
    IonCardContent,
    IonCol,
    IonGrid,
    IonIcon,
    IonItem,
    IonLabel,
    IonRow,
    IonSelect,
    IonSelectOption,
    ConnectionAdvancedComponent,
  ],
})
export class ConnectionComponent {
  private readonly loadingController = inject(LoadingController);
  private readonly toasterService = inject(ToasterService);
  private readonly electronService = inject(ElectronService);

  private connectionAdvancedComponent = viewChild.required(
    ConnectionAdvancedComponent
  );

  constructor() {
    this.reconnectSubject
      .pipe(
        takeUntilDestroyed(),
        tap(async () => {
          if (this.isOpen()) {
            const loading = await this.loadingController.create();
            await loading.present();
            try {
              await this.electronService.serialPort.close();
              await new Promise((resolve) => setTimeout(resolve, 100));
              await this.electronService.serialPort.open(this.openOptions());
            } catch (error) {
              await this.toasterService.presentErrorToast(error);
            }
            await loading.dismiss();
          }
        })
      )
      .subscribe();

    // Retrieve previously connected serial port (useful for development)
    this.electronService.serialPort
      .getOpenOptions()
      .then((openOptions) => {
        const connectedSerialPortPath = openOptions?.path;
        if (!connectedSerialPortPath) {
          return;
        }

        return this.electronService.serialPort.list().then((serialPorts) => {
          const isSerialPortInList = serialPorts?.some(
            (serialPort) => serialPort.path === openOptions.path
          );

          if (!isSerialPortInList) {
            return;
          }

          this.openOptions.set(openOptions);
          this.serialPorts.set(serialPorts);
        });
      })
      .catch((error) => {
        console.warn('Error initializing serial ports:', error);
      });
  }

  reconnectSubject = new Subject<void>();

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

  serialPorts = signal<PortInfo[]>([]);

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

  baudRates = [
    300, 600, 750, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400,
    460800, 500000, 921600, 1000000, 2000000,
  ];

  async onClickSerialPort(event: MouseEvent): Promise<void> {
    const pointerEvent = event as PointerEvent;
    const isClickFromMouse =
      pointerEvent.pointerId > 0 && pointerEvent.pointerType === 'mouse';
    const isClickFromKeyboard =
      pointerEvent.pointerId === -1 &&
      pointerEvent.clientX === 0 &&
      pointerEvent.clientY === 0;
    const isCypressClick =
      pointerEvent.pointerId === -1 && pointerEvent.pointerType === '';

    if (isClickFromMouse || isClickFromKeyboard || isCypressClick) {
      const loading = await this.loadingController.create();
      await loading.present();

      try {
        const serialPorts = await this.electronService.serialPort.list();
        this.serialPorts.set(serialPorts);
      } catch (error) {
        await this.toasterService.presentErrorToast(error);
      }

      await loading.dismiss();
    }
  }

  onChangeSerialPort(event: SelectCustomEvent<string>): void {
    const selectedOption = event.detail.value;
    this.openOptions.update((openOptions) => ({
      ...openOptions,
      path: selectedOption,
    }));
  }

  onChangeBaudRate(event: SelectCustomEvent<string>): void {
    const selectedOption = event.detail.value;
    this.openOptions.update((openOptions) => ({
      ...openOptions,
      baudRate: parseInt(selectedOption, 10),
    }));

    this.reconnectSubject.next();
  }

  async onClickConnect(): Promise<void> {
    const loading = await this.loadingController.create();
    await loading.present();

    try {
      if (this.isOpen()) {
        await this.electronService.serialPort.close();
      } else {
        await this.electronService.serialPort.open(this.openOptions());
      }
    } catch (error) {
      await this.toasterService.presentErrorToast(error);
    }

    await loading.dismiss();
  }

  async onClickConnectionAdvancedModal() {
    this.connectionAdvancedComponent().connectionAdvancedModal().present();
  }
}
