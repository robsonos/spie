export {};

declare global {
  namespace Cypress {
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
      selectOption(option: string | number): Cypress.Chainable;
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
  'selectOption',
  { prevSubject: 'element' },
  (subject, option: string | number) => {
    cy.wrap(subject).click();
    cy.get('ion-alert .alert-radio-button').contains(option).click();
    cy.get('ion-alert button.alert-button').contains('OK').click();
  }
);
