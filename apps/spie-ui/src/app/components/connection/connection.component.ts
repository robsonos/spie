import { Component, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { type PortInfo } from '@serialport/bindings-interface';
import { Subject, tap } from 'rxjs';

import { type SelectCustomEvent } from '../../interfaces/ionic.interface';
import { ElectronService } from '../../services/electron.service';
import { SerialPortService } from '../../services/serial-port.service';
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
  private readonly serialPortService = inject(SerialPortService);

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
              await this.electronService.serialPort.open(this.openOptions());
              this.serialPortService.clearDataSubject.next();
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
        console.error('Error initializing serial ports:', error); // TODO: Toaster?
      });
  }

  isOpen = this.serialPortService.isOpen;
  openOptions = this.serialPortService.openOptions;
  reconnectSubject = new Subject<void>();

  private connectionAdvancedComponent = viewChild.required(
    ConnectionAdvancedComponent
  );

  baudRates = [
    110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 31250, 38400,
    57600, 115200,
  ];
  serialPorts = signal<PortInfo[]>([]);

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
