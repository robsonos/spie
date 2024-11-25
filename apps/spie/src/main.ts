import { BrowserWindow, app } from 'electron';

import App from './app/app';
import ElectronEvents from './app/events/electron.events';
import UpdateEvents from './app/events/update.events';

export default class Main {
  static initialize(): void {
    //
  }

  static bootstrapApp(): void {
    App.main(app, BrowserWindow);
  }

  static bootstrapAppEvents(): void {
    ElectronEvents.bootstrapElectronEvents();
    UpdateEvents.bootstrapEvents();
  }
}

// handle setup events as quickly as possible
Main.initialize();

// bootstrap app
Main.bootstrapApp();
Main.bootstrapAppEvents();
