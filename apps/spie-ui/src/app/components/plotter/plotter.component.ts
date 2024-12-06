import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
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
  type ApexChart,
  type ApexDataLabels,
  type ApexGrid,
  type ApexStroke,
  type ApexTooltip,
  type ApexXAxis,
  type ApexYAxis,
  type ChartComponent,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { BehaviorSubject, Subject, filter, map, merge, tap } from 'rxjs';

import { SerialPortService } from '../../services/serial-port.service';

interface ChartOptions {
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  grid: ApexGrid;
  stroke: ApexStroke;
}

@Component({
  selector: 'app-plotter-component',
  templateUrl: 'plotter.component.html',
  styleUrls: ['./plotter.component.scss'],
  standalone: true,
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
  }

  chartArea = viewChild.required<ChartComponent>('chartObj');

  clearSeriesSubject = new Subject<void>();
  isOpen = this.serialPortService.isOpen;
  private dataEvent$ = merge(
    this.serialPortService.dataEvent$.pipe(
      filter(() => !this.isDataEventPausedSubject.getValue())
    ),
    this.clearSeriesSubject.pipe(map(() => ({ type: 'clear' } as DataEvent)))
  ).pipe(
    tap((dataEvent) => {
      if (dataEvent.type === 'clear') {
        // Clear series
        this.series.set([]);
        return;
      }

      const data = dataEvent.data;
      const isDataTruncated = data.split('\n').length - 1 > 1;
      if (isDataTruncated) {
        console.warn('data truncated:');
        return;
      }

      // Detect separator
      const detectedSeparator = this.detectSeparator(data);

      // Split values
      const values = detectedSeparator
        ? data
            .split(detectedSeparator)
            .map((value: string) => parseFloat(value))
        : [parseFloat(data)];

      // Update series with the correct amount of variables
      if (this.series().length !== values.length) {
        const newSeries = values.map((value: number, index: number) => ({
          name: `Variable ${index + 1}`,
          data: [{ x: Date.now(), y: value }],
        }));

        this.series.set(newSeries);
        return;
      }

      let variableData: { x: number; y: number }[][] = [];

      // Initialize variableData for the first time based on the number of variables
      if (variableData.length === 0) {
        variableData = Array.from({ length: values.length }, () => []);
      }

      // Populate data points for each variable
      values.forEach((value: number, index: number) => {
        variableData[index].push({
          x: Date.now(),
          y: value,
        });
      });

      // TODO: plotter options scrollbackLength
      const scrollbackLength = 1000;

      // Slice series based on scrollbackLength
      if (this.series()[0].data.length > scrollbackLength) {
        this.series.update((series) => {
          return series.map((variable) => {
            const data = variable.data as { x: any; y: any }[];
            const truncatedData = data.slice(1);

            return { ...variable, data: truncatedData };
          });
        });
      }

      // Update series
      this.series.update((series) => {
        return series.map((variable, index) => {
          const data = variable.data as { x: any; y: any }[];
          const updatedData = [...data, variableData[index][0]];

          return { ...variable, data: updatedData };
        });
      });
    }),
    takeUntilDestroyed()
  );
  series = signal<ApexAxisChartSeries>([]);

  isDataEventPausedSubject = new BehaviorSubject<boolean>(false);
  private isDataEventPaused = toSignal(this.isDataEventPausedSubject, {
    initialValue: false,
  });

  private detectSeparator(line: string): string {
    if (line.includes('\t')) return '\t';
    if (line.includes(',')) return ',';
    if (line.includes(' ')) return ' ';
    return '';
  }

  chart = computed<ApexChart>(() => {
    return {
      type: 'line',
      animations: {
        enabled: false,
      },
      zoom: {
        enabled: this.isDataEventPaused(),
      },
    };
  });

  tooltip = computed<ApexTooltip>(() => {
    return {
      enabled: this.isDataEventPaused(),
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
    };
  });

  chartOptions: ChartOptions = {
    dataLabels: {
      enabled: false,
    },
    yaxis: {
      // axisTicks: {
      //   show: false,
      // },
    },
    xaxis: {
      type: 'datetime',
      // axisTicks: {
      //   show: false,
      // },
    },
    grid: {
      show: true,
      strokeDashArray: 2,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    stroke: {
      show: true,
      curve: 'straight',
      width: 2,
    },
  };

  onClickClearTerminal(): void {
    this.clearSeriesSubject.next();
  }

  onClickPauseTerminal(): void {
    const currentValue = this.isDataEventPausedSubject.getValue();
    this.isDataEventPausedSubject.next(!currentValue);
  }

  async onClickTerminalAdvancedModal() {
    // this.terminalAdvancedComponent().terminalAdvancedModal().present(); // TODO
  }
}
