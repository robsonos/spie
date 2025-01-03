import * as fs from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

import { BrowserWindow, app, screen } from 'electron';

import { rendererAppName, rendererAppPort } from './constants';
import { environment } from '../environments/environment';

export default class App {
  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
  static mainWindow: Electron.BrowserWindow;
  static application: Electron.App;
  static BrowserWindow;

  // Path to the window state file
  private static windowStateFile = join(
    app.getPath('userData'),
    'window-state.json'
  );

  public static isDevelopmentMode(): boolean {
    return !environment.production;
  }

  private static onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      App.application.quit();
    }
  }

  private static onClose() {
    // Store current window state
    App.saveWindowState();

    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    App.mainWindow = null;
  }

  private static onReady() {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    if (rendererAppName) {
      App.initMainWindow();
      App.loadMainWindow();
    }
  }

  private static onActivate() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (App.mainWindow === null) {
      App.onReady();
    }
  }

  // Retrieve window state from file, with defaults if not available
  private static getWindowState() {
    try {
      return JSON.parse(fs.readFileSync(App.windowStateFile, 'utf-8'));
    } catch {
      const primaryDisplay = screen.getPrimaryDisplay().workAreaSize;
      return {
        width: Math.min(1280, primaryDisplay.width),
        height: Math.min(720, primaryDisplay.height),
        x: undefined,
        y: undefined,
      };
    }
  }

  // Save the window state to file
  private static saveWindowState() {
    if (!App.mainWindow) {
      return;
    }

    const { x, y, width, height } = App.mainWindow.getBounds();
    const windowState = { x, y, width, height };
    fs.writeFileSync(App.windowStateFile, JSON.stringify(windowState));
  }

  private static initMainWindow() {
    const windowState = App.getWindowState();

    App.mainWindow = new BrowserWindow({
      width: windowState.width,
      height: windowState.height,
      x: windowState.x,
      y: windowState.y,
      show: false,
      webPreferences: {
        contextIsolation: true,
        backgroundThrottling: false,
        preload: join(__dirname, 'main.preload.js'),
      },
    });

    App.mainWindow.setMenu(null);

    // if main window is ready to show, close the splash window and show the main window
    App.mainWindow.once('ready-to-show', () => {
      App.mainWindow.show();
    });

    // Emitted when the window is going to be closed.
    App.mainWindow.on('close', () => {
      App.onClose();
    });

    // Emitted when the window is closed.
    App.mainWindow.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      App.mainWindow = null;
    });
  }

  private static loadMainWindow() {
    // load the index.html of the app.
    if (!App.application.isPackaged) {
      App.mainWindow.loadURL(`http://localhost:${rendererAppPort}`);
    } else {
      App.mainWindow.loadURL(
        pathToFileURL(
          join(__dirname, '..', rendererAppName, 'browser', 'index.html')
        ).href
      );
    }
    if (App.isDevelopmentMode()) {
      App.mainWindow.webContents.openDevTools();
    }
  }

  static main(app: Electron.App, browserWindow: typeof BrowserWindow): void {
    // we pass the Electron.App object and the
    // Electron.BrowserWindow into this function
    // so this class has no dependencies. This
    // makes the code easier to write tests for

    App.BrowserWindow = browserWindow;
    App.application = app;

    App.application.on('window-all-closed', App.onWindowAllClosed); // Quit when all windows are closed.
    App.application.on('ready', App.onReady); // App is ready to load data
    App.application.on('activate', App.onActivate); // App is activated
  }
}
