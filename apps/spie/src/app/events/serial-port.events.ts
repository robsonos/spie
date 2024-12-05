import { type OpenOptions } from '@serialport/bindings-interface';
import type {
  Encoding,
  SerialPortEvent,
  SerialPortEventType,
} from '@spie/types';
import { ipcMain } from 'electron';
import { InterByteTimeoutParser, SerialPort } from 'serialport';

export default class SerialPortEvents {
  private static serialPort: SerialPort | null = null;
  private static parser: InterByteTimeoutParser | null = null;
  private static eventListeners = new Map<
    SerialPortEventType,
    (...args: any[]) => void
  >();
  private static listenerQueue = new Map<
    SerialPortEventType,
    (...args: any[]) => void
  >();
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
      event: SerialPortEventType,
      callback: (...args: any[]) => void
    ) => {
      if (
        !SerialPortEvents.serialPort ||
        !SerialPortEvents.parser ||
        !SerialPortEvents.serialPort.isOpen
      ) {
        if (!SerialPortEvents.listenerQueue.has(event)) {
          // console.log('SerialPortEvents.addEventListener queue', event, callback);
          // Port is not open, queue the callback
          SerialPortEvents.listenerQueue.set(event, callback);
        }
        return;
      }

      if (!SerialPortEvents.eventListeners.has(event)) {
        // console.log('SerialPortEvents.addEventListener attach', event, callback);
        // Port is open, attach callback immediately
        if (event === 'data') {
          SerialPortEvents.parser.on(event, callback);
        } else {
          SerialPortEvents.serialPort.on(event, callback);
        }
        SerialPortEvents.eventListeners.set(event, callback);
      }
    };

    addEventListener('error', (error: Error) => {
      const notification: SerialPortEvent = { type: 'error', error };
      event.sender.send('serial-port-notification', notification);
    });

    addEventListener('open', () => {
      const notification: SerialPortEvent = { type: 'open' };
      event.sender.send('serial-port-notification', notification);
    });

    addEventListener('close', () => {
      const notification: SerialPortEvent = { type: 'close' };
      event.sender.send('serial-port-notification', notification);
    });

    addEventListener('data', (chunk: any) => {
      const data: string =
        SerialPortEvents.encoding === 'hex'
          ? chunk.toString('hex').toUpperCase().match(/.{2}/g).join(' ')
          : chunk.toString('ascii');

      const notification: SerialPortEvent = { type: 'data', data };
      event.sender.send('serial-port-notification', notification);
    });

    addEventListener('drain', () => {
      const notification: SerialPortEvent = { type: 'drain' };
      event.sender.send('serial-port-notification', notification);
    });

    SerialPortEvents.areListenersRegistered = true;

    return Promise.resolve();
  }

  private static removeEventListeners(): Promise<void> {
    if (!SerialPortEvents.areListenersRegistered) {
      return Promise.resolve();
    }

    SerialPortEvents.eventListeners.forEach((callback, event) => {
      // console.log('SerialPortEvents.removeEventListener', event, callback);
      if (event === 'data') {
        SerialPortEvents.parser.off(event, callback);
      } else {
        SerialPortEvents.serialPort.off(event, callback);
      }
    });

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

        // INFO: InterByteTimeoutParser should become a toggleable parameter if the added "delay" becomes a problem.
        SerialPortEvents.parser = SerialPortEvents.serialPort.pipe(
          new InterByteTimeoutParser({ interval: 5 })
        );

        // Process queued listeners after opening
        SerialPortEvents.listenerQueue.forEach((callback, event) => {
          // console.log(`Processing queued listener for event: ${event}`);
          if (event === 'data') {
            SerialPortEvents.parser.on(event, callback);
          } else {
            SerialPortEvents.serialPort.on(event, callback);
          }
          SerialPortEvents.eventListeners.set(event, callback);
        });
        SerialPortEvents.listenerQueue.clear();

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

    ipcMain.on('serial-port-add-notification-event-listener', (event) => {
      // console.warn('serial-port-add-notification-event-listener');
      return SerialPortEvents.addEventListeners(event);
    });

    ipcMain.on('serial-port-remove-notification-event-listener', () => {
      // console.warn('serial-port-remove-notification-event-listener');
      return SerialPortEvents.removeEventListeners();
    });
  }
}
