import type { ElectronAPI } from '@spie/types';

describe('Serial Port Configuration', () => {
  let mockElectronAPI: ElectronAPI;

  beforeEach(() => {
    mockElectronAPI = {
      platform: '',
      quit: cy.stub(),
      getVersion: cy.stub().resolves('v1.0.0'),
      downloadUpdate: cy.stub(),
      installUpdate: cy.stub(),
      onUpdateEvent: cy.stub(),
      serialPort: {
        list: cy.stub().resolves([
          { path: '/dev/ttyUSB0', manufacturer: 'Manufacturer1' },
          { path: '/dev/ttyUSB1', manufacturer: 'Manufacturer2' },
        ]),
        open: cy.stub().resolves(),
        close: cy.stub().resolves(),
        isOpen: cy.stub().resolves(false),
        write: cy.stub().resolves(true),
        setReadEncoding: cy.stub().resolves(false),
        onEvent: cy.stub(),
      },
    };

    cy.visit('/', {
      onBeforeLoad(win) {
        win.electron = mockElectronAPI;
      },
    });
  });

  it('should display available serial ports in the dropdown', () => {
    cy.get('[data-cy="serial-port-select"]').click();

    cy.get('ion-alert .alert-radio-button').should('have.length', 2);
    cy.get('ion-alert .alert-radio-button')
      .eq(0)
      .should('contain.text', '/dev/ttyUSB0');
    cy.get('ion-alert .alert-radio-button')
      .eq(1)
      .should('contain.text', '/dev/ttyUSB1');
  });

  it('should allow selecting a serial port', () => {
    cy.get('[data-cy="serial-port-select"]').click();
    cy.get('ion-alert .alert-radio-button').eq(0).click();
    cy.get('ion-alert button.alert-button').contains('OK').click();

    cy.get('[data-cy="serial-port-select"]')
      .shadow()
      .find('.select-text')
      .should('contain', '/dev/ttyUSB0');
  });

  it('should allow changing the baud rate', () => {
    cy.get('[data-cy="baud-rate-select"]').click();
    cy.get('ion-alert .alert-radio-button').contains('115200').click();
    cy.get('ion-alert button.alert-button').contains('OK').click();

    cy.get('[data-cy="baud-rate-select"]')
      .shadow()
      .find('.select-text')
      .should('contain', '115200');
  });

  it('should disable the Connect button when no serial port is selected', () => {
    cy.get('[data-cy="connect-button"]').should(
      'have.class',
      'button-disabled'
    );
  });

  it('should enable the Connect button when a serial port is selected', () => {
    cy.get('[data-cy="serial-port-select"]').click();
    cy.get('ion-alert .alert-radio-button').eq(0).click();
    cy.get('ion-alert button.alert-button').contains('OK').click();

    cy.get('[data-cy="connect-button"]').should('not.be.disabled');
    cy.get('[data-cy="connect-button"]').should(
      'not.have.class',
      'button-disabled'
    );
  });
});
