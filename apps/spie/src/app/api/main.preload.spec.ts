import { contextBridge } from 'electron';

import { electronAPI } from './main.preload';

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

describe('Electron API', () => {
  beforeEach(() => {
    (window as Window).electron = electronAPI;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Context Bridge Exposure', () => {
    it('should expose electronAPI to the main world', () => {
      expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
        'electron',
        electronAPI
      );
    });
  });
});
