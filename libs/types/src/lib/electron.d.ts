import {
  type OpenOptions,
  type PortInfo,
} from '@serialport/bindings-interface';
import {
  type ProgressInfo,
  type UpdateDownloadedEvent,
  type UpdateInfo,
} from 'electron-updater';

export type AutoUpdaterEvent =
  | { event: 'error'; error: Error; message?: string }
  | { event: 'checking-for-update' }
  | { event: 'update-not-available'; updateInfo: UpdateInfo }
  | { event: 'update-available'; updateInfo: UpdateInfo }
  | { event: 'update-downloaded'; updateDownloadedEvent: UpdateDownloadedEvent }
  | { event: 'download-progress'; progressInfo: ProgressInfo }
  | { event: 'update-cancelled'; updateInfo: UpdateInfo };

export type Delimiter = 'none' | 'cr' | 'lf' | 'crlf';
export type Encoding = 'ascii' | 'hex';
export type SerialPortEventType = 'error' | 'open' | 'close' | 'data' | 'drain';
export type SerialPortEvent =
  | { event: 'error'; error: Error }
  | { event: 'open' }
  | { event: 'close' }
  | { event: 'data'; data: string }
  | { event: 'drain' };

export interface ElectronAPI {
  platform: string;
  quit: (code: number) => void;
  getVersion: () => Promise<string>;
  downloadUpdate: () => Promise<string>;
  installUpdate: () => Promise<Array<string>>;
  onUpdateEvent: (
    callback: (autoUpdaterEvent: AutoUpdaterEvent) => void
  ) => () => void;
  serialPort: {
    list: () => Promise<PortInfo[]>;
    open: (openOptions: OpenOptions) => Promise<void>;
    close: () => Promise<void>;
    write: (data: string, encoding: Encoding) => Promise<boolean>;
    isOpen: () => Promise<boolean>;
    setReadEncoding: (encoding: Encoding) => Promise<void>;
    onEvent: (
      callback: (serialPortEvent: SerialPortEvent) => void
    ) => () => void;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
