import {
  type AutoUpdaterEvent,
  type DataEvent,
  type ElectronAPI,
  type SerialPortEvent,
} from '@spie/types';

declare global {
  namespace Cypress {
    interface Window {
      electron: ElectronAPI;
      onAutoUpdaterEventTrigger: (autoUpdaterEvent: AutoUpdaterEvent) => void;
      onSerialPortEventTrigger: (
        serialPortEvent: SerialPortEvent | DataEvent
      ) => void;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Chainable<Subject> {
      getAdvancedModalSelectElement(
        modal: string,
        label: string
      ): Cypress.Chainable;
      getAdvancedModalCheckboxElement(
        modal: string,
        label: string
      ): Cypress.Chainable;
      selectDropdownOption(option: string | number): Cypress.Chainable;
      connect(path: string, baudRate: number): void;
      disconnect(): void;
    }
  }
}

Cypress.Commands.add(
  'getAdvancedModalSelectElement',
  (modal: string, label: string) => {
    return cy
      .get(`ion-modal#${modal} ion-content ion-list`)
      .get(`[label="${label}"]`);
  }
);

Cypress.Commands.add(
  'getAdvancedModalCheckboxElement',
  (modal: string, label: string) => {
    return cy
      .get(`ion-modal#${modal} ion-content ion-list ion-checkbox`)
      .contains(label);
  }
);

Cypress.Commands.add(
  'selectDropdownOption',
  { prevSubject: 'element' },
  (subject, option: string | number) => {
    cy.wrap(subject).click();
    cy.get('ion-alert .alert-radio-button').contains(option).click();
    cy.get('ion-alert button.alert-button').contains('OK').click();
  }
);

Cypress.Commands.add('connect', (path: string, baudRate: number) => {
  cy.get(
    'app-connection-component [placeholder="Select Serial Port"]'
  ).selectDropdownOption(path);
  cy.get(
    'app-connection-component [placeholder="Select Baud Rate"]'
  ).selectDropdownOption(baudRate);

  cy.get('app-connection-component ion-button').contains('Connect').click();

  cy.window().then((win) => {
    win.onSerialPortEventTrigger({ type: 'open' });
  });
});

Cypress.Commands.add('disconnect', () => {
  cy.get('app-connection-component ion-button').contains('Disconnect').click();

  cy.window().then((win) => {
    win.onSerialPortEventTrigger({ type: 'close' });
  });
});
