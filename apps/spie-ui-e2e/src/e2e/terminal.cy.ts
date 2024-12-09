import {
  mockElectronAPI,
  mockSerialPortList,
} from '../fixtures/mocks/electron-api.mock';

describe('Terminal routine', () => {
  const mockData =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n';

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

  it('should display data on the terminal', () => {
    cy.window().then((win) => {
      win.onSerialPortEventTrigger({
        type: 'data',
        data: mockData,
      });
    });

    cy.get('app-terminal-component ion-textarea textarea').should(
      'contain',
      mockData
    );
  });

  it('should clear the terminal', () => {
    cy.window().then((win) => {
      win.onSerialPortEventTrigger({
        type: 'data',
        data: mockData,
      });
    });

    cy.get('app-terminal-component ion-button').contains('Clear').click();
    cy.get('app-terminal-component ion-textarea textarea').should(
      'contain',
      ''
    );
  });

  it('should auto scroll when data is emitted', () => {
    cy.window().then((win) => {
      for (let index = 0; index < 10; index++) {
        win.onSerialPortEventTrigger({
          type: 'data',
          data: mockData,
        });
      }
    });

    cy.get('app-terminal-component ion-textarea textarea').then((textarea) => {
      const scrollTop = textarea[0].scrollTop;
      const scrollHeight = textarea[0].scrollHeight;
      const clientHeight = textarea[0].clientHeight;

      expect(scrollTop + clientHeight).to.equal(scrollHeight);
    });
  });

  it('should clear the terminal with clear event', () => {
    cy.window().then((win) => {
      win.onSerialPortEventTrigger({
        type: 'data',
        data: mockData,
      });
    });

    cy.window().then((win) => {
      win.onSerialPortEventTrigger({
        type: 'clear',
      });
    });

    // cy.get('app-terminal-component ion-button').contains('Clear').click();
    cy.get('app-terminal-component ion-textarea textarea').should(
      'contain',
      ''
    );
  });

  it('should open and close the advanced modal', () => {
    cy.get('app-terminal-component ion-button [name="settings-outline"]')
      .parent()
      .click();
    cy.get('ion-modal ion-toolbar ion-title').should(
      'contain',
      'Advanced Terminal Settings'
    );
    cy.get('ion-modal ion-toolbar ion-button').click();
    cy.get('ion-modal').should('not.be.visible');
  });

  it('should clear the terminal after changing encoding', () => {
    cy.window().then((win) => {
      for (let index = 0; index < 10; index++) {
        win.onSerialPortEventTrigger({
          type: 'data',
          data: mockData,
        });
      }
    });

    cy.get('app-terminal-component ion-button [name="settings-outline"')
      .parent()
      .click();
    cy.getAdvancedModalSelectElement(
      'terminal-advanced-modal',
      'Encoding'
    ).selectDropdownOption('Hex');

    cy.get('app-terminal-component ion-textarea textarea').should(
      'contain',
      ''
    );
  });

  it('should clear the terminal after changing show timestamps', () => {
    cy.window().then((win) => {
      for (let index = 0; index < 10; index++) {
        win.onSerialPortEventTrigger({
          type: 'data',
          data: mockData,
        });
      }
    });

    cy.get('app-terminal-component ion-button [name="settings-outline"')
      .parent()
      .click();
    cy.getAdvancedModalCheckboxElement(
      'terminal-advanced-modal',
      'Show Timestamps'
    ).click();

    cy.get('app-terminal-component ion-textarea textarea').should(
      'contain',
      ''
    );
  });

  it('should not auto scroll when auto scroll is disabled and data is emitted', () => {
    let initialScrollTop = 0;

    cy.get('app-terminal-component ion-button [name="settings-outline"')
      .parent()
      .click();
    cy.getAdvancedModalCheckboxElement(
      'terminal-advanced-modal',
      'Auto Scroll'
    ).click();
    cy.get('ion-modal ion-toolbar ion-button').click();

    cy.get('textarea').then((textarea) => {
      initialScrollTop = textarea[0].scrollTop;
    });

    cy.window().then((win) => {
      for (let index = 0; index < 10; index++) {
        win.onSerialPortEventTrigger({
          type: 'data',
          data: mockData,
        });
      }
    });

    cy.get('app-terminal-component ion-textarea textarea').then((textarea) => {
      const currentScrollTop = textarea[0].scrollTop;
      expect(currentScrollTop).to.equal(initialScrollTop);
    });
  });

  // TODO: PAUSE/CONTINUE
});
