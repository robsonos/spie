import {
  Component,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import {
  IonButton,
  IonCard,
  IonCardHeader,
  IonCol,
  IonGrid,
  IonIcon,
  IonItem,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonText,
  LoadingController,
} from '@ionic/angular/standalone';
import {
  type OpenOptions,
  type PortInfo,
} from '@serialport/bindings-interface';
import { type Subject } from 'rxjs';

import { ConnectionAdvancedComponent } from './connection-advanced-modal/connection-advanced-modal.component';
import { type SelectCustomEvent } from '../../../interfaces/ionic.interface';
import { ElectronService } from '../../../services/electron.service';
import { ToasterService } from '../../../services/toaster.service';

@Component({
  selector: 'app-connection',
  templateUrl: './connection.component.html',
  styleUrls: ['./connection.component.scss'],
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
    IonSelect,
    IonSelectOption,
    IonText,
    ConnectionAdvancedComponent,
  ],
})
export class ConnectionComponent {
  private readonly loadingController = inject(LoadingController);
  private readonly toasterService = inject(ToasterService);
  private readonly electronService = inject(ElectronService);

  reconnectSubject = input.required<Subject<void>>();
  isOpen = input.required<boolean>();
  openOptions = model.required<OpenOptions>();

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

    this.reconnectSubject().next();
  }

  async onClickDisconnect(): Promise<void> {
    const loading = await this.loadingController.create();
    await loading.present();

    try {
      await this.electronService.serialPort.close();
    } catch (error) {
      await this.toasterService.presentErrorToast(error);
    }

    await loading.dismiss();
  }

  async onClickConnect(): Promise<void> {
    const loading = await this.loadingController.create();
    await loading.present();

    try {
      await this.electronService.serialPort.open(this.openOptions());
    } catch (error) {
      await this.toasterService.presentErrorToast(error);
    }

    await loading.dismiss();
  }

  async onClickConnectionAdvancedModal() {
    this.connectionAdvancedComponent().connectionAdvancedModal().present();
  }
}
