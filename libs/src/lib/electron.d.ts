import {
  type PortInfo,
  type OpenOptions,
} from '@serialport/bindings-interface';

export type Delimiter = 'none' | 'cr' | 'lf' | 'crlf';
export type Encoding = 'ascii' | 'hex';

export interface ElectronAPI {
  platform: string;
  quitApp: (code: number) => void;
  getAppVersion: () => Promise<string>;
  serialPort: {
    list: () => Promise<PortInfo[]>;
    open: (openOptions: OpenOptions) => Promise<void>;
    close: () => Promise<void>;
    write: (data: string, encoding: Encoding) => Promise<boolean>;
    isOpen: () => Promise<boolean>;
    onData: (
      callback: (data: string) => void,
      encoding: Encoding
    ) => () => void;
    onError: (callback: (error: Error) => void) => () => void;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
