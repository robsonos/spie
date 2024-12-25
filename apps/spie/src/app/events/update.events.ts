import { join } from 'path';

import { type AutoUpdaterEvent } from '@spie/types';
import { Notification, ipcMain } from 'electron';
import {
  type ProgressInfo,
  type UpdateDownloadedEvent,
  type UpdateInfo,
  type UpdaterEvents,
  autoUpdater,
} from 'electron-updater';

import App from '../app';

export default class UpdateEvents {
  private static areListenersRegistered = false;
  private static eventListeners = new Map<
    UpdaterEvents,
    (...args: any[]) => void
  >();

  private static addEventListeners(
    event: Electron.IpcMainEvent
  ): Promise<void> {
    if (UpdateEvents.areListenersRegistered) {
      return Promise.resolve();
    }

    UpdateEvents.areListenersRegistered = true;

    const addEventListener = (
      updaterEventType: UpdaterEvents,
      callback: (...args: any[]) => void
    ) => {
      if (!UpdateEvents.eventListeners.has(updaterEventType)) {
        // console.log('UpdateEvents.addEventListener attach', updaterEventType, callback);
        autoUpdater.on(updaterEventType, callback);
        UpdateEvents.eventListeners.set(updaterEventType, callback);
      }
    };

    addEventListener('error', (error: Error, message: string) => {
      const updateNotification: AutoUpdaterEvent = {
        type: 'error',
        error,
        message,
      };
      event.sender.send('app-update-event', updateNotification);
    });

    addEventListener('checking-for-update', () => {
      const updateNotification: AutoUpdaterEvent = {
        type: 'checking-for-update',
      };
      event.sender.send('app-update-event', updateNotification);
    });

    addEventListener('update-not-available', (updateInfo: UpdateInfo) => {
      const updateNotification: AutoUpdaterEvent = {
        type: 'update-not-available',
        updateInfo,
      };
      event.sender.send('app-update-event', updateNotification);
    });

    addEventListener('update-available', (updateInfo: UpdateInfo) => {
      new Notification({
        title: 'Update Available for Download',
        body: `Version ${updateInfo.releaseName} is ready for download.`,
        icon: join(__dirname, 'assets/icon.ico'),
      }).show();

      const updateNotification: AutoUpdaterEvent = {
        type: 'update-available',
        updateInfo,
      };

      event.sender.send('app-update-event', updateNotification);
    });

    addEventListener(
      'update-downloaded',
      (updateDownloadedEvent: UpdateDownloadedEvent) => {
        const updateNotification: AutoUpdaterEvent = {
          type: 'update-downloaded',
          updateDownloadedEvent,
        };
        event.sender.send('app-update-event', updateNotification);
      }
    );

    addEventListener('download-progress', (progressInfo: ProgressInfo) => {
      const updateNotification: AutoUpdaterEvent = {
        type: 'download-progress',
        progressInfo,
      };
      event.sender.send('app-update-event', updateNotification);
    });

    addEventListener('update-cancelled', (updateInfo: UpdateInfo) => {
      const updateNotification: AutoUpdaterEvent = {
        type: 'update-cancelled',
        updateInfo,
      };
      event.sender.send('app-update-event', updateNotification);
    });

    return Promise.resolve();
  }

  private static removeEventListeners(): Promise<void> {
    if (!UpdateEvents.areListenersRegistered) {
      return Promise.resolve();
    }

    UpdateEvents.eventListeners.forEach((listener, updaterEventType) => {
      // console.log('UpdateEvents.removeEventListener', updaterEventType, callback);
      autoUpdater.off(updaterEventType, listener);
    });
    UpdateEvents.eventListeners.clear();

    UpdateEvents.areListenersRegistered = false;

    return Promise.resolve();
  }

  static bootstrapEvents(): void {
    const checkForUpdates = async () => {
      try {
        autoUpdater.autoDownload = false;
        autoUpdater.disableWebInstaller = true;

        if (App.isDevelopmentMode()) {
          autoUpdater.updateConfigPath = join(
            __dirname,
            '..',
            '..',
            '..',
            'dev-app-update.yml'
          );
          autoUpdater.allowDowngrade = true;
          autoUpdater.forceDevUpdateConfig = true;
        }
        await autoUpdater.checkForUpdates();
      } catch (error) {
        new Notification({
          title: 'Error',
          body: `${error}`,
          icon: join(__dirname, 'assets/icon.ico'),
        }).show();
      }
    };

    const delayAfterAppReady = App.isDevelopmentMode() ? 3000 : 10000;
    setTimeout(checkForUpdates, delayAfterAppReady);

    ipcMain.on('app-update-event-add-listener', (event) => {
      // console.warn('app-update-event-add-listener');

      return UpdateEvents.addEventListeners(event);
    });

    ipcMain.on('app-update-event-remove-listener', () => {
      // console.warn('app-update-event-remove-listener');
      return UpdateEvents.removeEventListeners();
    });

    ipcMain.handle('app-download-update', () => {
      // console.warn('app-download-update');
      return autoUpdater.downloadUpdate();
    });

    ipcMain.handle('app-install-update', () => {
      // console.warn('app-install-update');
      autoUpdater.quitAndInstall();

      return Promise.resolve();
    });
  }
}
