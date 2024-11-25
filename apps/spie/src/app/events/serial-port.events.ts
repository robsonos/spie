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

  private static addEventListeners(event: Electron.IpcMainEvent) {
    if (SerialPortEvents.areListenersRegistered) {
      return;
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
          // console.log('addEventListener queue', event, callback);
          // Port is not open, queue the callback
          SerialPortEvents.listenerQueue.set(event, callback);
        }
        return;
      }

      if (!SerialPortEvents.eventListeners.has(event)) {
        // console.log('addEventListener attach', event, callback);
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
      const notification: SerialPortEvent = { event: 'error', error };
      event.sender.send('serial-port-notification', notification);
    });

    addEventListener('open', () => {
      const notification: SerialPortEvent = { event: 'open' };
      event.sender.send('serial-port-notification', notification);
    });

    addEventListener('close', () => {
      const notification: SerialPortEvent = { event: 'close' };
      event.sender.send('serial-port-notification', notification);
    });

    addEventListener('data', (chunk: any) => {
      const data: string =
        SerialPortEvents.encoding === 'hex'
          ? chunk.toString('hex').toUpperCase().match(/.{2}/g).join(' ')
          : chunk.toString('ascii');

      const notification: SerialPortEvent = { event: 'data', data };
      event.sender.send('serial-port-notification', notification);
    });

    addEventListener('drain', () => {
      const notification: SerialPortEvent = { event: 'drain' };
      event.sender.send('serial-port-notification', notification);
    });

    SerialPortEvents.areListenersRegistered = true;
  }

  private static removeEventListeners() {
    if (!SerialPortEvents.areListenersRegistered) {
      return;
    }

    SerialPortEvents.eventListeners.forEach((callback, event) => {
      // console.log('removeEventListener', event, callback);
      if (event === 'data') {
        SerialPortEvents.parser.off(event, callback);
      } else {
        SerialPortEvents.serialPort.off(event, callback);
      }
    });

    SerialPortEvents.eventListeners.clear();
    SerialPortEvents.areListenersRegistered = false;
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
        return true;
      }

      return false;
    });

    ipcMain.handle('serial-port-set-read-encoding', (_, encoding: Encoding) => {
      // console.warn('serial-port-set-read-encoding');
      SerialPortEvents.encoding = encoding;
    });

    ipcMain.on('serial-port-add-notification-event-listener', (event) => {
      // console.warn('serial-port-add-notification-event-listener');

      SerialPortEvents.addEventListeners(event);
    });

    ipcMain.on('serial-port-remove-notification-event-listener', () => {
      // console.warn('serial-port-remove-notification-event-listener');
      SerialPortEvents.removeEventListeners();
    });
  }
}
