import { describe } from 'node:test';

import { TestBed } from '@angular/core/testing';
import type {
  AutoUpdaterEvent,
  ElectronAPI,
  SerialPortEvent,
} from '@spie/types';

import { ElectronService } from './electron.service';

describe('ElectronService', () => {
  let service: ElectronService;

  const mockElectronAPI: ElectronAPI = {
    platform: '',
    quit: jest.fn(),
    getVersion: jest.fn(),
    downloadUpdate: jest.fn(),
    installUpdate: jest.fn(),
    onUpdateEvent: jest.fn(),
    serialPort: {
      list: jest.fn(),
      open: jest.fn(),
      close: jest.fn(),
      write: jest.fn(),
      isOpen: jest.fn(),
      setReadEncoding: jest.fn(),
      getReadEncoding: jest.fn(),
      getOpenOptions: jest.fn(),
      onEvent: jest.fn(),
    },
  };

  beforeEach(() => {
    (window as Window).electron = mockElectronAPI;

    TestBed.configureTestingModule({
      providers: [ElectronService],
    });
    service = TestBed.inject(ElectronService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('quit', () => {
    it('should call window.electron.quit with the specified code', () => {
      const code = 1;
      service.quit(code);
      expect(mockElectronAPI.quit).toHaveBeenCalledWith(1);
    });
  });

  describe('getVersion', () => {
    it('should return the app version', async () => {
      const mockVersion = '1.0.0';
      (mockElectronAPI.getVersion as jest.Mock).mockResolvedValue(mockVersion);

      const version = await service.getVersion();
      expect(mockElectronAPI.getVersion).toHaveBeenCalled();
      expect(version).toBe(mockVersion);
    });

    it('should handle errors thrown by getVersion gracefully', async () => {
      const error = new Error('Version not found');
      (mockElectronAPI.getVersion as jest.Mock).mockRejectedValue(error);

      await expect(service.getVersion()).rejects.toThrow(error);
    });
  });

  describe('downloadUpdate', () => {
    it('should call window.electron.downloadUpdate and return the update path', async () => {
      const mockUpdatePath = '/path/to/update';
      (mockElectronAPI.downloadUpdate as jest.Mock).mockResolvedValue(
        mockUpdatePath
      );

      const result = await service.downloadUpdate();
      expect(mockElectronAPI.downloadUpdate).toHaveBeenCalled();
      expect(result).toBe(mockUpdatePath);
    });

    it('should handle errors thrown by downloadUpdate gracefully', async () => {
      const error = new Error('Download failed');
      (mockElectronAPI.downloadUpdate as jest.Mock).mockRejectedValue(error);

      await expect(service.downloadUpdate()).rejects.toThrow(error);
    });
  });

  describe('installUpdate', () => {
    it('should call window.electron.installUpdate and return the installed files', async () => {
      const mockInstalledFiles = ['/file1', '/file2'];
      (mockElectronAPI.installUpdate as jest.Mock).mockResolvedValue(
        mockInstalledFiles
      );

      const result = await service.installUpdate();
      expect(mockElectronAPI.installUpdate).toHaveBeenCalled();
      expect(result).toEqual(mockInstalledFiles);
    });

    it('should handle errors thrown by installUpdate gracefully', async () => {
      const error = new Error('Install failed');
      (mockElectronAPI.installUpdate as jest.Mock).mockRejectedValue(error);

      await expect(service.installUpdate()).rejects.toThrow(error);
    });
  });

  describe('onUpdateEvent', () => {
    it('should handle error event', (done) => {
      const mockEvent: AutoUpdaterEvent = {
        type: 'error',
        error: new Error('Test error'),
      };
      (mockElectronAPI.onUpdateEvent as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockEvent);
          return jest.fn();
        }
      );
      const observer = {
        next: (type: AutoUpdaterEvent) => {
          expect(type).toEqual(mockEvent);
          done();
        },
      };
      const subscription = service.onUpdateEvent().subscribe(observer);
      subscription.unsubscribe();
    });

    it('should handle checking-for-update event', (done) => {
      const mockEvent: AutoUpdaterEvent = { type: 'checking-for-update' };
      (mockElectronAPI.onUpdateEvent as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockEvent);
          return jest.fn();
        }
      );
      const observer = {
        next: (type: AutoUpdaterEvent) => {
          expect(type).toEqual(mockEvent);
          done();
        },
      };
      const subscription = service.onUpdateEvent().subscribe(observer);
      subscription.unsubscribe();
    });

    it('should handle update-not-available event', (done) => {
      const mockEvent: AutoUpdaterEvent = {
        type: 'update-not-available',
        updateInfo: {
          version: '1.0.0',
          files: [],
          path: '/test',
          sha512: 'test',
          releaseDate: new Date().toISOString(),
        },
      };
      (mockElectronAPI.onUpdateEvent as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockEvent);
          return jest.fn();
        }
      );
      const observer = {
        next: (type: AutoUpdaterEvent) => {
          expect(type).toEqual(mockEvent);
          done();
        },
      };
      const subscription = service.onUpdateEvent().subscribe(observer);
      subscription.unsubscribe();
    });

    it('should handle update-available event', (done) => {
      const mockEvent: AutoUpdaterEvent = {
        type: 'update-available',
        updateInfo: {
          version: '1.0.0',
          files: [],
          path: '/test',
          sha512: 'test',
          releaseDate: new Date().toISOString(),
        },
      };
      (mockElectronAPI.onUpdateEvent as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockEvent);
          return jest.fn();
        }
      );
      const observer = {
        next: (type: AutoUpdaterEvent) => {
          expect(type).toEqual(mockEvent);
          done();
        },
      };
      const subscription = service.onUpdateEvent().subscribe(observer);
      subscription.unsubscribe();
    });

    it('should handle update-downloaded event', (done) => {
      const mockEvent: AutoUpdaterEvent = {
        type: 'update-downloaded',
        updateDownloadedEvent: {
          downloadedFile: '/test/test.exe',
          version: '1.0.0',
          files: [],
          path: '/test',
          sha512: 'test',
          releaseDate: new Date().toISOString(),
        },
      };
      (mockElectronAPI.onUpdateEvent as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockEvent);
          return jest.fn();
        }
      );
      const observer = {
        next: (type: AutoUpdaterEvent) => {
          expect(type).toEqual(mockEvent);
          done();
        },
      };
      const subscription = service.onUpdateEvent().subscribe(observer);
      subscription.unsubscribe();
    });

    it('should handle download-progress event', (done) => {
      const mockEvent: AutoUpdaterEvent = {
        type: 'download-progress',
        progressInfo: {
          total: 100,
          delta: 1,
          transferred: 75.5,
          percent: 75.5,
          bytesPerSecond: 1115.55,
        },
      };
      (mockElectronAPI.onUpdateEvent as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockEvent);
          return jest.fn();
        }
      );
      const observer = {
        next: (type: AutoUpdaterEvent) => {
          expect(type).toEqual(mockEvent);
          done();
        },
      };
      const subscription = service.onUpdateEvent().subscribe(observer);
      subscription.unsubscribe();
    });

    it('should handle update-cancelled event', (done) => {
      const mockEvent: AutoUpdaterEvent = {
        type: 'update-cancelled',
        updateInfo: {
          version: '1.0.0',
          files: [],
          path: '/test',
          sha512: 'test',
          releaseDate: new Date().toISOString(),
        },
      };
      (mockElectronAPI.onUpdateEvent as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockEvent);
          return jest.fn();
        }
      );
      const observer = {
        next: (type: AutoUpdaterEvent) => {
          expect(type).toEqual(mockEvent);
          done();
        },
      };
      const subscription = service.onUpdateEvent().subscribe(observer);
      subscription.unsubscribe();
    });

    it('should clean up the listener when unsubscribed', () => {
      const callback = jest.fn();
      (mockElectronAPI.onUpdateEvent as jest.Mock).mockReturnValue(callback);
      const subscription = service.onUpdateEvent().subscribe();
      subscription.unsubscribe();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('serialPort.list', () => {
    it('should return the list of available ports', async () => {
      const mockPorts = [{ path: '/dev/ttyUSB0' }];
      (mockElectronAPI.serialPort.list as jest.Mock).mockResolvedValue(
        mockPorts
      );

      const ports = await service.serialPort.list();
      expect(mockElectronAPI.serialPort.list).toHaveBeenCalled();
      expect(ports).toEqual(mockPorts);
    });
  });

  describe('serialPort.open', () => {
    it('should open the serial port successfully', async () => {
      const openOptions = { path: '/dev/ttyUSB0', baudRate: 9600 };
      (mockElectronAPI.serialPort.open as jest.Mock).mockResolvedValue(
        undefined
      );

      await service.serialPort.open(openOptions);
      expect(mockElectronAPI.serialPort.open).toHaveBeenCalledWith(openOptions);
    });

    it('should handle errors thrown by write gracefully', async () => {
      const openOptions = { path: '/dev/ttyUSB0', baudRate: 9600 };
      const error = new Error('Port open failed');
      (mockElectronAPI.serialPort.open as jest.Mock).mockRejectedValue(error);

      await expect(service.serialPort.open(openOptions)).rejects.toThrow(error);
    });
  });

  describe('serialPort.close', () => {
    it('should close the serial port successfully', async () => {
      (mockElectronAPI.serialPort.close as jest.Mock).mockResolvedValue(
        undefined
      );

      await service.serialPort.close();
      expect(mockElectronAPI.serialPort.close).toHaveBeenCalled();
    });

    it('should handle errors thrown by write gracefully', async () => {
      const error = new Error('Port close failed');
      (mockElectronAPI.serialPort.close as jest.Mock).mockRejectedValue(error);

      await expect(service.serialPort.close()).rejects.toThrow(error);
    });
  });

  describe('serialPort.write', () => {
    it('should call write with the correct data and encoding', async () => {
      const data = 'test data';
      const encoding = 'ascii';
      (mockElectronAPI.serialPort.write as jest.Mock).mockResolvedValue(true);

      const result = await service.serialPort.write(data, encoding);
      expect(mockElectronAPI.serialPort.write).toHaveBeenCalledWith(
        data,
        encoding
      );
      expect(result).toBe(true);
    });

    it('should handle errors thrown by write gracefully', async () => {
      const data = 'test data';
      const encoding = 'ascii';
      const error = new Error('Write failed');
      (mockElectronAPI.serialPort.write as jest.Mock).mockRejectedValue(error);

      await expect(service.serialPort.write(data, encoding)).rejects.toThrow(
        error
      );
    });
  });

  describe('serialPort.isOpen', () => {
    it('should return the current open state of the serial port', async () => {
      (mockElectronAPI.serialPort.isOpen as jest.Mock).mockResolvedValue(true);

      const isOpen = await service.serialPort.isOpen();
      expect(mockElectronAPI.serialPort.isOpen).toHaveBeenCalled();
      expect(isOpen).toBe(true);
    });
  });

  describe('serialPort.setReadEncoding', () => {
    it('should set the read encoding', async () => {
      const encoding = 'hex';

      await service.serialPort.setReadEncoding(encoding);
      expect(mockElectronAPI.serialPort.setReadEncoding).toHaveBeenCalledWith(
        encoding
      );
    });
  });

  describe('serialPort.getReadEncoding', () => {
    it('should set the read encoding', async () => {
      const mockEncoding = 'hex';

      (
        mockElectronAPI.serialPort.getReadEncoding as jest.Mock
      ).mockResolvedValue(mockEncoding);

      const encoding = await service.serialPort.getReadEncoding();
      expect(mockElectronAPI.serialPort.getReadEncoding).toHaveBeenCalled();
      expect(encoding).toEqual(mockEncoding);
    });
  });

  describe('serialPort.getOpenOptions', () => {
    it('should get the open options', async () => {
      const mockOpenOptions = { path: '/dev/ttyUSB0', baudRate: 9600 };

      (
        mockElectronAPI.serialPort.getOpenOptions as jest.Mock
      ).mockResolvedValue(mockOpenOptions);

      const openOptions = await service.serialPort.getOpenOptions();

      expect(mockElectronAPI.serialPort.getOpenOptions).toHaveBeenCalled();
      expect(openOptions).toEqual(mockOpenOptions);
    });
  });

  describe('serialPort.onEvent', () => {
    it('should handle error event', (done) => {
      const error = new Error('Test error');
      const mockEvent: SerialPortEvent = { type: 'error', error };

      (mockElectronAPI.serialPort.onEvent as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockEvent);
          return jest.fn();
        }
      );

      const observer = {
        next: (type: SerialPortEvent) => {
          expect(type).toEqual(mockEvent);
          done();
        },
      };

      const subscription = service.serialPort.onEvent().subscribe(observer);

      subscription.unsubscribe();
    });

    it('should handle open event', (done) => {
      const mockEvent: SerialPortEvent = { type: 'open' };

      (mockElectronAPI.serialPort.onEvent as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockEvent);
          return jest.fn();
        }
      );

      const observer = {
        next: (type: SerialPortEvent) => {
          expect(type).toEqual(mockEvent);
          done();
        },
      };

      const subscription = service.serialPort.onEvent().subscribe(observer);

      subscription.unsubscribe();
    });

    it('should handle open event', (done) => {
      const mockEvent: SerialPortEvent = { type: 'open' };

      (mockElectronAPI.serialPort.onEvent as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockEvent);
          return jest.fn();
        }
      );

      const observer = {
        next: (type: SerialPortEvent) => {
          expect(type).toEqual(mockEvent);
          done();
        },
      };

      const subscription = service.serialPort.onEvent().subscribe(observer);

      subscription.unsubscribe();
    });

    it('should handle close event', (done) => {
      const mockEvent: SerialPortEvent = { type: 'close' };

      (mockElectronAPI.serialPort.onEvent as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockEvent);
          return jest.fn();
        }
      );

      const observer = {
        next: (type: SerialPortEvent) => {
          expect(type).toEqual(mockEvent);
          done();
        },
      };

      const subscription = service.serialPort.onEvent().subscribe(observer);

      subscription.unsubscribe();
    });

    it('should handle data event with hex encoding', async () => {
      const encoding = 'hex';
      const chunk = Buffer.from('test data');
      const mockEvent: SerialPortEvent = {
        type: 'data',
        data: chunk
          .toString('hex')
          .toUpperCase()
          .match(/.{2}/g)
          ?.join(' ') as string,
      };

      await service.serialPort.setReadEncoding(encoding);

      (mockElectronAPI.serialPort.onEvent as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockEvent);
          return jest.fn();
        }
      );

      const observer = {
        next: (type: SerialPortEvent) => {
          expect(type).toEqual(mockEvent);
          // done();
        },
      };

      const subscription = service.serialPort.onEvent().subscribe(observer);

      subscription.unsubscribe();
    });

    it('should handle data event with ascii encoding', async () => {
      const encoding = 'ascii';
      const chunk = Buffer.from('test data');
      const mockEvent: SerialPortEvent = {
        type: 'data',
        data: chunk.toString('ascii'),
      };

      await service.serialPort.setReadEncoding(encoding);

      (mockElectronAPI.serialPort.onEvent as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockEvent);
          return jest.fn();
        }
      );

      const observer = {
        next: (type: SerialPortEvent) => {
          expect(type).toEqual(mockEvent);
        },
      };

      const subscription = service.serialPort.onEvent().subscribe(observer);

      subscription.unsubscribe();
    });

    it('should handle drain event', (done) => {
      const mockEvent: SerialPortEvent = { type: 'drain' };

      (mockElectronAPI.serialPort.onEvent as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockEvent);
          return jest.fn();
        }
      );

      const observer = {
        next: (type: SerialPortEvent) => {
          expect(type).toEqual(mockEvent);
          done();
        },
      };

      const subscription = service.serialPort.onEvent().subscribe(observer);

      subscription.unsubscribe();
    });

    it('should clean up the listener when unsubscribed', () => {
      const callback = jest.fn();

      (mockElectronAPI.serialPort.onEvent as jest.Mock).mockReturnValue(
        callback
      );
      const subscription = service.serialPort.onEvent().subscribe();

      subscription.unsubscribe();

      expect(callback).toHaveBeenCalled();
    });
  });
});
