import { type ElectronAPI, type SerialPortEvent } from '@spie/types';

export const mockSerialPortList = [
  { path: '/dev/ttyUSB0', manufacturer: 'Manufacturer1' },
  { path: '/dev/ttyUSB1', manufacturer: 'Manufacturer2' },
];

export function mockElectronAPI(win: any): ElectronAPI {
  const listeners: Array<(serialPortEvent: SerialPortEvent) => void> = [];

  const electronAPI: ElectronAPI = {
    platform: '',
    quit: cy.stub(),
    getVersion: cy.stub(),
    downloadUpdate: cy.stub(),
    installUpdate: cy.stub(),
    onUpdateEvent: cy.stub(),
    serialPort: {
      list: cy.stub().resolves(mockSerialPortList),
      open: cy.stub(),
      close: cy.stub(),
      isOpen: cy.stub().resolves(false),
      write: cy.stub().resolves(true),
      setReadEncoding: cy.stub(),
      getReadEncoding: cy.stub().resolves('hex'),
      getOpenOptions: cy.stub().resolves(null),
      onEvent: cy
        .stub()
        .callsFake((callback: (serialPortEvent: SerialPortEvent) => void) => {
          listeners.push(callback);

          // Assign the passed `onEventTrigger` function to trigger the events
          win.onEventTrigger = (serialPortEvent: SerialPortEvent) => {
            listeners.forEach((listener) => listener(serialPortEvent));
          };

          return () => {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
              listeners.splice(index, 1);
            }
          };
        }),
    },
  };

  return electronAPI;
}
