import { Component, computed, inject, signal } from '@angular/core';
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
import {
  type ApexAxisChartSeries,
  type ApexChart,
  type ApexDataLabels,
  type ApexGrid,
  type ApexLegend,
  type ApexMarkers,
  type ApexStroke,
  type ApexTooltip,
  type ApexXAxis,
  type ApexYAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';
import {
  BehaviorSubject,
  Observable,
  Subject,
  bufferTime,
  combineLatest,
  filter,
  map,
  merge,
  tap,
} from 'rxjs';

import { type WorkerMessage, type WorkerResult } from './plotter.worker';
import { SerialPortService } from '../../services/serial-port.service';

interface ChartOptions {
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  grid: ApexGrid;
  stroke: ApexStroke;
  chart: ApexChart;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  markers: ApexMarkers;
}

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
  ],
})
export class PlotterComponent {
  private readonly serialPortService = inject(SerialPortService);

  constructor() {
    this.dataEvent$.subscribe();
    this.parsedPlotterData$.subscribe();
  }

  clearSeriesSubject = new Subject<void>();
  isOpen = this.serialPortService.isOpen;

  worker: Worker | undefined;
  private dataEvent$ = merge(
    this.serialPortService.dataEvent$.pipe(
      filter(() => !this.isPausedSubject.getValue())
    ),
    this.clearSeriesSubject.pipe(map(() => ({ type: 'clear' } as DataEvent)))
  ).pipe(
    // throttleTime(10),
    tap((dataEvent) => {
      if (dataEvent.type === 'clear') {
        // Clear series
        this.series.set([]);
        return;
      }

      const message: WorkerMessage = {
        message: [dataEvent.data],
      };

      this.worker?.postMessage(message);
    }),
    takeUntilDestroyed()
  );
  private parsedPlotterData$ = new Observable<WorkerResult>((observer) => {
    this.worker = new Worker(new URL('./plotter.worker', import.meta.url));

    const listener = (messageEvent: MessageEvent<WorkerResult>) => {
      observer.next(messageEvent.data);
    };

    this.worker?.addEventListener('message', listener);

    return () => {
      this.worker?.removeEventListener('message', listener);
    };
  }).pipe(
    bufferTime(50),
    tap((workerResults: WorkerResult[]) => {
      workerResults.forEach((workerResult) => {
        const newSeries = workerResult.series;

        // TODO: Check if this is needed on tests
        if (newSeries.length === 0) {
          return;
        }

        // Update series with the correct amount of variables
        if (this.series().length !== newSeries.length) {
          console.warn('Number of variables has changed');

          this.series.set(newSeries);

          return;
        }

        const scrollbackLength = 1000; // TODO: add to advanced settings

        this.series.update((series) => {
          return series.map((dataset, index) => {
            const data = dataset.data as { x: any; y: any }[];
            const newDataPoint = newSeries[index];

            if (newDataPoint && newDataPoint.data.length > 0) {
              if (data.length >= scrollbackLength) {
                data.shift();
              }

              data.push(newDataPoint.data[0] as { x: any; y: any });
            }

            return { ...dataset, data };
          });
        });
      });
    }),
    takeUntilDestroyed()
  );

  isPausedSubject = new BehaviorSubject<boolean>(false);
  private isPaused = toSignal(
    combineLatest([this.isPausedSubject, toObservable(this.isOpen)]).pipe(
      map(([isPaused, isOpen]) => isPaused || !isOpen)
    ),
    { initialValue: false }
  );

  series = signal<ApexAxisChartSeries>([]);

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
    },
    xaxis: {
      title: { text: 'Time (ms)' },
      type: 'datetime', // TODO: toggle between time and linear (sample count)
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
      curve: 'straight', // TODO: toggle between  straight and stepline?
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

  onClickClearTerminal(): void {
    this.clearSeriesSubject.next();
  }

  onClickPauseTerminal(): void {
    const currentValue = this.isPausedSubject.getValue();
    this.isPausedSubject.next(!currentValue);
  }

  async onClickTerminalAdvancedModal() {
    // this.terminalAdvancedComponent().terminalAdvancedModal().present(); // TODO
  }
}
