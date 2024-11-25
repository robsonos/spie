import { Injectable } from '@angular/core';
import {
  type OpenOptions,
  type PortInfo,
} from '@serialport/bindings-interface';
import {
  type AutoUpdaterEvent,
  type Encoding,
  type SerialPortEvent,
} from '@spie/types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  getPlatform(): string {
    return window.electron.platform;
  }

  quit(code = 0): void {
    window.electron.quit(code);
  }

  getVersion(): Promise<string> {
    return window.electron.getVersion();
  }

  downloadUpdate(): Promise<string> {
    return window.electron.downloadUpdate();
  }

  installUpdate(): Promise<Array<string>> {
    return window.electron.installUpdate();
  }

  onUpdateEvent(): Observable<AutoUpdaterEvent> {
    return new Observable((observer) => {
      const removeListener = window.electron.onUpdateEvent((data) => {
        observer.next(data);
      });

      return () => {
        removeListener();
      };
    });
  }

  public serialPort = new (class {
    list(): Promise<PortInfo[]> {
      return window.electron.serialPort.list();
    }

    async open(openOptions: OpenOptions): Promise<void> {
      try {
        await window.electron.serialPort.open(openOptions);
      } catch (error) {
        return Promise.reject(error);
      }
    }

    async close(): Promise<void> {
      try {
        await window.electron.serialPort.close();
      } catch (error) {
        return Promise.reject(error);
      }
    }

    write(data: string, encoding: Encoding): Promise<boolean> {
      return window.electron.serialPort.write(data, encoding);
    }

    isOpen(): Promise<boolean> {
      return window.electron.serialPort.isOpen();
    }

    setReadEncoding(encoding: Encoding): Promise<void> {
      return window.electron.serialPort.setReadEncoding(encoding);
    }

    onEvent(): Observable<SerialPortEvent> {
      return new Observable<SerialPortEvent>((observer) => {
        const removeListener = window.electron.serialPort.onEvent((data) => {
          observer.next(data);
        });

        return () => {
          removeListener();
        };
      });
    }
  })();
}
