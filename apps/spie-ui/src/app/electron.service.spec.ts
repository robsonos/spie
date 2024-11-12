import { TestBed } from '@angular/core/testing';
import type { Encoding } from '@spie/types';

import { ElectronService } from './electron.service';

describe('ElectronService', () => {
  let service: ElectronService;

  // Mock for the window.electron API to simulate Electron behavior
  const mockElectronAPI = {
    quitApp: jest.fn(),
    getAppVersion: jest.fn(),
    serialPort: {
      list: jest.fn(),
      open: jest.fn(),
      close: jest.fn(),
      write: jest.fn(),
      isOpen: jest.fn(),
      onData: jest.fn(),
    },
  };

  beforeEach(() => {
    // Set up the mock on the global window object
    (window as any).electron = mockElectronAPI;

    TestBed.configureTestingModule({
      providers: [ElectronService],
    });
    service = TestBed.inject(ElectronService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('quitApp', () => {
    it('should call window.electron.quitApp with the specified code', () => {
      const code = 1;
      service.quitApp(code);
      expect(mockElectronAPI.quitApp).toHaveBeenCalledWith(1);
    });
  });

  describe('getAppVersion', () => {
    it('should return the app version', async () => {
      const mockVersion = '1.0.0';
      mockElectronAPI.getAppVersion.mockResolvedValue(mockVersion);

      const version = await service.getAppVersion();
      expect(mockElectronAPI.getAppVersion).toHaveBeenCalled();
      expect(version).toBe(mockVersion);
    });

    it('should handle errors thrown by getAppVersion gracefully', async () => {
      const error = new Error('Version not found');
      mockElectronAPI.getAppVersion.mockRejectedValue(error);

      await expect(service.getAppVersion()).rejects.toThrow(error);
    });
  });

  describe('serialPort.list', () => {
    it('should return the list of available ports', async () => {
      const mockPorts = [{ path: '/dev/ttyUSB0' }];
      mockElectronAPI.serialPort.list.mockResolvedValue(mockPorts);

      const ports = await service.serialPort.list();
      expect(mockElectronAPI.serialPort.list).toHaveBeenCalled();
      expect(ports).toEqual(mockPorts);
    });
  });

  describe('serialPort.open', () => {
    it('should set isOpen$ to true when the port opens successfully', async () => {
      const openOptions = { path: '/dev/ttyUSB0', baudRate: 9600 };
      mockElectronAPI.serialPort.open.mockResolvedValue(undefined);

      await service.serialPort.open(openOptions);
      expect(mockElectronAPI.serialPort.open).toHaveBeenCalledWith(openOptions);
      expect(service.serialPort['isOpen$'].value).toBe(true);
    });

    it('should not change isOpen$ if opening the port fails', async () => {
      const openOptions = { path: '/dev/ttyUSB0', baudRate: 9600 };
      const error = new Error('Port open failed');
      mockElectronAPI.serialPort.open.mockRejectedValue(error);

      await expect(service.serialPort.open(openOptions)).rejects.toThrow(error);
      expect(service.serialPort['isOpen$'].value).toBe(false);
    });
  });

  describe('serialPort.close', () => {
    it('should set isOpen$ to false when the port closes successfully', async () => {
      mockElectronAPI.serialPort.close.mockResolvedValue(undefined);

      await service.serialPort.close();
      expect(mockElectronAPI.serialPort.close).toHaveBeenCalled();
      expect(service.serialPort['isOpen$'].value).toBe(false);
    });

    it('should not change isOpen$ if closing the port fails', async () => {
      const error = new Error('Port close failed');
      mockElectronAPI.serialPort.close.mockRejectedValue(error);

      await expect(service.serialPort.close()).rejects.toThrow(error);
      expect(service.serialPort['isOpen$'].value).toBe(false);
    });
  });

  describe('serialPort.write', () => {
    it('should call write with the correct data and encoding', async () => {
      const data = 'test data';
      const encoding = 'ascii';
      mockElectronAPI.serialPort.write.mockResolvedValue(true);

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
      mockElectronAPI.serialPort.write.mockRejectedValue(error);

      await expect(service.serialPort.write(data, encoding)).rejects.toThrow(
        error
      );
    });
  });

  describe('serialPort.isOpen', () => {
    it('should return the current open state of the serial port', async () => {
      mockElectronAPI.serialPort.isOpen.mockResolvedValue(true);

      const isOpen = await service.serialPort.isOpen();
      expect(mockElectronAPI.serialPort.isOpen).toHaveBeenCalled();
      expect(isOpen).toBe(true);
    });
  });

  describe('serialPort.onData', () => {
    it('should emit data when port is open', (done) => {
      const mockData = 'data from port';
      const encoding: Encoding = 'ascii';

      mockElectronAPI.serialPort.onData.mockImplementationOnce((callback) => {
        callback(mockData);
        return jest.fn();
      });

      const observer = {
        next: (data: string) => {
          expect(data).toBe(mockData);
          done();
        },
      };

      service.serialPort['isOpen$'].next(true);

      const subscription = service.serialPort
        .onData(encoding)
        .subscribe(observer);

      subscription.unsubscribe();
    });

    it('should not emit if port is closed', async () => {
      const mockData = 'data from port';
      const encoding: Encoding = 'ascii';

      mockElectronAPI.serialPort.onData.mockImplementation((callback) => {
        callback(mockData);
        return jest.fn();
      });

      const observer = {
        next: jest.fn(),
        complete: jest.fn(),
      };

      const subscription = service.serialPort
        .onData(encoding)
        .subscribe(observer);

      service.serialPort['isOpen$'].next(false);

      expect(observer.next).not.toHaveBeenCalled();

      subscription.unsubscribe();
    });

    it('should emit data when port is open and pause when port is closed', async () => {
      const mockData = 'data from port';
      const encoding: Encoding = 'ascii';

      mockElectronAPI.serialPort.onData.mockImplementation((callback) => {
        callback(mockData);
        return jest.fn();
      });

      const observer = {
        next: jest.fn(),
        complete: jest.fn(),
      };

      const subscription = service.serialPort
        .onData(encoding)
        .subscribe(observer);

      service.serialPort['isOpen$'].next(true);
      expect(observer.next).toHaveBeenCalledWith(mockData);

      observer.next.mockClear();
      service.serialPort['isOpen$'].next(false);
      expect(observer.next).not.toHaveBeenCalled();

      service.serialPort['isOpen$'].next(true);
      expect(observer.next).toHaveBeenCalledWith(mockData);

      subscription.unsubscribe();
    });

    it('should remove onData listener when the observable is unsubscribed', () => {
      const mockRemoveListener = jest.fn();
      mockElectronAPI.serialPort.onData.mockReturnValue(mockRemoveListener);

      const encoding: Encoding = 'ascii';
      service.serialPort['isOpen$'].next(true);

      const subscription = service.serialPort.onData(encoding).subscribe();
      subscription.unsubscribe();

      expect(mockRemoveListener).toHaveBeenCalled();
    });
  });
});
