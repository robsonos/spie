import { Component, inject, viewChild } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonList,
  IonModal,
  IonRange,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { type Encoding } from '@spie/types';

import {
  type CheckboxCustomEvent,
  type RangeCustomEvent,
  type SelectCustomEvent,
} from '../../../../interfaces/ionic.interface';
import { ElectronService } from '../../../../services/electron.service';
import { SerialPortService } from '../../../../services/serial-port.service';

@Component({
  selector: 'app-terminal-advanced-modal',
  templateUrl: 'terminal-advanced-modal.component.html',
  styleUrls: ['./terminal-advanced-modal.component.scss'],
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
    IonRange,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
  ],
})
export class TerminalAdvancedComponent {
  private readonly electronService = inject(ElectronService);
  private readonly serialPortService = inject(SerialPortService);

  clearDataSubject = this.serialPortService.clearDataSubject;
  terminalOptions = this.serialPortService.terminalOptions;

  terminalAdvancedModal = viewChild.required<IonModal>('terminalAdvancedModal');

  onChangeTerminalEncoding(event: SelectCustomEvent<Encoding>): void {
    const selectedOption = event.detail.value;
    this.terminalOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      encoding: selectedOption,
    }));

    this.electronService.serialPort.setReadEncoding(selectedOption);
    this.clearDataSubject.next({ event: 'data', data: '' });
  }

  onChangeShowTimestamps(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.terminalOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      showTimestampsEnabled: selectedOption,
    }));

    this.clearDataSubject.next({ event: 'data', data: '' });
  }

  onChangeAutoScroll(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.terminalOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      isAutoScrollEnabled: selectedOption,
    }));

    // this.clearDataSubject.next({ event: 'data', data: '' });
  }
  onScrollbackLength(event: RangeCustomEvent): void {
    const selectedOption = event.detail.value as number;
    this.terminalOptions.update((currentOpenOptions) => ({
      ...currentOpenOptions,
      scrollbackLength: selectedOption,
    }));

    // this.clearDataSubject.next({ event: 'data', data: '' });
  }

  pinFormatter(value: number): string {
    return `${value}0k`;
  }
}
