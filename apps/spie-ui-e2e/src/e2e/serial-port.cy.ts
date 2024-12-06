import {
  mockElectronAPI,
  mockSerialPortList,
} from '../fixtures/mocks/electron-api.mock';

describe('Serial Port component', () => {
  beforeEach(() => {
    cy.visit('/');

    cy.on('window:before:load', (win) => {
      win.electron = mockElectronAPI(win);
    });
  });

  it('should display available serial ports in the dropdown', () => {
    cy.get(
      'app-connection-component [placeholder="Select Serial Port"]'
    ).click();
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

    cy.get(
      'app-connection-component [placeholder="Select Serial Port"]'
    ).selectDropdownOption(expectedPath);

    cy.get('app-connection-component [placeholder="Select Serial Port"]')
      .shadow()
      .find('.select-text')
      .should('contain', expectedPath);
  });

  it('should allow selecting a baud rate', () => {
    const expectedBaudRate = 115200;

    cy.get(
      'app-connection-component [placeholder="Select Baud Rate"]'
    ).selectDropdownOption(expectedBaudRate);

    cy.get('app-connection-component [placeholder="Select Baud Rate"]')
      .shadow()
      .find('.select-text')
      .should('contain', expectedBaudRate);
  });

  it('should disable the Connect button when no serial port is selected', () => {
    cy.get('app-connection-component ion-button')
      .contains('Connect')
      .should('have.class', 'button-disabled');
  });

  it('should enable the Connect button after selecting a port', () => {
    const expectedPath = mockSerialPortList[0].path;

    cy.get(
      'app-connection-component [placeholder="Select Serial Port"]'
    ).selectDropdownOption(expectedPath);
    cy.get('app-connection-component ion-button')
      .contains('Connect')
      .should('not.have.class', 'button-disabled');
  });

  it('should correctly call the IPC open and close methods', () => {
    cy.connect(mockSerialPortList[0].path, 9600);

    cy.get('app-connection-component ion-button')
      .contains('Disconnect')
      .should('be.visible');

    cy.disconnect();

    cy.window().then((win) => {
      cy.wrap(win.electron.serialPort.close).should('have.been.calledOnce');
    });

    cy.get('app-connection-component ion-button')
      .contains('Connect')
      .should('be.visible');
  });

  it('should reconnect when baud rate changes', () => {
    cy.connect(mockSerialPortList[0].path, 9600);

    cy.get(
      'app-connection-component [placeholder="Select Baud Rate"]'
    ).selectDropdownOption(115200);

    cy.window().then((win) => {
      cy.wrap(win.electron.serialPort.open).should(
        'have.been.calledWith',
        Cypress.sinon.match.has('baudRate', 115200)
      );
    });

    cy.get('app-connection-component ion-button')
      .contains('Disconnect')
      .should('be.visible');
  });

  it('should open and close the advanced modal', () => {
    cy.get('app-connection-component ion-button [name="settings-outline"]')
      .parent()
      .click();
    cy.get('ion-modal').should('be.visible');
    cy.get('ion-modal ion-toolbar ion-button').click();
    cy.get('ion-modal').should('not.be.visible');
  });

  it('should reconnect after changing advanced settings', () => {
    cy.connect(mockSerialPortList[0].path, 9600);

    cy.get('app-connection-component ion-button [name="settings-outline"]')
      .parent()
      .click();

    cy.getAdvancedModalCheckboxElement(
      'connection-advanced-modal',
      'HUPCL'
    ).click();

    cy.getAdvancedModalSelectElement(
      'connection-advanced-modal',
      'Data Bits'
    ).selectDropdownOption('5');

    cy.window().then((win) => {
      setTimeout(() => {
        cy.wrap(win.electron.serialPort.close).should('have.been.calledTwice');
        cy.wrap(win.electron.serialPort.open).should(
          'have.been.calledWith',
          Cypress.sinon.match.has('hupcl', false),
          Cypress.sinon.match.has('dataBits', 5)
        );
        cy.wrap(win.electron.serialPort.close).should('have.been.calledOnce');

        cy.get('app-connection-component ion-button')
          .contains('Disconnect')
          .should('be.visible');
      }, 500);
    });
  });
});
