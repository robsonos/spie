/**
 * This module is responsible for handling all the inter-process communications
 * between the frontend and the Electron backend.
 */

import { type OpenOptions } from '@serialport/bindings-interface';
import type { Encoding } from '@spie/types';
import { app, ipcMain } from 'electron';
import { InterByteTimeoutParser, SerialPort } from 'serialport';

import { environment } from '../../environments/environment';

export default class ElectronEvents {
  private static serialPort: SerialPort | null = null;
  private static parser: InterByteTimeoutParser | null = null;
  private static dataListener: (data: Buffer) => void;
  private static errorListener: (error: Error) => void;

  static bootstrapElectronEvents(): void {
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
        if (ElectronEvents.serialPort && ElectronEvents.serialPort.isOpen) {
          return reject('Port is already open');
        }

        ElectronEvents.serialPort = new SerialPort(
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
        ElectronEvents.parser = ElectronEvents.serialPort.pipe(
          new InterByteTimeoutParser({ interval: 5 })
        );

        ElectronEvents.serialPort.open((error) => {
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
          ElectronEvents.serialPort === null ||
          !ElectronEvents.serialPort.isOpen
        ) {
          return reject('Port is not open');
        }

        ElectronEvents.serialPort.close((error) => {
          if (error) {
            return reject(error);
          }

          if (ElectronEvents.parser) {
            ElectronEvents.parser.off('data', ElectronEvents.dataListener);
          }

          ElectronEvents.serialPort = null;
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
            ElectronEvents.serialPort === null ||
            !ElectronEvents.serialPort.isOpen
          ) {
            return reject('Port is not open');
          }

          const writeSuccess = ElectronEvents.serialPort.write(
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
      if (ElectronEvents.serialPort && ElectronEvents.serialPort.isOpen) {
        return true;
      }

      return false;
    });

    ipcMain.on(
      'serial-port-add-on-data-event-listener',
      (event, encoding: Encoding) => {
        if (!ElectronEvents.serialPort) {
          throw Error('Serial port not configured yet');
        }

        // console.warn('serial-port-add-on-data-event-listener');
        ElectronEvents.dataListener = (data: Buffer) => {
          const encodedData: string =
            encoding === 'hex'
              ? data.toString('hex').toUpperCase().match(/.{2}/g).join(' ')
              : data.toString(encoding);

          event.sender.send(`serial-port-on-data`, encodedData);
          // console.warn('serial-port-on-data', encodedData);
        };

        if (ElectronEvents.parser) {
          ElectronEvents.parser.on('data', ElectronEvents.dataListener);
        }
      }
    );

    ipcMain.on('serial-port-remove-on-data-event-listener', () => {
      if (!ElectronEvents.serialPort) {
        throw Error('Serial port not configured yet');
      }

      // console.warn('serial-port-remove-on-data-event-listener');
      if (ElectronEvents.parser) {
        ElectronEvents.parser.off('data', ElectronEvents.dataListener);
      }
    });

    ipcMain.on('serial-port-add-on-error-event-listener', (event) => {
      if (!ElectronEvents.serialPort) {
        throw Error('Serial port not configured yet');
      }

      // console.warn('serial-port-add-on-error-event-listener');
      ElectronEvents.errorListener = (error: Error) => {
        event.sender.send(`serial-port-on-error`, error);
        // console.error('serial-port-on-error', error);
      };

      ElectronEvents.serialPort.on('error', ElectronEvents.errorListener);
    });

    ipcMain.on('serial-port-remove-on-error-event-listener', () => {
      if (!ElectronEvents.serialPort) {
        throw Error('Serial port not configured yet');
      }

      // console.warn('serial-port-remove-on-error-event-listener');
      if (ElectronEvents.parser) {
        ElectronEvents.parser.off('error', ElectronEvents.errorListener);
      }
    });
  }
}
