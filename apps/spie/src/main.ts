import { BrowserWindow, app } from 'electron';

import App from './app/app';
import { electronAppName } from './app/constants';
import ElectronEvents from './app/events/electron.events';
import SerialPortEvents from './app/events/serial-port.events';
import UpdateEvents from './app/events/update.events';

export default class Main {
  static initialize(): void {
    if (process.platform === 'win32') {
      app.setAppUserModelId(electronAppName);
    }
  }

  static bootstrapApp(): void {
    App.main(app, BrowserWindow);
  }

  static bootstrapAppEvents(): void {
    UpdateEvents.bootstrapEvents();
    ElectronEvents.bootstrapEvents();
    SerialPortEvents.bootstrapEvents();
  }
}

// handle setup events as quickly as possible
Main.initialize();

// bootstrap app
Main.bootstrapApp();
Main.bootstrapAppEvents();
