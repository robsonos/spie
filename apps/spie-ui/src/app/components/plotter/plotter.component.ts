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
import { type ChartDataset, type ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
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
    BaseChartDirective,
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
        this.chartDatasets.set([]);
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
    bufferTime(10),
    tap((workerResults: WorkerResult[]) => {
      workerResults.forEach((workerResult) => {
        const newChartDatasets = workerResult.chartDatasets;

        // TODO: Check if this is needed on tests
        if (newChartDatasets.length === 0) {
          return;
        }

        // Update series with the correct amount of variables
        if (this.chartDatasets().length !== newChartDatasets.length) {
          console.warn('Number of variables has changed');

          this.chartDatasets.set(newChartDatasets);

          return;
        }

        const scrollbackLength = 1000; // TODO: add to advanced settings

        this.chartDatasets.update((datasets) => {
          return datasets.map((dataset, index) => {
            const data = dataset.data as { x: any; y: any }[];
            const newDataPoint = newChartDatasets[index];

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

  chartDatasets = signal<ChartDataset<'line'>[]>([]);
  chartOptions = computed<ChartOptions<'line'>>(() => ({
    animation: false,
    parsing: false,
    datasets: {
      line: {
        pointRadius: 0,
        borderWidth: 1,
        pointHoverRadius: this.isPaused() ? 3 : 0,
      },
    },
    interaction: {
      intersect: false,
    },
    plugins: {
      tooltip: {
        enabled: this.isPaused(),
        callbacks: {
          title: (context) => {
            const timestamp = context[0].parsed.x;
            const date = new Date(timestamp);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = String(date.getFullYear()).slice(-2);
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            const milliseconds = String(date.getMilliseconds()).padStart(
              3,
              '0'
            );

            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}:${milliseconds}`;
          },
        },
      },
      decimation: {
        enabled: true,
        algorithm: 'min-max',
      },
      legend: {
        display: this.isPaused(),
      },
      zoom: {
        // TODO: context menu to reset zoom
        zoom: {
          wheel: {
            enabled: this.isPaused(),
          },
          pinch: {
            enabled: this.isPaused(),
          },
          drag: {
            enabled: this.isPaused(),
          },
          mode: 'x',
          animation: {
            duration: 0,
          },
        },
      },
    },
    elements: {
      line: {
        tension: 0,
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Amplitude',
        },
        grid: {
          color: '#2C353A',
        },
        ticks: {
          color: '#DAE3E3',
        },
      },
      x: {
        type: 'time',
        time: {
          unit: 'second',
          displayFormats: {
            second: 'dd/MM/yy HH:mm:ss',
          },
        },
        title: {
          display: true,
          text: 'Time (ms)',
        },
        grid: {
          color: '#2C353A',
        },
        ticks: {
          display: this.isPaused(),
          color: '#DAE3E3',
        },
        bounds: 'data',
      },
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
