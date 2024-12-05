import { type OpenOptions } from '@serialport/bindings-interface';
import {
  type AutoUpdaterEvent,
  type ElectronAPI,
  type Encoding,
  type SerialPortEvent,
} from '@spie/types';
import { type IpcRendererEvent, contextBridge, ipcRenderer } from 'electron';

export const electronAPI: ElectronAPI = {
  platform: process.platform,
  quit: (code: number) => ipcRenderer.send('quit', code),
  getVersion: () => ipcRenderer.invoke('app-get-version'),
  downloadUpdate: () => ipcRenderer.invoke('app-download-update'),
  installUpdate: () => ipcRenderer.invoke('app-install-update'),
  onUpdateEvent: (callback: (autoUpdaterEvent: AutoUpdaterEvent) => void) => {
    const eventName = 'app-update-notification';
    const dataListener = (
      _: IpcRendererEvent,
      autoUpdaterEvent: AutoUpdaterEvent
    ) => callback(autoUpdaterEvent);
    ipcRenderer.send('app-update-add-notification-event-listener');
    ipcRenderer.on(eventName, dataListener);

    return () => {
      ipcRenderer.removeListener(eventName, dataListener);
      ipcRenderer.send('app-update-remove-notification-event-listener');
    };
  },
  serialPort: {
    list: () => ipcRenderer.invoke('serial-port-list'),
    open: (openOptions: OpenOptions) =>
      ipcRenderer.invoke('serial-port-open', openOptions),
    close: () => ipcRenderer.invoke('serial-port-close'),
    write: (data: string, encoding: Encoding) =>
      ipcRenderer.invoke('serial-port-write', data, encoding),
    isOpen: () => ipcRenderer.invoke('serial-port-is-open'),
    setReadEncoding: (encoding: Encoding) =>
      ipcRenderer.invoke('serial-port-set-read-encoding', encoding),
    getReadEncoding: () => ipcRenderer.invoke('serial-port-get-read-encoding'),
    getOpenOptions: () => ipcRenderer.invoke('serial-port-get-open-options'),
    onEvent: (callback: (serialPortEvent: SerialPortEvent) => void) => {
      const eventName = 'serial-port-notification';
      const dataListener = (
        _: IpcRendererEvent,
        serialPortEvent: SerialPortEvent
      ) => callback(serialPortEvent);
      ipcRenderer.send('serial-port-add-notification-event-listener');
      ipcRenderer.on(eventName, dataListener);

      return () => {
        ipcRenderer.removeListener(eventName, dataListener);
        ipcRenderer.send('serial-port-remove-notification-event-listener');
      };
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);
