import {
  type AutoUpdaterEvent,
  type DataEvent,
  type ElectronAPI,
  type SerialPortEvent,
} from '@spie/types';

export const mockSerialPortList = [
  { path: '/dev/ttyUSB0', manufacturer: 'Manufacturer1' },
  { path: '/dev/ttyUSB1', manufacturer: 'Manufacturer2' },
];

export function mockElectronAPI(win: Cypress.AUTWindow): ElectronAPI {
  const onSerialPortEventListeners: Array<
    (serialPortEvent: SerialPortEvent | DataEvent) => void
  > = [];
  const onAutoUpdaterEventTriggerListeners: Array<
    (autoUpdaterEvent: AutoUpdaterEvent) => void
  > = [];

  const electronAPI: ElectronAPI = {
    platform: '',
    quit: cy.stub(),
    getVersion: cy.stub(),
    downloadUpdate: cy.stub(),
    installUpdate: cy.stub(),
    onUpdateEvent: cy
      .stub()
      .callsFake((callback: (autoUpdaterEvent: AutoUpdaterEvent) => void) => {
        onAutoUpdaterEventTriggerListeners.push(callback);

        win.onAutoUpdaterEventTrigger = (
          autoUpdaterEvent: AutoUpdaterEvent
        ) => {
          onAutoUpdaterEventTriggerListeners.forEach((listener) =>
            listener(autoUpdaterEvent)
          );
        };

        return () => {
          const index = onAutoUpdaterEventTriggerListeners.indexOf(callback);
          if (index !== -1) {
            onAutoUpdaterEventTriggerListeners.splice(index, 1);
          }
        };
      }),
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
        .callsFake(
          (
            callback: (serialPortEvent: SerialPortEvent | DataEvent) => void
          ) => {
            onSerialPortEventListeners.push(callback);

            win.onSerialPortEventTrigger = (serialPortEvent) => {
              onSerialPortEventListeners.forEach((listener) =>
                listener(serialPortEvent)
              );
            };

            return () => {
              const index = onSerialPortEventListeners.indexOf(callback);
              if (index !== -1) {
                onSerialPortEventListeners.splice(index, 1);
              }
            };
          }
        ),
    },
  };

  return electronAPI;
}
