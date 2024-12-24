import { Component, inject, input, viewChild } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
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

import { SCROLLBACK_LENGTH_VALUES } from '../../interfaces/app.interface';
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
    IonIcon,
    IonItem,
    IonList,
    IonModal,
    IonRange,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
    MatTooltipModule,
  ],
})
export class TerminalAdvancedComponent {
  private readonly electronService = inject(ElectronService);
  private readonly serialPortService = inject(SerialPortService);

  clearTerminalSubject = input.required<Subject<void>>();
  terminalOptions = this.serialPortService.terminalOptions;

  terminalAdvancedModal = viewChild.required<IonModal>('terminalAdvancedModal');

  SCROLLBACK_LENGTH_VALUES = SCROLLBACK_LENGTH_VALUES;

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
    const index = event.detail.value as number;
    const selectedOption = SCROLLBACK_LENGTH_VALUES[index];
    this.terminalOptions.update((terminalOptions) => ({
      ...terminalOptions,
      scrollbackLength: selectedOption,
    }));

    // this.clearTerminalSubject().next();
  }

  onChangeUseReadlineParser(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.terminalOptions.update((terminalOptions) => ({
      ...terminalOptions,
      useReadlineParser: selectedOption,
    }));

    this.clearTerminalSubject().next();
  }

  pinFormatter(value: number): string {
    return `${value + 1}0k`;
  }
}
