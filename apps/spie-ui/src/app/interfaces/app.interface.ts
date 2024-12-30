import { type Delimiter, type Encoding } from '@spie/types';
import {
  type ApexChart,
  type ApexDataLabels,
  type ApexGrid,
  type ApexLegend,
  type ApexMarkers,
  type ApexStroke,
  type ApexTooltip,
  type ApexXAxis,
  type ApexYAxis,
} from 'ng-apexcharts';

export const SCROLLBACK_LENGTH_VALUES = [
  10000, 20000, 30000, 40000, 50000,
] as const;
export type ScrollbackLength = (typeof SCROLLBACK_LENGTH_VALUES)[number];
export interface TerminalOptions {
  encoding: Encoding;
  isAutoScrollEnabled: boolean;
  showTimestampsEnabled: boolean;
  scrollbackLength: ScrollbackLength;
  rows: number;
  useReadlineParser: boolean;
}

export interface SendOptions {
  delimiter: Delimiter;
  encoding: Encoding;
  isSendInputValid: boolean;
}

export const NUMBER_OF_POINTS_VALUES = [50, 100, 500, 1000, 5000] as const;
export type NumberOfPoints = (typeof NUMBER_OF_POINTS_VALUES)[number];
export interface PlotterOptions {
  useSampleCount: boolean;
  numberOfPoints: NumberOfPoints;
}

export interface ChartOptions {
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

export interface Data {
  x: number;
  y: number;
}

export type Series = {
  name?: string;
  data: Data[];
}[];
