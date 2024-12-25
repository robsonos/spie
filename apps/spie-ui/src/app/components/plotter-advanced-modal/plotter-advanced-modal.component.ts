import { Component, model, output, viewChild } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
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
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import {
  NUMBER_OF_POINTS_VALUES,
  type PlotterOptions,
} from '../../interfaces/app.interface';
import {
  type CheckboxCustomEvent,
  type RangeCustomEvent,
} from '../../interfaces/ionic.interface';

@Component({
  selector: 'app-plotter-advanced-modal-component',
  templateUrl: 'plotter-advanced-modal.component.html',
  styleUrls: ['./plotter-advanced-modal.component.scss'],
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
    IonTitle,
    IonToolbar,
    MatTooltipModule,
  ],
})
export class PlotterAdvancedComponent {
  plotterOptions = model.required<PlotterOptions>();
  clearChart = output<void>();

  plotterAdvancedModal = viewChild.required<IonModal>('plotterAdvancedModal');

  NUMBER_OF_POINTS_VALUES = NUMBER_OF_POINTS_VALUES;

  onChangeUseSampleCount(event: CheckboxCustomEvent<boolean>): void {
    const selectedOption = event.detail.checked;
    this.plotterOptions.update((plotterOptions) => ({
      ...plotterOptions,
      useSampleCount: selectedOption,
    }));

    this.clearChart.emit();
  }

  onChangeNumberOfPoints(event: RangeCustomEvent): void {
    const index = event.detail.value as number;
    const selectedOption = NUMBER_OF_POINTS_VALUES[index];
    this.plotterOptions.update((plotterOptions) => ({
      ...plotterOptions,
      numberOfPoints: selectedOption,
    }));
  }

  pinFormatter(index: number): string {
    const rangeValues = NUMBER_OF_POINTS_VALUES;
    return `${rangeValues[index]}`;
  }
}
