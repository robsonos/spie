import { type ElectronAPI } from '@spie/types';

export function mockElectronAPI(): ElectronAPI {
  return {
    platform: '',
    quit: cy.stub(),
    getVersion: cy.stub(),
    downloadUpdate: cy.stub(),
    installUpdate: cy.stub(),
    onUpdateEvent: cy.stub(),
    serialPort: {
      list: cy.stub(),
      open: cy.stub(),
      close: cy.stub(),
      isOpen: cy.stub().resolves(false),
      write: cy.stub().resolves(true),
      setReadEncoding: cy.stub(),
      onEvent: cy.stub(),
    },
  };
}
