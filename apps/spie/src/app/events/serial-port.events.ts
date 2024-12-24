import { type OpenOptions } from '@serialport/bindings-interface';
import type {
  Encoding,
  SerialPortEvent,
  SerialPortEventType,
} from '@spie/types';
import { ipcMain } from 'electron';
import { ReadlineParser, SerialPort } from 'serialport';

export default class SerialPortEvents {
  private static eventListeners = new Map<
    SerialPortEventType,
    (...args: any[]) => void
  >();
  private static listenerQueue = new Map<
    SerialPortEventType,
    (...args: any[]) => void
  >();
  private static serialPort: SerialPort | null = null;
  private static parser: ReadlineParser | null = null;
  private static parserCallback: (data: string) => void | null = null;
  private static encoding: Encoding = 'ascii';
  private static areListenersRegistered = false;
  private static openOptions: OpenOptions | null = null;

  private static addEventListeners(
    event: Electron.IpcMainEvent
  ): Promise<void> {
    if (SerialPortEvents.areListenersRegistered) {
      return Promise.resolve();
    }

    const addEventListener = (
      serialPortEventType: SerialPortEventType,
      callback: (...args: any[]) => void
    ) => {
      if (!SerialPortEvents.serialPort || !SerialPortEvents.serialPort.isOpen) {
        if (!SerialPortEvents.listenerQueue.has(serialPortEventType)) {
          // console.log('SerialPortEvents.addEventListener queue', serialPortEventType, callback);
          // Port is not open, queue the callback
          SerialPortEvents.listenerQueue.set(serialPortEventType, callback);
        }
        return;
      }

      if (!SerialPortEvents.eventListeners.has(serialPortEventType)) {
        // console.log('SerialPortEvents.addEventListener attach', serialPortEventType, callback);
        // Port is open, attach callback immediately
        SerialPortEvents.serialPort.on(serialPortEventType, callback);
        SerialPortEvents.eventListeners.set(serialPortEventType, callback);
      }

      if (
        SerialPortEvents.parser &&
        SerialPortEvents.parser.listenerCount('data') === 0 &&
        SerialPortEvents.parserCallback
      ) {
        SerialPortEvents.parser.on('data', SerialPortEvents.parserCallback);
      }
    };

    addEventListener('error', (error: Error) => {
      const notification: SerialPortEvent = { type: 'error', error };
      event.sender.send('serial-port-event', notification);
    });

    addEventListener('open', () => {
      const notification: SerialPortEvent = { type: 'open' };
      event.sender.send('serial-port-event', notification);
    });

    addEventListener('close', () => {
      const notification: SerialPortEvent = { type: 'close' };
      event.sender.send('serial-port-event', notification);
    });

    addEventListener('data', (chunk: Buffer) => {
      const data: string =
        SerialPortEvents.encoding === 'hex'
          ? chunk.toString('hex').toUpperCase().match(/.{2}/g).join(' ')
          : chunk.toString('ascii');

      const notification: SerialPortEvent = { type: 'data', data };
      event.sender.send('serial-port-event', notification);
    });

    addEventListener('drain', () => {
      const notification: SerialPortEvent = { type: 'drain' };
      event.sender.send('serial-port-event', notification);
    });

    SerialPortEvents.parserCallback = (data: string) => {
      const notification: SerialPortEvent = { type: 'data-delimited', data };
      event.sender.send('serial-port-event', notification);
    };

    SerialPortEvents.areListenersRegistered = true;

    return Promise.resolve();
  }

  private static removeEventListeners(): Promise<void> {
    if (!SerialPortEvents.areListenersRegistered) {
      return Promise.resolve();
    }

    SerialPortEvents.eventListeners.forEach((callback, serialPortEventType) => {
      // console.log('SerialPortEvents.serialPort.off', serialPortEventType, callback);
      SerialPortEvents.serialPort.off(serialPortEventType, callback);
    });

    if (SerialPortEvents.parser) {
      // console.log('SerialPortEvents.parser.off', serialPortEventType, callback);
      SerialPortEvents.parser.off('data', SerialPortEvents.parserCallback);
    }

    SerialPortEvents.eventListeners.clear();
    SerialPortEvents.areListenersRegistered = false;

    return Promise.resolve();
  }

  static bootstrapEvents(): void {
    ipcMain.handle('serial-port-list', () => {
      // console.warn('serial-port-list');
      return SerialPort.list();
    });

    ipcMain.handle('serial-port-open', (_, openOptions: OpenOptions) => {
      // console.warn('serial-port-open');
      return new Promise<void>((resolve, reject) => {
        if (SerialPortEvents.serialPort && SerialPortEvents.serialPort.isOpen) {
          return reject('Port is already open');
        }

        SerialPortEvents.serialPort = new SerialPort(
          {
            ...openOptions,
            parity: (openOptions.parity ?? 'none') as 'none' | 'even' | 'odd',
            autoOpen: false,
          },
          (error) => {
            if (error) {
              return reject(error);
            }
          }
        );

        SerialPortEvents.parser = SerialPortEvents.serialPort.pipe(
          new ReadlineParser({ includeDelimiter: true }) // TODO: remove includeDelimiter
        );

        // Process queued listeners after opening
        SerialPortEvents.listenerQueue.forEach(
          (callback, serialPortEventType) => {
            // console.log(`Processing queued listener for serialPortEventType: ${serialPortEventType}`);
            SerialPortEvents.serialPort.on(serialPortEventType, callback);
            SerialPortEvents.eventListeners.set(serialPortEventType, callback);
          }
        );
        SerialPortEvents.listenerQueue.clear();

        if (
          SerialPortEvents.parser &&
          SerialPortEvents.parser.listenerCount('data') === 0 &&
          SerialPortEvents.parserCallback
        ) {
          SerialPortEvents.parser.on('data', SerialPortEvents.parserCallback);
        }

        SerialPortEvents.serialPort.open((error) => {
          if (error) {
            return reject(error);
          }

          SerialPortEvents.openOptions = openOptions;

          resolve();
        });
      });
    });

    ipcMain.handle('serial-port-close', () => {
      // console.warn('serial-port-close');
      return new Promise<void>((resolve, reject) => {
        if (
          !SerialPortEvents.serialPort ||
          !SerialPortEvents.serialPort.isOpen
        ) {
          return reject('Port is not open');
        }

        SerialPortEvents.serialPort.close((error) => {
          if (error) {
            return reject(error);
          }

          SerialPortEvents.removeEventListeners();
          SerialPortEvents.serialPort = null;
          SerialPortEvents.parser = null;
          resolve();
        });
      });
    });

    ipcMain.handle(
      'serial-port-write',
      (_, data: string | Buffer | number[], encoding: Encoding) => {
        // console.warn('serial-port-write', data, encoding);
        return new Promise<boolean>((resolve, reject) => {
          if (
            SerialPortEvents.serialPort === null ||
            !SerialPortEvents.serialPort.isOpen
          ) {
            return reject('Port is not open');
          }

          const writeSuccess = SerialPortEvents.serialPort.write(
            data,
            encoding,
            (error) => {
              if (error) {
                return reject(error);
              }

              resolve(true);
            }
          );

          if (!writeSuccess) {
            resolve(false);
          }
        });
      }
    );

    ipcMain.handle('serial-port-is-open', () => {
      // console.warn('serial-port-is-open');
      if (SerialPortEvents.serialPort && SerialPortEvents.serialPort.isOpen) {
        return Promise.resolve(true);
      }

      return Promise.resolve(false);
    });

    ipcMain.handle('serial-port-set-read-encoding', (_, encoding: Encoding) => {
      // console.warn('serial-port-set-read-encoding');
      SerialPortEvents.encoding = encoding;

      return Promise.resolve();
    });

    ipcMain.handle('serial-port-get-read-encoding', () => {
      // console.warn('serial-port-get-read-encoding');
      return Promise.resolve(SerialPortEvents.encoding);
    });

    ipcMain.handle('serial-port-get-open-options', () => {
      // console.warn('serial-port-get-open-options');
      return Promise.resolve(SerialPortEvents.openOptions);
    });

    ipcMain.on('serial-port-event-add-listener', (event) => {
      // console.warn('serial-port-event-add-listener');
      return SerialPortEvents.addEventListeners(event);
    });

    ipcMain.on('serial-port-event-remove-listener', () => {
      // console.warn('serial-port-event-remove-listener');
      return SerialPortEvents.removeEventListeners();
    });
  }
}
