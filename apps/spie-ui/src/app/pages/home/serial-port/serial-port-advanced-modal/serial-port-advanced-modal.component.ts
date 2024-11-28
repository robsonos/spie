import { Component, input, model, viewChild } from '@angular/core';
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
import { type OpenOptions } from '@serialport/bindings-interface';
import { type Subject } from 'rxjs';

import {
  type CheckboxCustomEvent,
  type SelectCustomEvent,
} from '../../../../interfaces/ionic.interface';

@Component({
  selector: 'app-serial-port-advanced-modal',
  templateUrl: 'serial-port-advanced-modal.component.html',
  styleUrls: ['./serial-port-advanced-modal.component.scss'],
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
export class SerialPortAdvancedComponent {
  reconnectSubject = input.required<Subject<void>>();
  openOptions = model.required<OpenOptions>();

  serialPortAdvancedModal = viewChild.required<IonModal>(
    'serialPortAdvancedModal'
  );

  onChangeDataBits(event: SelectCustomEvent<string>): void {
    const selectedOption = event.detail.value;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      dataBits: parseInt(selectedOption, 10) as 5 | 6 | 7 | 8,
    }));

    this.reconnectSubject().next();
  }

  onChangeStopBits(event: SelectCustomEvent<string>): void {
    const selectedOption = event.detail.value;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      stopBits: parseFloat(selectedOption) as 1 | 1.5 | 2,
    }));

    this.reconnectSubject().next();
  }

  onChangeParity(event: SelectCustomEvent<string>): void {
    const selectedOption = event.detail.value;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      parity: selectedOption,
    }));

    this.reconnectSubject().next();
  }

  onChangeRtscts(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      rtscts: selectedOption,
    }));

    this.reconnectSubject().next();
  }

  onChangeXon(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      xon: selectedOption,
    }));

    this.reconnectSubject().next();
  }

  onChangeXoff(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      xoff: selectedOption,
    }));

    this.reconnectSubject().next();
  }

  onChangeXany(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      xany: selectedOption,
    }));

    this.reconnectSubject().next();
  }

  onChangeHupcl(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.openOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      hupcl: selectedOption,
    }));

    this.reconnectSubject().next();
  }
}
