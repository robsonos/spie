import {
  mockElectronAPI,
  mockSerialPortList,
} from '../fixtures/mocks/electron-api.mock';

describe('Monitor routine', () => {
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

  it('should display data on the monitor', () => {
    cy.window().then((win) => {
      win.onSerialPortEventTrigger({
        type: 'data',
        data: mockData,
      });
    });

    cy.get('app-monitor-component ion-textarea textarea').should(
      'contain',
      mockData
    );
  });

  it('should clear the monitor', () => {
    cy.window().then((win) => {
      win.onSerialPortEventTrigger({
        type: 'data',
        data: mockData,
      });
    });

    cy.get('app-monitor-component ion-button').contains('Clear').click();
    cy.get('app-monitor-component ion-textarea textarea').should('contain', '');
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

    cy.get('app-monitor-component ion-textarea textarea').then((textarea) => {
      const scrollTop = textarea[0].scrollTop;
      const scrollHeight = textarea[0].scrollHeight;
      const clientHeight = textarea[0].clientHeight;

      expect(scrollTop + clientHeight).to.equal(scrollHeight);
    });
  });

  it('should clear the monitor with clear event', () => {
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

    cy.get('app-monitor-component ion-textarea textarea').should('contain', '');
  });

  it('should open and close the advanced modal', () => {
    cy.get('app-monitor-component ion-button [name="icon-settings-outlined"]')
      .parent()
      .click();
    cy.get('ion-modal ion-toolbar ion-title').should(
      'contain',
      'Advanced Monitor Settings'
    );
    cy.get('ion-modal ion-toolbar ion-button').click();
    cy.get('ion-modal').should('not.be.visible');
  });

  it('should clear the monitor after changing encoding', () => {
    cy.window().then((win) => {
      for (let index = 0; index < 10; index++) {
        win.onSerialPortEventTrigger({
          type: 'data',
          data: mockData,
        });
      }
    });

    cy.get('app-monitor-component ion-button [name="icon-settings-outlined"')
      .parent()
      .click();
    cy.getAdvancedModalSelectElement(
      'monitor-advanced-modal',
      'Encoding'
    ).selectDropdownOption('Hex');

    cy.get('app-monitor-component ion-textarea textarea').should('contain', '');
  });

  it('should clear the monitor after changing show timestamps', () => {
    cy.window().then((win) => {
      for (let index = 0; index < 10; index++) {
        win.onSerialPortEventTrigger({
          type: 'data',
          data: mockData,
        });
      }
    });

    cy.get('app-monitor-component ion-button [name="icon-settings-outlined"')
      .parent()
      .click();
    cy.getAdvancedModalCheckboxElement(
      'monitor-advanced-modal',
      'Show Timestamps'
    ).click();

    cy.get('app-monitor-component ion-textarea textarea').should('contain', '');
  });

  it('should not auto scroll when auto scroll is disabled and data is emitted', () => {
    let initialScrollTop = 0;

    cy.get('app-monitor-component ion-button [name="icon-settings-outlined"')
      .parent()
      .click();
    cy.getAdvancedModalCheckboxElement(
      'monitor-advanced-modal',
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

    cy.get('app-monitor-component ion-textarea textarea').then((textarea) => {
      const currentScrollTop = textarea[0].scrollTop;
      expect(currentScrollTop).to.equal(initialScrollTop);
    });
  });

  // TODO: should handle pause and continue
  // TODO: should handle readline parser
  // TODO: should change ascii encoding when going to plotter tab
});
