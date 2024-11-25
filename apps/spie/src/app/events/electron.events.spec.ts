import { ipcRenderer } from 'electron';

import { electronAPI } from '../api/main.preload';

jest.mock('electron', () => ({
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

describe('Electron events', () => {
  beforeEach(() => {
    (window as Window).electron = electronAPI;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('platform', () => {
    it('should expose the correct platform value', () => {
      expect(window.electron.platform).toBe(process.platform);
    });
  });

  describe('quit', () => {
    it('should send quit event with the specified code', () => {
      const code = 1;
      window.electron.quit(code);
      expect(ipcRenderer.send).toHaveBeenCalledWith('quit', code);
    });
  });

  describe('getVersion', () => {
    it('should invoke app-get-version and return the version', async () => {
      const mockVersion = '1.0.0';
      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(mockVersion);

      const version = await window.electron.getVersion();
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('app-get-version');
      expect(version).toBe(mockVersion);
    });

    it('should handle errors in getVersion gracefully', async () => {
      const error = new Error('Test Error');
      (ipcRenderer.invoke as jest.Mock).mockRejectedValue(error);

      await expect(window.electron.getVersion()).rejects.toThrow('Test Error');
    });
  });
});
