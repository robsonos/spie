import { app, ipcMain } from 'electron';

import { environment } from '../../environments/environment';

export default class ElectronEvents {
  static bootstrapEvents(): void {
    ipcMain.on('quit', (_, code) => {
      // console.warn('quit');
      app.exit(code);
    });

    ipcMain.handle('app-get-version', () => {
      // console.warn('app-get-version');
      return environment.version;
    });
  }
}
