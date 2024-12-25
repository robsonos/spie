import { type Routes } from '@angular/router';

import { HomePage } from './home.page';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
    children: [
      {
        path: 'terminal',
        loadComponent: () =>
          import('./terminal/terminal.page').then((m) => m.TerminalPage),
      },
      {
        path: 'plotter',
        loadComponent: () =>
          import('./plotter/plotter.page').then((m) => m.PlotterPage),
      },
      {
        path: '',
        redirectTo: 'terminal',
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
