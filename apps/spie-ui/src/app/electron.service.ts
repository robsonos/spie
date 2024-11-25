import { Injectable } from '@angular/core';
import {
  type OpenOptions,
  type PortInfo,
} from '@serialport/bindings-interface';
import { type AutoUpdaterEvent, type Encoding } from '@spie/types';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  distinctUntilChanged,
  switchMap,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  getPlatform(): string {
    return window.electron.platform;
  }

  quitApp(code = 0): void {
    window.electron.quitApp(code);
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
    private isOpen$ = new BehaviorSubject<boolean>(false);
    list(): Promise<PortInfo[]> {
      return window.electron.serialPort.list();
    }

    async open(openOptions: OpenOptions): Promise<void> {
      try {
        await window.electron.serialPort.open(openOptions);
        this.isOpen$.next(true);
      } catch (error) {
        return Promise.reject(error);
      }
    }

    async close(): Promise<void> {
      try {
        this.isOpen$.next(false);
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

    onData(encoding: Encoding): Observable<string> {
      return this.isOpen$.pipe(
        distinctUntilChanged(),
        switchMap((isOpen) => {
          if (!isOpen) {
            return EMPTY;
          }

          return new Observable<string>((observer) => {
            const removeListener = window.electron.serialPort.onData((data) => {
              observer.next(data);
            }, encoding);

            return () => {
              observer.complete();
              removeListener();
            };
          });
        })
      );
    }

    onError(): Observable<Error> {
      return this.isOpen$.pipe(
        distinctUntilChanged(),
        switchMap((isOpen) => {
          if (!isOpen) {
            return EMPTY;
          }

          return new Observable<Error>((observer) => {
            const removeListener = window.electron.serialPort.onError(
              (error: Error) => {
                if (error) {
                  observer.next(error);
                }
              }
            );

            return () => {
              observer.complete();
              removeListener();
            };
          });
        })
      );
    }
  })();
}
