import { type SerialPortEvent } from '@spie/types';

import { mockElectronAPI } from '../fixtures/mocks/electron-api.mock';

describe('Send component', () => {
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

  it('should enable/disable send based on serial port status', () => {
    const data = 'test test test test test test test test test test';

    cy.wrap(null).then(() => {
      if (onEventTrigger) {
        onEventTrigger({ event: 'open' });
      }
    });

    cy.get('app-send ion-input input').invoke('val', data).trigger('input');

    cy.get('app-send ion-button')
      .contains('Send')
      .should('not.have.class', 'button-disabled');

    cy.wrap(null).then(() => {
      if (onEventTrigger) {
        onEventTrigger({ event: 'close' });
      }
    });

    cy.get('app-send ion-button')
      .contains('Send')
      .should('have.class', 'button-disabled');
  });

  it('should clear input after pressing clear input button', () => {
    const data = 'test test test test test test test test test test';

    cy.wrap(null).then(() => {
      if (onEventTrigger) {
        onEventTrigger({ event: 'open' });
      }
    });

    cy.get('app-send ion-input input').invoke('val', data).trigger('input');
    cy.get('app-send ion-input button').click();

    cy.get('app-send ion-input input').should('have.value', '');
  });

  it('should send input with default options', () => {
    const data = 'test test test test test test test test test test';
    const formattedData = `${data}\n`;

    cy.wrap(null).then(() => {
      if (onEventTrigger) {
        onEventTrigger({ event: 'open' });
      }
    });

    cy.get('app-send ion-input input').invoke('val', data).trigger('input');

    cy.get('app-send ion-button').contains('Send').click();

    cy.window().then((win) => {
      cy.wrap(win.electron.serialPort.write).should(
        'have.been.calledOnceWithExactly',
        formattedData,
        'ascii'
      );
    });
  });

  it('should open and close the advanced modal', () => {
    cy.get('app-send ion-button ion-icon').parent().click();
    cy.get('ion-modal').should('be.visible');
    cy.get('ion-modal ion-toolbar ion-button').click();
    cy.get('ion-modal').should('not.be.visible');
  });

  it('should clear input after changing encoding', () => {
    const data = 'test test test test test test test test test test';
    cy.get('app-send ion-input input').invoke('val', data).trigger('input');

    cy.get('app-send ion-button ion-icon').parent().click();
    cy.getAdvancedModalSelectElement(
      'send-advanced-modal',
      'Encoding'
    ).selectOption('Hex');
    cy.get('ion-modal ion-toolbar ion-button').click();

    cy.get('app-send ion-input input').should('have.value', '');
  });

  it('should format hex input', () => {
    const data = 'test test test test test test test test test test';
    const expectedHexData = 'EE EE EE EE EE';

    cy.get('app-send ion-button ion-icon').parent().click();
    cy.getAdvancedModalSelectElement(
      'send-advanced-modal',
      'Encoding'
    ).selectOption('Hex');
    cy.get('ion-modal ion-toolbar ion-button').click();

    cy.get('app-send ion-input input').invoke('val', data).trigger('input');

    cy.get('app-send ion-input input').should('have.value', expectedHexData);
  });

  it('should send input with hex encoding', () => {
    const data = 'test test test test test test test test test test\n\n\n';
    const formattedData = 'EEEEEEEEEE';

    cy.get('app-send ion-button ion-icon').parent().click();
    cy.getAdvancedModalSelectElement(
      'send-advanced-modal',
      'Encoding'
    ).selectOption('Hex');
    cy.get('ion-modal ion-toolbar ion-button').click();

    cy.wrap(null).then(() => {
      if (onEventTrigger) {
        onEventTrigger({ event: 'open' });
      }
    });

    cy.get('app-send ion-input input').invoke('val', data).trigger('input');

    cy.get('app-send ion-button').contains('Send').click();

    cy.window().then((win) => {
      cy.wrap(win.electron.serialPort.write).should(
        'have.been.calledOnceWithExactly',
        formattedData,
        'hex'
      );
    });
  });

  it('should send input with advanced delimiter', () => {
    const data = 'test test test test test test test test test test';
    const formattedData = `${data}\r\n`;

    cy.get('app-send ion-button ion-icon').parent().click();
    cy.getAdvancedModalSelectElement(
      'send-advanced-modal',
      'Delimiter'
    ).selectOption('CRLF (\\r\\n)');
    cy.get('ion-modal ion-toolbar ion-button').click();

    cy.wrap(null).then(() => {
      if (onEventTrigger) {
        onEventTrigger({ event: 'open' });
      }
    });

    cy.get('app-send ion-input input').invoke('val', data).trigger('input');

    cy.get('app-send ion-button').contains('Send').click();

    cy.window().then((win) => {
      cy.wrap(win.electron.serialPort.write).should(
        'have.been.calledOnceWithExactly',
        formattedData,
        'ascii'
      );
    });
  });
});
