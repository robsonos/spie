import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { type OpenOptions } from '@serialport/bindings-interface';
import { type Encoding, ElectronAPI } from '@spie/types';

export const electronAPI: ElectronAPI = {
  platform: process.platform,
  quitApp: (code: number) => ipcRenderer.send('quit', code),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  serialPort: {
    list: () => ipcRenderer.invoke('serial-port-list'),
    open: (openOptions: OpenOptions) =>
      ipcRenderer.invoke('serial-port-open', openOptions),
    close: () => ipcRenderer.invoke('serial-port-close'),
    write: (data: string, encoding: Encoding) =>
      ipcRenderer.invoke('serial-port-write', data, encoding),
    isOpen: () => ipcRenderer.invoke('serial-port-is-open'),
    onData: (callback: (data: string) => void, encoding: Encoding) => {
      const eventName = 'serial-port-on-data';
      const dataListener = (_: IpcRendererEvent, data: string) =>
        callback(data);
      ipcRenderer.send('serial-port-add-on-data-event-listener', encoding);
      ipcRenderer.on(eventName, dataListener);

      return () => {
        ipcRenderer.removeListener(eventName, dataListener);
        ipcRenderer.send('serial-port-remove-on-data-event-listener');
      };
    },
    onError: (callback: (error: Error) => void) => {
      const eventName = 'serial-port-on-error';
      const errorListener = (_: IpcRendererEvent, error: Error) =>
        callback(error);
      ipcRenderer.send('serial-port-add-on-error-event-listener');
      ipcRenderer.on(eventName, errorListener);

      return () => {
        ipcRenderer.removeListener(eventName, errorListener);
        ipcRenderer.send('serial-port-remove-on-error-event-listener');
      };
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);
