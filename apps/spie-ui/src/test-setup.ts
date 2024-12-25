import { TestBed } from '@angular/core/testing';
import { type ElectronAPI } from '@spie/types';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

import { ElectronService } from './app/services/electron.service';

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

export const mockElectronAPI: ElectronAPI = {
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
});

afterEach(() => {
  jest.clearAllMocks();
});
