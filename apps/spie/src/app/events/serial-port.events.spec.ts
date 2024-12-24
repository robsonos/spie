import { type Encoding, type SerialPortEvent } from '@spie/types';
import { ipcRenderer } from 'electron';

import { electronAPI } from '../api/main.preload';

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

describe('Serial Port events', () => {
  beforeEach(() => {
    (window as Window).electron = electronAPI;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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

  describe('setReadEncoding', () => {
    it('should invoke serial-port-set-read-encoding and set encoding', async () => {
      const encoding = 'hex';

      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(true);

      await window.electron.serialPort.setReadEncoding(encoding);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'serial-port-set-read-encoding',
        encoding
      );
    });
  });

  describe('getReadEncoding', () => {
    it('should invoke serial-port-get-read-encoding and get encoding', async () => {
      const mockEncoding = 'hex';

      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(mockEncoding);

      const encoding = await window.electron.serialPort.getReadEncoding();

      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'serial-port-get-read-encoding'
      );
      expect(encoding).toEqual(mockEncoding);
    });
  });

  describe('getOpenOptions', () => {
    it('should invoke serial-port-get-open-options and get open options', async () => {
      const mockOpenOptions = { path: '/dev/ttyUSB0', baudRate: 9600 };

      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(mockOpenOptions);

      const openOptions = await window.electron.serialPort.getOpenOptions();

      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'serial-port-get-open-options'
      );
      expect(openOptions).toEqual(openOptions);
    });
  });

  describe('onEvent', () => {
    it('should add listener', () => {
      const callback = jest.fn();

      const cleanup = window.electron.serialPort.onEvent(callback);

      expect(ipcRenderer.send).toHaveBeenCalledWith(
        'serial-port-event-add-listener'
      );
      expect(ipcRenderer.on).toHaveBeenCalledWith(
        'serial-port-event',
        expect.any(Function)
      );

      cleanup();
    });

    it('should handle error event', () => {
      const callback = jest.fn();
      const error = new Error('Test error');
      const mockEvent: SerialPortEvent = { type: 'error', error };

      (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) => {
        listener({}, mockEvent);
      });

      window.electron.serialPort.onEvent(callback);

      expect(callback).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle open event', () => {
      const callback = jest.fn();
      const mockEvent: SerialPortEvent = { type: 'open' };

      (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) => {
        listener({}, mockEvent);
      });

      window.electron.serialPort.onEvent(callback);

      expect(callback).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle close event', () => {
      const callback = jest.fn();
      const mockEvent: SerialPortEvent = { type: 'close' };

      (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) => {
        listener({}, mockEvent);
      });

      window.electron.serialPort.onEvent(callback);

      expect(callback).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle data event with hex encoding', async () => {
      const callback = jest.fn();
      const encoding = 'hex';
      const chunk = Buffer.from('test data');
      const mockEvent: SerialPortEvent = {
        type: 'data',
        data: chunk.toString('hex').toUpperCase().match(/.{2}/g).join(' '),
      };

      await window.electron.serialPort.setReadEncoding(encoding);

      (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) => {
        listener({}, { type: 'data', data: mockEvent.data });
      });

      window.electron.serialPort.onEvent(callback);

      expect(callback).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle data event with ascii encoding', async () => {
      const callback = jest.fn();
      const encoding = 'ascii';
      const chunk = Buffer.from('test data');
      const mockEvent: SerialPortEvent = {
        type: 'data',
        data: chunk.toString('ascii'),
      };

      await window.electron.serialPort.setReadEncoding(encoding);

      (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) => {
        listener({}, { type: 'data', data: mockEvent.data });
      });

      window.electron.serialPort.onEvent(callback);

      expect(callback).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle drain event', () => {
      const callback = jest.fn();
      const mockEvent: SerialPortEvent = { type: 'drain' };

      (ipcRenderer.on as jest.Mock).mockImplementationOnce((_, listener) => {
        listener({}, mockEvent);
      });

      window.electron.serialPort.onEvent(callback);

      expect(callback).toHaveBeenCalledWith(mockEvent);
    });

    it('should remove listener', () => {
      const callback = jest.fn();

      const cleanup = window.electron.serialPort.onEvent(callback);

      cleanup();

      expect(ipcRenderer.removeListener).toHaveBeenCalledWith(
        'serial-port-event',
        expect.any(Function)
      );
      expect(ipcRenderer.send).toHaveBeenCalledWith(
        'serial-port-event-remove-listener'
      );
    });
  });
});
