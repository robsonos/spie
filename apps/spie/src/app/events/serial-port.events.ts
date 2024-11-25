import { type OpenOptions } from '@serialport/bindings-interface';
import type { Encoding } from '@spie/types';
import { app, ipcMain } from 'electron';
import { InterByteTimeoutParser, SerialPort } from 'serialport';

import { environment } from '../../environments/environment';

export default class SerialPortEvents {
  private static serialPort: SerialPort | null = null;
  private static parser: InterByteTimeoutParser | null = null;
  private static dataListener: (data: Buffer) => void;
  private static errorListener: (error: Error) => void;

  static bootstrapEvents(): void {
    ipcMain.on('quit', (_, code) => {
      // console.warn('quit');
      app.exit(code);
    });

    ipcMain.handle('get-app-version', () => {
      // console.warn('get-app-version');
      return environment.version;
    });

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
          SerialPortEvents.serialPort === null ||
          !SerialPortEvents.serialPort.isOpen
        ) {
          return reject('Port is not open');
        }

        SerialPortEvents.serialPort.close((error) => {
          if (error) {
            return reject(error);
          }

          if (SerialPortEvents.parser) {
            SerialPortEvents.parser.off('data', SerialPortEvents.dataListener);
          }

          SerialPortEvents.serialPort = null;
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

    ipcMain.on(
      'serial-port-add-on-data-event-listener',
      (event, encoding: Encoding) => {
        if (!SerialPortEvents.serialPort) {
          throw Error('Serial port not configured yet');
        }

        // console.warn('serial-port-add-on-data-event-listener');
        SerialPortEvents.dataListener = (data: Buffer) => {
          const encodedData: string =
            encoding === 'hex'
              ? data.toString('hex').toUpperCase().match(/.{2}/g).join(' ')
              : data.toString(encoding);

          event.sender.send(`serial-port-on-data`, encodedData);
          // console.warn('serial-port-on-data', encodedData);
        };

        if (SerialPortEvents.parser) {
          SerialPortEvents.parser.on('data', SerialPortEvents.dataListener);
        }
      }
    );

    ipcMain.on('serial-port-remove-on-data-event-listener', () => {
      if (!SerialPortEvents.serialPort) {
        throw Error('Serial port not configured yet');
      }

      // console.warn('serial-port-remove-on-data-event-listener');
      if (SerialPortEvents.parser) {
        SerialPortEvents.parser.off('data', SerialPortEvents.dataListener);
      }
    });

    ipcMain.on('serial-port-add-on-error-event-listener', (event) => {
      if (!SerialPortEvents.serialPort) {
        throw Error('Serial port not configured yet');
      }

      // console.warn('serial-port-add-on-error-event-listener');
      SerialPortEvents.errorListener = (error: Error) => {
        event.sender.send(`serial-port-on-error`, error);
        // console.error('serial-port-on-error', error);
      };

      SerialPortEvents.serialPort.on('error', SerialPortEvents.errorListener);
    });

    ipcMain.on('serial-port-remove-on-error-event-listener', () => {
      if (!SerialPortEvents.serialPort) {
        throw Error('Serial port not configured yet');
      }

      // console.warn('serial-port-remove-on-error-event-listener');
      if (SerialPortEvents.parser) {
        SerialPortEvents.parser.off('error', SerialPortEvents.errorListener);
      }
    });
  }
}
