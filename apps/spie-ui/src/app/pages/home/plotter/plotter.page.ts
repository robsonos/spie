import { Component } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { PlotterComponent } from '../../../components/plotter/plotter.component';

@Component({
  selector: 'app-plotter',
  templateUrl: 'plotter.page.html',
  styleUrls: ['./plotter.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, PlotterComponent],
})
export class PlotterPage {}
