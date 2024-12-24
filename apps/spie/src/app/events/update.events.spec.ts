import { type AutoUpdaterEvent } from '@spie/types';
import { ipcRenderer } from 'electron';
import {
  type ProgressInfo,
  type UpdateDownloadedEvent,
  type UpdateInfo,
} from 'electron-updater';

import { electronAPI } from '../api/main.preload';

jest.mock('electron', () => ({
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
  },
  ipcRenderer: {
    send: jest.fn(),
    invoke: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
  },
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
}));

jest.mock('electron-updater', () => ({
  autoUpdater: {
    checkForUpdates: jest.fn(),
    downloadUpdate: jest.fn(),
    quitAndInstall: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

describe('Update Events', () => {
  beforeEach(() => {
    (window as Window).electron = electronAPI;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadUpdate', () => {
    it('should invoke downloadUpdate correctly', async () => {
      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(true);

      const result = await window.electron.downloadUpdate();
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('app-download-update');
      expect(result).toBe(true);
    });

    it('should handle download errors', async () => {
      const error = new Error('Download failed');
      (ipcRenderer.invoke as jest.Mock).mockRejectedValue(error);

      await expect(window.electron.downloadUpdate()).rejects.toThrow(
        'Download failed'
      );
    });
  });

  describe('installUpdate', () => {
    it('should invoke installUpdate correctly', async () => {
      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(undefined);

      await window.electron.installUpdate();
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('app-install-update');
    });

    it('should handle installation errors', async () => {
      const error = new Error('Install failed');
      (ipcRenderer.invoke as jest.Mock).mockRejectedValue(error);

      await expect(window.electron.installUpdate()).rejects.toThrow(
        'Install failed'
      );
    });
  });

  describe('onUpdateEvent', () => {
    it('should handle update notifications correctly', () => {
      const callback = jest.fn();
      const mockData = {
        type: 'update-available',
        updateInfo: { version: '1.2.3' },
      };

      (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) => {
        listener({}, mockData);
      });

      const cleanup = window.electron.onUpdateEvent(callback);

      expect(ipcRenderer.send).toHaveBeenCalledWith(
        'app-update-event-add-listener'
      );
      expect(ipcRenderer.on).toHaveBeenCalledWith(
        'app-update-event',
        expect.any(Function)
      );

      expect(callback).toHaveBeenCalledWith(mockData);

      cleanup();
      expect(ipcRenderer.removeListener).toHaveBeenCalledWith(
        'app-update-event',
        expect.any(Function)
      );
      expect(ipcRenderer.send).toHaveBeenCalledWith(
        'app-update-event-remove-listener'
      );
    });
  });
});

describe('onUpdateEvent', () => {
  it('should add listener', () => {
    const callback = jest.fn();

    const cleanup = window.electron.onUpdateEvent(callback);

    expect(ipcRenderer.send).toHaveBeenCalledWith(
      'app-update-event-add-listener'
    );
    expect(ipcRenderer.on).toHaveBeenCalledWith(
      'app-update-event',
      expect.any(Function)
    );

    cleanup();
  });

  it('should handle error event', () => {
    const callback = jest.fn();
    const error = new Error('Test error');
    const mockEvent: AutoUpdaterEvent = { type: 'error', error };

    (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) => {
      listener({}, mockEvent);
    });

    window.electron.onUpdateEvent(callback);

    expect(callback).toHaveBeenCalledWith(mockEvent);
  });

  it('should handle checking-for-update event', () => {
    const callback = jest.fn();
    const mockEvent: AutoUpdaterEvent = { type: 'checking-for-update' };

    (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) => {
      listener({}, mockEvent);
    });

    window.electron.onUpdateEvent(callback);

    expect(callback).toHaveBeenCalledWith(mockEvent);
  });

  it('should handle update-not-available event', () => {
    const callback = jest.fn();
    const updateInfo: UpdateInfo = {
      version: '1.0.0',
      files: [],
      path: '/test',
      sha512: 'test',
      releaseDate: new Date().toISOString(),
    };
    const mockEvent: AutoUpdaterEvent = {
      type: 'update-not-available',
      updateInfo,
    };

    (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) => {
      listener({}, mockEvent);
    });

    window.electron.onUpdateEvent(callback);

    expect(callback).toHaveBeenCalledWith(mockEvent);
  });

  it('should handle update-available event', () => {
    const callback = jest.fn();
    const updateInfo: UpdateInfo = {
      version: '1.0.0',
      files: [],
      path: '/test',
      sha512: 'test',
      releaseDate: new Date().toISOString(),
    };
    const mockEvent: AutoUpdaterEvent = {
      type: 'update-available',
      updateInfo,
    };

    (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) => {
      listener({}, mockEvent);
    });

    window.electron.onUpdateEvent(callback);

    expect(callback).toHaveBeenCalledWith(mockEvent);
  });

  it('should handle update-downloaded event', () => {
    const callback = jest.fn();
    const updateDownloadedEvent: UpdateDownloadedEvent = {
      downloadedFile: '/test/test.exe',
      version: '1.0.0',
      files: [],
      path: '/test',
      sha512: 'test',
      releaseDate: new Date().toISOString(),
    };
    const mockEvent: AutoUpdaterEvent = {
      type: 'update-downloaded',
      updateDownloadedEvent,
    };

    (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) => {
      listener({}, mockEvent);
    });

    window.electron.onUpdateEvent(callback);

    expect(callback).toHaveBeenCalledWith(mockEvent);
  });

  it('should handle download-progress event', () => {
    const callback = jest.fn();
    const progressInfo: ProgressInfo = {
      total: 100,
      delta: 1,
      transferred: 75.5,
      percent: 75.5,
      bytesPerSecond: 1115.55,
    };
    const mockEvent: AutoUpdaterEvent = {
      type: 'download-progress',
      progressInfo,
    };

    (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) => {
      listener({}, mockEvent);
    });

    window.electron.onUpdateEvent(callback);

    expect(callback).toHaveBeenCalledWith(mockEvent);
  });

  it('should handle update-cancelled event', () => {
    const callback = jest.fn();
    const updateInfo: UpdateInfo = {
      version: '1.0.0',
      files: [],
      path: '/test',
      sha512: 'test',
      releaseDate: new Date().toISOString(),
    };
    const mockEvent: AutoUpdaterEvent = {
      type: 'update-cancelled',
      updateInfo,
    };

    (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) => {
      listener({}, mockEvent);
    });

    window.electron.onUpdateEvent(callback);

    expect(callback).toHaveBeenCalledWith(mockEvent);
  });

  it('should remove listener', () => {
    const callback = jest.fn();

    const cleanup = window.electron.onUpdateEvent(callback);
    cleanup();

    expect(ipcRenderer.removeListener).toHaveBeenCalledWith(
      'app-update-event',
      expect.any(Function)
    );
    expect(ipcRenderer.send).toHaveBeenCalledWith(
      'app-update-event-remove-listener'
    );
  });
});
