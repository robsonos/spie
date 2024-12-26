import { Component, computed, inject, signal, viewChild } from '@angular/core';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCol,
  IonGrid,
  IonIcon,
  IonRow,
  IonText,
} from '@ionic/angular/standalone';
import { type DataEvent } from '@spie/types';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  BehaviorSubject,
  type Observable,
  Subject,
  bufferTime,
  combineLatest,
  filter,
  from,
  map,
  merge,
  scan,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

import {
  type ChartOptions,
  type PlotterOptions,
  type Series,
} from '../../interfaces/app.interface';
import { ElectronService } from '../../services/electron.service';
import MessageParser from '../../utils/message-parser';
import { PlotterAdvancedComponent } from '../plotter-advanced-modal/plotter-advanced-modal.component';

@Component({
  selector: 'app-plotter-component',
  templateUrl: 'plotter.component.html',
  styleUrls: ['./plotter.component.scss'],
  imports: [
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCol,
    IonGrid,
    IonIcon,
    IonRow,
    IonText,
    NgApexchartsModule,
    PlotterAdvancedComponent,
  ],
})
export class PlotterComponent {
  private readonly electronService = inject(ElectronService);

  private plotterAdvancedComponent = viewChild.required(
    PlotterAdvancedComponent
  );

  constructor() {
    this.dataEvent$.subscribe();
  }

  clearSeriesSubject = new Subject<void>();

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

  private onDataDelimited$: Observable<DataEvent> = toObservable(
    this.isOpen
  ).pipe(
    switchMap(() => this.electronService.serialPort.onEvent()),
    filter((serialPortEvent) => serialPortEvent.type === 'data-delimited')
  );

  private dataEvent$ = merge(
    this.onDataDelimited$.pipe(filter(() => !this.isPausedSubject.getValue())),
    this.clearSeriesSubject.pipe(map(() => ({ type: 'clear' } as DataEvent)))
  ).pipe(
    bufferTime(50),
    filter((dataEvents) => dataEvents.length > 0),
    tap((dataEvents) => {
      dataEvents.forEach((dataEvent) => {
        if (dataEvent.type === 'clear') {
          // Clear series
          this.series.set([]);
          return;
        }

        const newSeries = MessageParser.parse(
          dataEvent.data,
          this.plotterOptions().useSampleCount
        );

        if (newSeries.length === 0) {
          console.warn('Empty series returned');
          return;
        }

        // Update series with the correct amount of variables
        if (this.series().length !== newSeries.length) {
          console.warn('Number of variables has changed');
          this.series.set(newSeries);
          return;
        }

        const numberOfPoints = this.plotterOptions().numberOfPoints;

        this.series.update((series) => {
          return series.map((dataset, index) => {
            const data = dataset.data;
            const newDataPoint = newSeries[index];

            if (newDataPoint && newDataPoint.data.length > 0) {
              const excessLength = data.length - numberOfPoints + 1;

              if (excessLength > 0) {
                data.splice(0, excessLength);
              }

              data.push(newDataPoint.data[0]);
            }

            return { ...dataset, data };
          });
        });
      });
    }),
    takeUntilDestroyed()
  );

  isPausedSubject = new BehaviorSubject<boolean>(false);

  plotterOptions = signal<PlotterOptions>({
    useSampleCount: true,
    numberOfPoints: 500,
  });

  series = signal<Series>([]);

  chartOptions = computed<ChartOptions>(() => ({
    chart: {
      type: 'line',
      animations: {
        enabled: false,
      },
      zoom: {
        enabled: this.isPaused(),
      },
      toolbar: {
        show: this.isPaused(),
      },
    },
    tooltip: {
      enabled: this.isPaused(),
      x: {
        show: true,
        // format: 'dd/MM/yy HH:mm:ss:fff', // milliseconds is not working here
        formatter: (timestamp: number) => {
          const date = new Date(timestamp);

          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = String(date.getFullYear()).slice(-2);
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

          return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}:${milliseconds}`;
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    yaxis: {
      title: { text: 'Amplitude' },
      min: (min) => min + min * 0.05,
      max: (max) => max + max * 0.05,
    },
    xaxis: {
      title: {
        text: this.plotterOptions().useSampleCount
          ? 'Sample count'
          : 'Time (ms)',
      },
      type: this.plotterOptions().useSampleCount ? 'numeric' : 'datetime',
    },
    grid: {
      show: true,
      strokeDashArray: 2,
      xaxis: {
        lines: {
          show: true,
        },
      },
    },
    stroke: {
      show: true,
      curve: 'straight',
      width: 1,
    },
    legend: {
      position: 'top',
      show: this.isPaused(),
    },
    markers: {
      size: 0,
    },
  }));

  private isPaused = toSignal(
    combineLatest([this.isPausedSubject, toObservable(this.isOpen)]).pipe(
      map(([isPaused, isOpen]) => isPaused || !isOpen)
    ),
    { initialValue: false }
  );

  onClickClearSeries(): void {
    this.clearSeriesSubject.next();
  }

  onClickPauseSeries(): void {
    const currentValue = this.isPausedSubject.getValue();
    this.isPausedSubject.next(!currentValue);
  }

  async onClickPlotterAdvancedModal(): Promise<void> {
    this.plotterAdvancedComponent().plotterAdvancedModal().present();
  }
}
