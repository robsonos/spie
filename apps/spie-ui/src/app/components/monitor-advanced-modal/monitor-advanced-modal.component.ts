import { Component, inject, input, model, viewChild } from '@angular/core';
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

import {
  type MonitorOptions,
  SCROLLBACK_LENGTH_VALUES,
} from '../../interfaces/app.interface';
import {
  type CheckboxCustomEvent,
  type RangeCustomEvent,
  type SelectCustomEvent,
} from '../../interfaces/ionic.interface';
import { ElectronService } from '../../services/electron.service';

@Component({
  selector: 'app-monitor-advanced-modal-component',
  templateUrl: 'monitor-advanced-modal.component.html',
  styleUrls: ['./monitor-advanced-modal.component.scss'],
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
export class MonitorAdvancedComponent {
  private readonly electronService = inject(ElectronService);

  clearMonitorSubject = input.required<Subject<void>>();
  monitorOptions = model.required<MonitorOptions>();

  monitorAdvancedModal = viewChild.required<IonModal>('monitorAdvancedModal');

  SCROLLBACK_LENGTH_VALUES = SCROLLBACK_LENGTH_VALUES;

  onChangeMonitorEncoding(event: SelectCustomEvent<Encoding>): void {
    const selectedOption = event.detail.value;
    this.monitorOptions.update((monitorOptions) => ({
      ...monitorOptions,
      encoding: selectedOption,
    }));

    this.electronService.serialPort.setReadEncoding(selectedOption);
    this.clearMonitorSubject().next();
  }

  onChangeShowTimestamps(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.monitorOptions.update((monitorOptions) => ({
      ...monitorOptions,
      showTimestampsEnabled: selectedOption,
    }));

    this.clearMonitorSubject().next();
  }

  onChangeAutoScroll(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.monitorOptions.update((monitorOptions) => ({
      ...monitorOptions,
      isAutoScrollEnabled: selectedOption,
    }));

    // this.clearMonitorSubject().next();
  }

  onChangeScrollbackLength(event: RangeCustomEvent): void {
    const index = event.detail.value as number;
    const selectedOption = SCROLLBACK_LENGTH_VALUES[index];
    this.monitorOptions.update((monitorOptions) => ({
      ...monitorOptions,
      scrollbackLength: selectedOption,
    }));

    // this.clearMonitorSubject().next();
  }

  onChangeRows(event: RangeCustomEvent): void {
    const selectedOption = event.detail.value as number;
    // const selectedOption = ROWS_VALUES[index];
    this.monitorOptions.update((monitorOptions) => ({
      ...monitorOptions,
      rows: selectedOption,
    }));

    // this.clearMonitorSubject().next();
  }

  onChangeUseReadlineParser(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.monitorOptions.update((monitorOptions) => ({
      ...monitorOptions,
      useReadlineParser: selectedOption,
    }));

    this.clearMonitorSubject().next();
  }

  pinFormatter(value: number): string {
    return `${value + 1}0k`;
  }
}
