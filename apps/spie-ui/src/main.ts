import 'chartjs-adapter-date-fns';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  PreloadAllModules,
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import {
  Colors,
  Decimation,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Tooltip,
} from 'chart.js';
import Zoom from 'chartjs-plugin-zoom';
import { provideCharts } from 'ng2-charts';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideCharts({
      registerables: [
        Tooltip,
        Decimation,
        Legend,
        Colors,
        Zoom,
        LinearScale,
        TimeScale,
        LineController,
        PointElement,
        LineElement,
      ],
    }),
  ],
});
