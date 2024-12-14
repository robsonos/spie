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
  IonRange,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { type Encoding } from '@spie/types';
import { type Subject } from 'rxjs';

import {
  type CheckboxCustomEvent,
  type RangeCustomEvent,
  type SelectCustomEvent,
} from '../../interfaces/ionic.interface';
import { ElectronService } from '../../services/electron.service';
import { SerialPortService } from '../../services/serial-port.service';

@Component({
  selector: 'app-terminal-advanced-modal-component',
  templateUrl: 'terminal-advanced-modal.component.html',
  styleUrls: ['./terminal-advanced-modal.component.scss'],
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

  clearTerminalSubject = input.required<Subject<void>>();
  terminalOptions = this.serialPortService.terminalOptions;

  terminalAdvancedModal = viewChild.required<IonModal>('terminalAdvancedModal');

  onChangeTerminalEncoding(event: SelectCustomEvent<Encoding>): void {
    const selectedOption = event.detail.value;
    this.terminalOptions.update((terminalOptions) => ({
      ...terminalOptions,
      encoding: selectedOption,
    }));

    this.electronService.serialPort.setReadEncoding(selectedOption);
    this.clearTerminalSubject().next();
  }

  onChangeShowTimestamps(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.terminalOptions.update((terminalOptions) => ({
      ...terminalOptions,
      showTimestampsEnabled: selectedOption,
    }));

    this.clearTerminalSubject().next();
  }

  onChangeAutoScroll(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.terminalOptions.update((terminalOptions) => ({
      ...terminalOptions,
      isAutoScrollEnabled: selectedOption,
    }));

    // this.clearTerminalSubject().next();
  }
  onScrollbackLength(event: RangeCustomEvent): void {
    const selectedOption = event.detail.value as number;
    this.terminalOptions.update((terminalOptions) => ({
      ...terminalOptions,
      scrollbackLength: selectedOption,
    }));

    // this.clearTerminalSubject().next();
  }

  pinFormatter(value: number): string {
    return `${value}0k`;
  }
}
