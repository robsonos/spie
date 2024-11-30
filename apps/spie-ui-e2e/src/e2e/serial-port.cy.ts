import { type OpenOptions } from '@serialport/bindings-interface';
import { type SerialPortEvent } from '@spie/types';

import { mockElectronAPI } from '../fixtures/mocks/electron-api.mock';

describe('Serial Port component', () => {
  const mockSerialPortList = [
    { path: '/dev/ttyUSB0', manufacturer: 'Manufacturer1' },
    { path: '/dev/ttyUSB1', manufacturer: 'Manufacturer2' },
  ];

  let onEventTrigger: ((event: SerialPortEvent) => void) | null;

  beforeEach(() => {
    cy.visit('/');

    cy.on('window:before:load', (win) => {
      const listeners: Array<(serialPortEvent: SerialPortEvent) => void> = [];

      win.electron = mockElectronAPI();

      win.electron.serialPort.list = cy.stub().resolves(mockSerialPortList);
      win.electron.serialPort.onEvent = cy
        .stub()
        .callsFake((callback: (serialPortEvent: SerialPortEvent) => void) => {
          listeners.push(callback);

          onEventTrigger = (serialPortEvent) => {
            listeners.forEach((listener) => listener(serialPortEvent));
          };

          return () => {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
              listeners.splice(index, 1);
            }
          };
        });
    });
  });

  it('should display available serial ports in the dropdown', () => {
    cy.get('app-connection [placeholder="Select Serial Port"]').click();
    cy.get('ion-alert .alert-radio-button').should(
      'have.length',
      mockSerialPortList.length
    );

    mockSerialPortList.forEach((item, index) => {
      cy.get('ion-alert .alert-radio-button')
        .eq(index)
        .should('contain.text', item.path);
    });
  });

  it('should allow selecting a serial port', () => {
    const expectedPath = mockSerialPortList[0].path;

    cy.get('app-connection [placeholder="Select Serial Port"]').selectOption(
      expectedPath
    );

    cy.get('app-connection [placeholder="Select Serial Port"]')
      .shadow()
      .find('.select-text')
      .should('contain', expectedPath);
  });

  it('should allow selecting a baud rate', () => {
    const expectedBaudRate = 115200;

    cy.get('app-connection [placeholder="Select Baud Rate"]').selectOption(
      expectedBaudRate
    );

    cy.get('app-connection [placeholder="Select Baud Rate"]')
      .shadow()
      .find('.select-text')
      .should('contain', expectedBaudRate);
  });

  it('should disable the Connect button when no serial port is selected', () => {
    cy.get('app-connection ion-button')
      .contains('Connect')
      .should('have.class', 'button-disabled');
  });

  it('should enable the Connect button after selecting a port', () => {
    const expectedPath = mockSerialPortList[0].path;

    cy.get('app-connection [placeholder="Select Serial Port"]').selectOption(
      expectedPath
    );
    cy.get('app-connection ion-button')
      .contains('Connect')
      .should('not.have.class', 'button-disabled');
  });

  it('should correctly call the IPC open and close methods', () => {
    const openOptions: OpenOptions = {
      path: mockSerialPortList[0].path,
      baudRate: 9600,
    };

    cy.get('app-connection [placeholder="Select Serial Port"]').selectOption(
      openOptions.path
    );
    cy.get('app-connection [placeholder="Select Baud Rate"]').selectOption(
      openOptions.baudRate
    );

    cy.get('app-connection ion-button').contains('Connect').click();
    cy.wrap(null).then(() => {
      if (onEventTrigger) {
        onEventTrigger({ event: 'open' });
      }
    });
    cy.window().then((win) => {
      cy.wrap(win.electron.serialPort.open).should(
        'have.been.calledOnceWith',
        Cypress.sinon.match(openOptions)
      );
    });
    cy.get('app-connection ion-button')
      .contains('Disconnect')
      .should('be.visible');

    cy.get('app-connection ion-button').contains('Disconnect').click();
    cy.wrap(null).then(() => {
      if (onEventTrigger) {
        onEventTrigger({ event: 'close' });
      }
    });
    cy.window().then((win) => {
      cy.wrap(win.electron.serialPort.close).should('have.been.calledOnce');
    });
    cy.get('app-connection ion-button')
      .contains('Connect')
      .should('be.visible');
  });

  it('should reconnect when baud rate changes', () => {
    cy.wrap(null).then(() => {
      if (onEventTrigger) {
        onEventTrigger({ event: 'open' });
      }
    });

    cy.get('app-connection [placeholder="Select Baud Rate"]').selectOption(
      115200
    );

    cy.window().then((win) => {
      cy.wrap(win.electron.serialPort.open).should(
        'have.been.calledWith',
        Cypress.sinon.match.has('baudRate', 115200)
      );
    });

    cy.get('app-connection ion-button')
      .contains('Disconnect')
      .should('be.visible');
  });

  it('should open and close the advanced modal', () => {
    cy.get('app-connection ion-button ion-icon').parent().click();
    cy.get('ion-modal').should('be.visible');
    cy.get('ion-modal ion-toolbar ion-button').click();
    cy.get('ion-modal').should('not.be.visible');
  });

  it('should reconnect after changing advanced settings', () => {
    cy.wrap(null).then(() => {
      if (onEventTrigger) {
        onEventTrigger({ event: 'open' });
      }
    });

    cy.get('app-connection ion-button ion-icon').parent().click();

    cy.getAdvancedModalCheckboxElement(
      'connection-advanced-modal',
      'HUPCL'
    ).click();

    cy.getAdvancedModalSelectElement(
      'connection-advanced-modal',
      'Data Bits'
    ).selectOption('5');

    cy.window().then((win) => {
      setTimeout(() => {
        cy.wrap(win.electron.serialPort.close).should('have.been.calledTwice');
        cy.wrap(win.electron.serialPort.open).should(
          'have.been.calledWith',
          Cypress.sinon.match.has('hupcl', false),
          Cypress.sinon.match.has('dataBits', 5)
        );
        cy.wrap(win.electron.serialPort.close).should('have.been.calledOnce');

        cy.get('app-connection ion-button')
          .contains('Disconnect')
          .should('be.visible');
      }, 500);
    });
  });
});
