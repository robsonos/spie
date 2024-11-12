import { ipcRenderer, contextBridge } from 'electron';
import { electronAPI } from './main.preload';
import { type Encoding } from '@spie/types';

jest.mock('electron', () => ({
  ipcRenderer: {
    send: jest.fn(),
    invoke: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
  },
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
}));

describe('Electron API', () => {
  beforeEach(() => {
    (window as Window).electron = electronAPI;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Context Bridge Exposure', () => {
    it('should expose electronAPI to the main world', () => {
      expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
        'electron',
        electronAPI
      );
    });
  });

  describe('Platform Information', () => {
    it('should expose the correct platform value', () => {
      expect(window.electron.platform).toBe(process.platform);
    });
  });

  describe('Application Control', () => {
    describe('quitApp', () => {
      it('should send quit event with the specified code', () => {
        const code = 1;
        window.electron.quitApp(code);
        expect(ipcRenderer.send).toHaveBeenCalledWith('quit', code);
      });
    });

    describe('getAppVersion', () => {
      it('should invoke get-app-version and return the version', async () => {
        const mockVersion = '1.0.0';
        (ipcRenderer.invoke as jest.Mock).mockResolvedValue(mockVersion);

        const version = await window.electron.getAppVersion();
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-app-version');
        expect(version).toBe(mockVersion);
      });

      it('should handle errors in getAppVersion gracefully', async () => {
        const error = new Error('Test Error');
        (ipcRenderer.invoke as jest.Mock).mockRejectedValue(error);

        await expect(window.electron.getAppVersion()).rejects.toThrow(
          'Test Error'
        );
      });
    });
  });

  describe('Serial Port', () => {
    describe('list', () => {
      it('should invoke serial-port-list when list is called', async () => {
        const mockPorts = [{ path: '/dev/ttyUSB0' }];
        (ipcRenderer.invoke as jest.Mock).mockResolvedValue(mockPorts);

        const ports = await window.electron.serialPort.list();
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('serial-port-list');
        expect(ports).toEqual(mockPorts);
      });

      it('should handle errors when listing serial ports', async () => {
        const error = new Error('Port list error');
        (ipcRenderer.invoke as jest.Mock).mockRejectedValue(error);

        await expect(window.electron.serialPort.list()).rejects.toThrow(
          'Port list error'
        );
      });
    });

    describe('open', () => {
      it('should invoke serial-port-open with options when open is called', async () => {
        const openOptions = { path: '/dev/ttyUSB0', baudRate: 9600 };
        (ipcRenderer.invoke as jest.Mock).mockResolvedValue(undefined);

        await window.electron.serialPort.open(openOptions);
        expect(ipcRenderer.invoke).toHaveBeenCalledWith(
          'serial-port-open',
          openOptions
        );
      });

      it('should handle errors when opening the serial port', async () => {
        const openOptions = { path: '/dev/ttyUSB0', baudRate: 9600 };
        const error = new Error('Port open error');
        (ipcRenderer.invoke as jest.Mock).mockRejectedValue(error);

        await expect(
          window.electron.serialPort.open(openOptions)
        ).rejects.toThrow('Port open error');
      });
    });

    describe('close', () => {
      it('should invoke serial-port-close when close is called', async () => {
        (ipcRenderer.invoke as jest.Mock).mockResolvedValue(undefined);

        await window.electron.serialPort.close();
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('serial-port-close');
      });

      it('should handle errors when closing the serial port', async () => {
        const error = new Error('Port is not open');
        (ipcRenderer.invoke as jest.Mock).mockRejectedValue(error);

        await expect(window.electron.serialPort.close()).rejects.toThrow(
          'Port is not open'
        );
      });
    });

    describe('write', () => {
      it('should invoke serial-port-write with data and encoding', async () => {
        const data = 'test data';
        const encoding: Encoding = 'ascii';
        (ipcRenderer.invoke as jest.Mock).mockResolvedValue(true);

        const result = await window.electron.serialPort.write(data, encoding);
        expect(ipcRenderer.invoke).toHaveBeenCalledWith(
          'serial-port-write',
          data,
          encoding
        );
        expect(result).toBe(true);
      });

      it('should handle errors in write', async () => {
        const data = 'test data';
        const encoding: Encoding = 'ascii';
        const error = new Error('Write error');
        (ipcRenderer.invoke as jest.Mock).mockRejectedValue(error);

        await expect(
          window.electron.serialPort.write(data, encoding)
        ).rejects.toThrow('Write error');
      });
    });

    describe('isOpen', () => {
      it('should invoke serial-port-is-open and return status', async () => {
        (ipcRenderer.invoke as jest.Mock).mockResolvedValue(true);

        const isOpen = await window.electron.serialPort.isOpen();
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('serial-port-is-open');
        expect(isOpen).toBe(true);
      });

      it('should handle errors in isOpen', async () => {
        const error = new Error('Port open error');
        (ipcRenderer.invoke as jest.Mock).mockRejectedValue(error);

        await expect(window.electron.serialPort.isOpen()).rejects.toThrow(
          'Port open error'
        );
      });
    });

    describe('onData', () => {
      it('should add onData listener and handle hex encoding', () => {
        const callback = jest.fn();
        const mockData = Buffer.from('test data');
        const hexEncoding = 'hex';

        (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) =>
          listener(
            {},
            mockData.toString('hex').toUpperCase().match(/.{2}/g).join(' ')
          )
        );
        const cleanup = window.electron.serialPort.onData(
          callback,
          hexEncoding
        );

        expect(ipcRenderer.send).toHaveBeenCalledWith(
          'serial-port-add-on-data-event-listener',
          hexEncoding
        );
        expect(ipcRenderer.on).toHaveBeenCalledWith(
          'serial-port-on-data',
          expect.any(Function)
        );
        expect(callback).toHaveBeenCalledWith('74 65 73 74 20 64 61 74 61');

        cleanup();
        expect(ipcRenderer.removeListener).toHaveBeenCalledWith(
          'serial-port-on-data',
          expect.any(Function)
        );
        expect(ipcRenderer.send).toHaveBeenCalledWith(
          'serial-port-remove-on-data-event-listener'
        );
      });

      it('should add onData listener and handle ascii encoding', () => {
        const callback = jest.fn();
        const mockData = Buffer.from('test data');
        const asciiEncoding = 'ascii';

        (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) =>
          listener({}, mockData.toString(asciiEncoding))
        );
        const cleanup = window.electron.serialPort.onData(
          callback,
          asciiEncoding
        );

        expect(ipcRenderer.send).toHaveBeenCalledWith(
          'serial-port-add-on-data-event-listener',
          asciiEncoding
        );
        expect(ipcRenderer.on).toHaveBeenCalledWith(
          'serial-port-on-data',
          expect.any(Function)
        );
        expect(callback).toHaveBeenCalledWith('test data');

        cleanup();
        expect(ipcRenderer.removeListener).toHaveBeenCalledWith(
          'serial-port-on-data',
          expect.any(Function)
        );
        expect(ipcRenderer.send).toHaveBeenCalledWith(
          'serial-port-remove-on-data-event-listener'
        );
      });

      it('should handle serial-port onData event with undefined encoding gracefully', () => {
        const callback = jest.fn();
        const mockData = Buffer.from('data');

        (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) =>
          listener({}, mockData.toString())
        );
        const cleanup = window.electron.serialPort.onData(callback, undefined);

        expect(ipcRenderer.send).toHaveBeenCalledWith(
          'serial-port-add-on-data-event-listener',
          undefined
        );
        expect(ipcRenderer.on).toHaveBeenCalledWith(
          'serial-port-on-data',
          expect.any(Function)
        );

        expect(callback).toHaveBeenCalledWith('data');

        cleanup();
        expect(ipcRenderer.removeListener).toHaveBeenCalledWith(
          'serial-port-on-data',
          expect.any(Function)
        );
        expect(ipcRenderer.send).toHaveBeenCalledWith(
          'serial-port-remove-on-data-event-listener'
        );
      });

      it('should remove onData listener on cleanup', () => {
        const callback = jest.fn();
        const cleanup = window.electron.serialPort.onData(callback, 'ascii');

        cleanup();
        (ipcRenderer.on as jest.Mock)('serial-port-on-data', {}, 'test data');

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('onError', () => {
      it('should add and remove onError listener and trigger callback on error', () => {
        const callback = jest.fn();
        const mockError = new Error('Serial error');

        (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) =>
          listener({}, mockError)
        );
        const cleanup = window.electron.serialPort.onError(callback);

        expect(ipcRenderer.send).toHaveBeenCalledWith(
          'serial-port-add-on-error-event-listener'
        );
        expect(ipcRenderer.on).toHaveBeenCalledWith(
          'serial-port-on-error',
          expect.any(Function)
        );
        expect(callback).toHaveBeenCalledWith(mockError);

        cleanup();
        expect(ipcRenderer.removeListener).toHaveBeenCalledWith(
          'serial-port-on-error',
          expect.any(Function)
        );
        expect(ipcRenderer.send).toHaveBeenCalledWith(
          'serial-port-remove-on-error-event-listener'
        );
      });

      it('should remove onError listener on cleanup', () => {
        const callback = jest.fn();
        const cleanup = window.electron.serialPort.onError(callback);

        cleanup();
        (ipcRenderer.on as jest.Mock)('serial-port-on-error', {});

        expect(callback).not.toHaveBeenCalled();
      });
    });
  });
});
