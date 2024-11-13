export const getTittle = (): Cypress.Chainable<JQuery<HTMLElement>> =>
  cy.get('ion-app ion-header ion-toolbar ion-title');
