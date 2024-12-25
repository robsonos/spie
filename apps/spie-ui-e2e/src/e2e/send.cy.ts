import {
  mockElectronAPI,
  mockSerialPortList,
} from '../fixtures/mocks/electron-api.mock';

describe('Send routine', () => {
  beforeEach(() => {
    cy.visit('/');

    cy.on('window:before:load', (win) => {
      win.electron = mockElectronAPI(win);
    });

    cy.window().should((win) => {
      expect(win.onSerialPortEventTrigger).to.be.a('function');
    });

    cy.connect(mockSerialPortList[0].path, 9600);
  });

  it('should enable/disable send based on serial port status', () => {
    const mockData = 'test test test test test test test test test test';

    cy.get('app-send-component ion-input input')
      .invoke('val', mockData)
      .trigger('input');

    cy.get('app-send-component ion-button')
      .contains('Send')
      .should('not.have.class', 'button-disabled');

    cy.disconnect();

    cy.get('app-send-component ion-button')
      .contains('Send')
      .should('have.class', 'button-disabled');
  });

  it('should set and clear input', () => {
    const mockData = 'test test test test test test test test test test';

    cy.get('app-send-component ion-input input')
      .invoke('val', mockData)
      .trigger('input');

    cy.get('app-send-component ion-input input').should('have.value', mockData);
    cy.get('app-send-component ion-input button').click();

    cy.get('app-send-component ion-input input').should('have.value', '');
  });

  it('should send input with default options', () => {
    const mockData = 'test test test test test test test test test test';
    const formattedData = `${mockData}\n`;

    cy.get('app-send-component ion-input input')
      .invoke('val', mockData)
      .trigger('input');

    cy.get('app-send-component ion-button').contains('Send').click();

    cy.window().then((win) => {
      cy.wrap(win.electron.serialPort.write).should(
        'have.been.calledOnceWithExactly',
        formattedData,
        'ascii'
      );
    });
  });

  it('should open and close the advanced modal', () => {
    cy.get('app-send-component ion-button [name="settings-outline"]')
      .parent()
      .click();
    cy.get('ion-modal ion-toolbar ion-title').should(
      'contain',
      'Advanced Send Settings'
    );
    cy.get('ion-modal ion-toolbar ion-button').click();
    cy.get('ion-modal').should('not.be.visible');
  });

  it('should clear input after changing encoding', () => {
    const mockData = 'test test test test test test test test test test';
    cy.get('app-send-component ion-input input')
      .invoke('val', mockData)
      .trigger('input');

    cy.get('app-send-component ion-button [name="settings-outline"]')
      .parent()
      .click();
    cy.getAdvancedModalSelectElement(
      'send-advanced-modal',
      'Encoding'
    ).selectDropdownOption('Hex');
    cy.get('ion-modal ion-toolbar ion-button').click();

    cy.get('app-send-component ion-input input').should('have.value', '');
  });

  it('should format hex input', () => {
    const mockData = 'test test test test test test test test test test';
    const expectedHexData = 'EE EE EE EE EE';

    cy.get('app-send-component ion-button [name="settings-outline"]')
      .parent()
      .click();
    cy.getAdvancedModalSelectElement(
      'send-advanced-modal',
      'Encoding'
    ).selectDropdownOption('Hex');
    cy.get('ion-modal ion-toolbar ion-button').click();

    cy.get('app-send-component ion-input input')
      .invoke('val', mockData)
      .trigger('input');

    cy.get('app-send-component ion-input input').should(
      'have.value',
      expectedHexData
    );
  });

  it('should send input with hex encoding', () => {
    const mockData = 'test test test test test test test test test test\n\n\n';
    const formattedData = 'EEEEEEEEEE';

    cy.get('app-send-component ion-button [name="settings-outline"]')
      .parent()
      .click();
    cy.getAdvancedModalSelectElement(
      'send-advanced-modal',
      'Encoding'
    ).selectDropdownOption('Hex');
    cy.get('ion-modal ion-toolbar ion-button').click();

    cy.get('app-send-component ion-input input')
      .invoke('val', mockData)
      .trigger('input');

    cy.get('app-send-component ion-button').contains('Send').click();

    cy.window().then((win) => {
      cy.wrap(win.electron.serialPort.write).should(
        'have.been.calledOnceWithExactly',
        formattedData,
        'hex'
      );
    });
  });

  it('should send input with advanced delimiter', () => {
    const mockData = 'test test test test test test test test test test';
    const formattedData = `${mockData}\r\n`;

    cy.get('app-send-component ion-button [name="settings-outline"]')
      .parent()
      .click();
    cy.getAdvancedModalSelectElement(
      'send-advanced-modal',
      'Delimiter'
    ).selectDropdownOption('CRLF (\\r\\n)');
    cy.get('ion-modal ion-toolbar ion-button').click();

    cy.get('app-send-component ion-input input')
      .invoke('val', mockData)
      .trigger('input');

    cy.get('app-send-component ion-button').contains('Send').click();

    cy.window().then((win) => {
      cy.wrap(win.electron.serialPort.write).should(
        'have.been.calledOnceWithExactly',
        formattedData,
        'ascii'
      );
    });
  });
});
