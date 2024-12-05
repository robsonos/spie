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
  | { type: 'error'; error: Error; message?: string }
  | { type: 'checking-for-update' }
  | { type: 'update-not-available'; updateInfo: UpdateInfo }
  | { type: 'update-available'; updateInfo: UpdateInfo }
  | { type: 'update-downloaded'; updateDownloadedEvent: UpdateDownloadedEvent }
  | { type: 'download-progress'; progressInfo: ProgressInfo }
  | { type: 'update-cancelled'; updateInfo: UpdateInfo };

export type Delimiter = 'none' | 'cr' | 'lf' | 'crlf';

export type Encoding = 'ascii' | 'hex';

export type SerialPortEventType = 'error' | 'open' | 'close' | 'data' | 'drain';

export type SerialPortEvent =
  | { type: 'error'; error: Error }
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'data'; data: string }
  | { type: 'drain' };

export interface SerialPortAPI {
  list: () => Promise<PortInfo[]>;
  open: (openOptions: OpenOptions) => Promise<void>;
  close: () => Promise<void>;
  write: (data: string, encoding: Encoding) => Promise<boolean>;
  isOpen: () => Promise<boolean>;
  setReadEncoding: (encoding: Encoding) => Promise<void>;
  getReadEncoding: () => Promise<Encoding>;
  getOpenOptions: () => Promise<OpenOptions | null>;
  onEvent: (callback: (serialPortEvent: SerialPortEvent) => void) => () => void;
}

export interface ElectronAPI {
  platform: string;
  quit: (code: number) => void;
  getVersion: () => Promise<string>;
  downloadUpdate: () => Promise<string>;
  installUpdate: () => Promise<Array<string>>;
  onUpdateEvent: (
    callback: (autoUpdaterEvent: AutoUpdaterEvent) => void
  ) => () => void;
  serialPort: SerialPortAPI;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
