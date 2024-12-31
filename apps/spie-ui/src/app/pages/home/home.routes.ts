import { type Routes } from '@angular/router';

import { HomePage } from './home.page';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
    children: [
      {
        path: 'monitor',
        loadComponent: () =>
          import('./monitor/monitor.page').then((m) => m.MonitorPage),
      },
      {
        path: 'plotter',
        loadComponent: () =>
          import('./plotter/plotter.page').then((m) => m.PlotterPage),
      },
      {
        path: '',
        redirectTo: 'monitor',
        pathMatch: 'full',
      },
      {
        path: '**',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
