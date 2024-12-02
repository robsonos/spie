import { type SerialPortEvent } from '@spie/types';

import { mockElectronAPI } from '../fixtures/mocks/electron-api.mock';

describe('Terminal component', () => {
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

  it('should display data on the terminal', () => {
    const data = 'test\ntest\ntest\ntest\ntest\ntest\ntest\ntest\ntest\ntest\n';
    cy.wrap(null).then(() => {
      if (onEventTrigger) {
        onEventTrigger({
          event: 'data',
          data: data,
        });
      }
    });

    cy.get('app-terminal ion-textarea textarea').should('contain', data);
  });

  it('should clear the terminal', () => {
    const data = 'test\ntest\ntest\ntest\ntest\ntest\ntest\ntest\ntest\ntest\n';
    cy.wrap(null).then(() => {
      if (onEventTrigger) {
        onEventTrigger({
          event: 'data',
          data: data,
        });
      }
    });

    cy.get('app-terminal ion-button').contains('Clear Terminal').click();
    cy.get('app-terminal ion-textarea textarea').should('contain', '');
  });

  it('should auto scroll when data is emitted', () => {
    const data = 'test\ntest\ntest\ntest\ntest\ntest\ntest\ntest\ntest\ntest\n';
    cy.wrap(null).then(() => {
      if (onEventTrigger) {
        onEventTrigger({
          event: 'data',
          data: data,
        });
      }
    });

    cy.get('app-terminal ion-textarea textarea').then((textarea) => {
      const scrollTop = textarea[0].scrollTop;
      const scrollHeight = textarea[0].scrollHeight;
      const clientHeight = textarea[0].clientHeight;

      expect(scrollTop + clientHeight).to.equal(scrollHeight);
    });
  });

  it('should open and close the advanced modal', () => {
    cy.get('app-terminal ion-button ion-icon').parent().click();
    cy.get('ion-modal').should('be.visible');
    cy.get('ion-modal ion-toolbar ion-button').click();
    cy.get('ion-modal').should('not.be.visible');
  });

  it('should clear the terminal after changing encoding', () => {
    const data = 'test\ntest\ntest\ntest\ntest\ntest\ntest\ntest\ntest\ntest\n';
    cy.wrap(null).then(() => {
      if (onEventTrigger) {
        onEventTrigger({
          event: 'data',
          data: data,
        });
      }
    });

    cy.get('app-terminal ion-button ion-icon').parent().click();
    cy.getAdvancedModalSelectElement(
      'terminal-advanced-modal',
      'Encoding'
    ).selectOption('Hex');

    cy.get('app-terminal ion-textarea textarea').should('contain', '');
  });

  it('should clear the terminal after changing show timestamps', () => {
    const data = 'test\ntest\ntest\ntest\ntest\ntest\ntest\ntest\ntest\ntest\n';
    cy.wrap(null).then(() => {
      if (onEventTrigger) {
        onEventTrigger({
          event: 'data',
          data: data,
        });
      }
    });

    cy.get('app-terminal ion-button ion-icon').parent().click();
    cy.getAdvancedModalCheckboxElement(
      'terminal-advanced-modal',
      'Show Timestamps'
    ).click();

    cy.get('app-terminal ion-textarea textarea').should('contain', '');
  });

  it('should not auto scroll when auto scroll is disabled and data is emitted', () => {
    let initialScrollTop = 0;

    const data = 'test\ntest\ntest\ntest\ntest\ntest\ntest\ntest\ntest\ntest\n';

    cy.get('app-terminal ion-button ion-icon').parent().click();
    cy.getAdvancedModalCheckboxElement(
      'terminal-advanced-modal',
      'Auto Scroll'
    ).click();
    cy.get('ion-modal ion-toolbar ion-button').click();

    cy.get('textarea').then((textarea) => {
      initialScrollTop = textarea[0].scrollTop;
    });

    cy.wrap(null).then(() => {
      if (onEventTrigger) {
        onEventTrigger({
          event: 'data',
          data: data,
        });
      }
    });

    cy.get('app-terminal ion-textarea textarea').then((textarea) => {
      const currentScrollTop = textarea[0].scrollTop;
      expect(currentScrollTop).to.equal(initialScrollTop);
    });
  });
});
