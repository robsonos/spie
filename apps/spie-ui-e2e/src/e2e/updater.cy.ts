import { type AutoUpdaterEvent } from '@spie/types';

import { mockElectronAPI } from '../fixtures/mocks/electron-api.mock';

describe('Send routine', () => {
  beforeEach(() => {
    cy.visit('/');

    cy.on('window:before:load', (win) => {
      win.electron = mockElectronAPI(win);
    });

    cy.window().should((win) => {
      expect(win.onSerialPortEventTrigger).to.be.a('function');
      expect(win.onAutoUpdaterEventTrigger).to.be.a('function');
    });
  });

  it('should handle error event ', () => {
    const mockEvent: AutoUpdaterEvent = {
      type: 'error',
      error: new Error('Test error'),
    };

    cy.window().then((win) => {
      win.onAutoUpdaterEventTrigger(mockEvent);
    });

    cy.get('ion-toast').should('have.attr', 'color', 'danger');

    cy.get('ion-toast')
      .shadow()
      .find('.toast-header')
      .should('contain', 'Error');

    cy.get('ion-toast')
      .shadow()
      .find('.toast-content')
      .should('contain', mockEvent.error);
  });

  it('should handle checking-for-update event ', () => {
    const mockEvent: AutoUpdaterEvent = { type: 'checking-for-update' };
    cy.window().then((win) => {
      win.onAutoUpdaterEventTrigger(mockEvent);
    });

    cy.get('ion-toast')
      .shadow()
      .find('.toast-header')
      .should('contain', 'Checking for Updates');
  });

  it('should handle update-not-available event', () => {
    const mockEvent: AutoUpdaterEvent = {
      type: 'update-not-available',
      updateInfo: {
        version: '1.0.0',
        files: [],
        path: '/test',
        sha512: 'test',
        releaseDate: new Date().toISOString(),
      },
    };
    cy.window().then((win) => {
      win.onAutoUpdaterEventTrigger(mockEvent);
    });

    cy.get('ion-toast')
      .shadow()
      .find('.toast-header')
      .should('contain', 'No Updates Available');
  });

  it('should handle update-available event', () => {
    const mockEvent: AutoUpdaterEvent = {
      type: 'update-available',
      updateInfo: {
        version: '1.0.0',
        files: [],
        path: '/test',
        sha512: 'test',
        releaseDate: new Date().toISOString(),
      },
    };
    cy.window().then((win) => {
      win.onAutoUpdaterEventTrigger(mockEvent);
    });

    cy.get('ion-alert')
      .find('.alert-head')
      .should('contain', 'Update Available for Download');
    cy.get('ion-alert')
      .find('.alert-message')
      .should(
        'contain',
        `Version ${mockEvent.updateInfo.version} is ready for download.`
      );
  });

  it('should handle download button click', () => {
    const mockEvent: AutoUpdaterEvent = {
      type: 'update-available',
      updateInfo: {
        version: '1.0.0',
        files: [],
        path: '/test',
        sha512: 'test',
        releaseDate: new Date().toISOString(),
      },
    };

    cy.window().then((win) => {
      win.onAutoUpdaterEventTrigger(mockEvent);
    });

    cy.get('ion-alert button').contains('Download').click();

    cy.window().then((win) => {
      cy.wrap(win.electron.downloadUpdate).should('have.been.calledOnce');
    });
  });

  it('should handle update-downloaded event', () => {
    const mockEvent: AutoUpdaterEvent = {
      type: 'update-downloaded',
      updateDownloadedEvent: {
        downloadedFile: '/test/test.exe',
        version: '1.0.0',
        files: [],
        path: '/test',
        sha512: 'test',
        releaseDate: new Date().toISOString(),
      },
    };

    cy.window().then((win) => {
      win.onAutoUpdaterEventTrigger(mockEvent);
    });

    cy.get('ion-alert')
      .find('.alert-head')
      .should('contain', 'Update Ready to Install');
    cy.get('ion-alert')
      .find('.alert-message')
      .should(
        'contain',
        `Version ${mockEvent.updateDownloadedEvent.version} is ready to install.`
      );
  });

  it('should handle install button click', () => {
    const mockEvent: AutoUpdaterEvent = {
      type: 'update-downloaded',
      updateDownloadedEvent: {
        downloadedFile: '/test/test.exe',
        version: '1.0.0',
        files: [],
        path: '/test',
        sha512: 'test',
        releaseDate: new Date().toISOString(),
      },
    };

    cy.window().then((win) => {
      win.onAutoUpdaterEventTrigger(mockEvent);
    });

    cy.get('ion-alert button').contains('Install').click();

    cy.window().then((win) => {
      cy.wrap(win.electron.installUpdate).should('have.been.calledOnce');
    });
  });

  it('should handle download-progress event', () => {
    const mockUpdateAvailableEvent: AutoUpdaterEvent = {
      type: 'update-available',
      updateInfo: {
        version: '1.0.0',
        files: [],
        path: '/test',
        sha512: 'test',
        releaseDate: new Date().toISOString(),
      },
    };
    const mockDownloadProgressEvent: AutoUpdaterEvent = {
      type: 'download-progress',
      progressInfo: {
        total: 100,
        delta: 1,
        transferred: 75.5,
        percent: 25,
        bytesPerSecond: 725,
      },
    };

    cy.window().then((win) => {
      win.onAutoUpdaterEventTrigger(mockUpdateAvailableEvent);
      win.onAutoUpdaterEventTrigger(mockDownloadProgressEvent);
    });

    cy.get('ion-alert button').contains('Download').click();

    cy.get('ion-modal ion-toolbar ion-title').should(
      'contain',
      'Download Progress'
    );
    cy.get('ion-modal ion-content ion-list')
      .contains('Total Size')
      .parent()
      .find('ion-note')
      .should('contain', `${mockDownloadProgressEvent.progressInfo.total}`);
    cy.get('ion-modal ion-content ion-list')
      .contains('Transferred')
      .parent()
      .find('ion-note')
      .should(
        'contain',
        `${mockDownloadProgressEvent.progressInfo.transferred}`
      );
    cy.get('ion-modal ion-content ion-list')
      .contains('Speed')
      .parent()
      .find('ion-note')
      .should(
        'contain',
        `${mockDownloadProgressEvent.progressInfo.bytesPerSecond}`
      );
    cy.get('ion-modal ion-content ion-list')
      .contains('Progress')
      .parent()
      .find('ion-note')
      .should('contain', `${mockDownloadProgressEvent.progressInfo.percent}`);
  });

  it('should handle update-cancelled event ', () => {
    const mockEvent: AutoUpdaterEvent = {
      type: 'update-cancelled',
      updateInfo: {
        version: '1.0.0',
        files: [],
        path: '/test',
        sha512: 'test',
        releaseDate: new Date().toISOString(),
      },
    };
    cy.window().then((win) => {
      win.onAutoUpdaterEventTrigger(mockEvent);
    });

    cy.get('ion-toast').should('have.attr', 'color', 'danger');
    cy.get('ion-toast')
      .shadow()
      .find('.toast-header')
      .should('contain', 'Error');
    cy.get('ion-toast')
      .shadow()
      .find('.toast-content')
      .should('contain', 'Update Cancelled');
  });
});
