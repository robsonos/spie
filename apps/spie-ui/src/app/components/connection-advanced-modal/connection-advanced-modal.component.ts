import { Component, inject, input, viewChild } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { type Subject } from 'rxjs';

import {
  type CheckboxCustomEvent,
  type SelectCustomEvent,
} from '../../interfaces/ionic.interface';
import { SerialPortService } from '../../services/serial-port.service';

@Component({
  selector: 'app-connection-advanced-modal-component',
  templateUrl: 'connection-advanced-modal.component.html',
  styleUrls: ['./connection-advanced-modal.component.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonButtons,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonItem,
    IonList,
    IonModal,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
  ],
})
export class ConnectionAdvancedComponent {
  private readonly serialPortService = inject(SerialPortService);

  reconnectSubject = input.required<Subject<void>>();
  openOptions = this.serialPortService.openOptions;

  connectionAdvancedModal = viewChild.required<IonModal>(
    'connectionAdvancedModal'
  );

  onChangeDataBits(event: SelectCustomEvent<string>): void {
    const selectedOption = event.detail.value;
    this.openOptions.update((openOptions) => ({
      ...openOptions,
      dataBits: parseInt(selectedOption, 10) as 5 | 6 | 7 | 8,
    }));

    this.reconnectSubject().next();
  }

  onChangeStopBits(event: SelectCustomEvent<string>): void {
    const selectedOption = event.detail.value;
    this.openOptions.update((openOptions) => ({
      ...openOptions,
      stopBits: parseFloat(selectedOption) as 1 | 1.5 | 2,
    }));

    this.reconnectSubject().next();
  }

  onChangeParity(event: SelectCustomEvent<string>): void {
    const selectedOption = event.detail.value;
    this.openOptions.update((openOptions) => ({
      ...openOptions,
      parity: selectedOption,
    }));

    this.reconnectSubject().next();
  }

  onChangeRtscts(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.openOptions.update((openOptions) => ({
      ...openOptions,
      rtscts: selectedOption,
    }));

    this.reconnectSubject().next();
  }

  onChangeXon(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.openOptions.update((openOptions) => ({
      ...openOptions,
      xon: selectedOption,
    }));

    this.reconnectSubject().next();
  }

  onChangeXoff(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.openOptions.update((openOptions) => ({
      ...openOptions,
      xoff: selectedOption,
    }));

    this.reconnectSubject().next();
  }

  onChangeXany(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.openOptions.update((openOptions) => ({
      ...openOptions,
      xany: selectedOption,
    }));

    this.reconnectSubject().next();
  }

  onChangeHupcl(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.openOptions.update((openOptions) => ({
      ...openOptions,
      hupcl: selectedOption,
    }));

    this.reconnectSubject().next();
  }
}
