import {
  mockElectronAPI,
  mockSerialPortList,
} from '../fixtures/mocks/electron-api.mock';
import plotOneVariable from '../fixtures/plotOneVariable.json';
import plotThreeVariables from '../fixtures/plotThreeVariables.json';

describe('Plotter routine', () => {
  before(() => {
    cy.fixture('plotOneVariable').then((data) => {
      expect(plotOneVariable).to.deep.equal(data);
    });
    cy.fixture('plotThreeVariables').then((data) => {
      expect(plotThreeVariables).to.deep.equal(data);
    });
  });

  beforeEach(() => {
    cy.visit('/');

    cy.on('window:before:load', (win) => {
      win.electron = mockElectronAPI(win);
    });

    // Ensure onSerialPortEventTrigger is loaded
    cy.window().should((win) => {
      expect(win.onSerialPortEventTrigger).to.be.a('function');
    });

    // Navigate to plotter tab
    cy.get('ion-tab-button').contains('Plotter').parent().click();
    cy.get('app-plotter-component').should('not.have.class', 'ion-page-hidden');

    // Mock connection
    cy.connect(mockSerialPortList[0].path, 9600);
    cy.get('ion-tabs ion-accordion').contains('Connection').parent().click();
  });

  it('should render the chart', () => {
    cy.get('apx-chart').should('exist');
    cy.get('.apexcharts-canvas').should('be.visible');
  });

  it.only('should use sample count by default', () => {
    cy.get('.apexcharts-xaxis-title-text').should(
      'contain.text',
      'Sample count'
    );
  });

  it('should render series', () => {
    const numberOfPoints = 2;
    const mockEventData = plotOneVariable.eventData.slice(0, numberOfPoints);
    const numberOfSeries = plotOneVariable.numberOfSeries;

    cy.window()
      .then((win) => {
        return new Promise<void>((resolve) => {
          // Mock data event with numberOfPoints point 50ms apart
          mockEventData.forEach((data, index) => {
            win.onSerialPortEventTrigger({
              type: 'data-delimited',
              data: data,
            });

            if (index === mockEventData.length - 1) {
              resolve();
            }
          });
        });
      })
      .then(() => {
        cy.get('apx-chart svg path.apexcharts-line').should(
          'have.length',
          numberOfSeries
        );
      });
  });

  it('should render tooltips', () => {
    const numberOfPoints = 2;
    const mockEventData = plotOneVariable.eventData.slice(0, numberOfPoints);

    cy.window()
      .then((win) => {
        return new Promise<void>((resolve) => {
          // Mock data event with numberOfPoints point 50ms apart
          mockEventData.forEach((data, index) => {
            win.onSerialPortEventTrigger({
              type: 'data-delimited',
              data: data,
            });

            if (index === mockEventData.length - 1) {
              resolve();
            }
          });
        });
      })
      .then(() => {
        // Pause data stream (to enable tooltips)
        cy.get('app-plotter-component ion-button').contains('Pause').click();

        // Trigger tooltip
        cy.get('.apexcharts-canvas').trigger('mousemove', {
          clientX: 100,
          clientY: 150,
        });

        // Ensure the tooltip is visible and active
        cy.get('.apexcharts-tooltip').and('have.class', 'apexcharts-active');
      });
  });

  it('should render labels and values for multiple variables', () => {
    const numberOfPoints = 2;
    const mockEventData = plotThreeVariables.eventData.slice(0, numberOfPoints);
    const mockSeries = plotThreeVariables.series.slice(0, numberOfPoints);

    cy.window()
      .then((win) => {
        return new Promise<void>((resolve) => {
          // Mock data event with numberOfPoints point 50ms apart
          mockEventData.forEach((data, index) => {
            win.onSerialPortEventTrigger({
              type: 'data-delimited',
              data: data,
            });

            if (index === mockEventData.length - 1) {
              resolve();
            }
          });
        });
      })
      .then(() => {
        // Pause data stream (to enable tooltips)
        cy.get('app-plotter-component ion-button').contains('Pause').click();

        // Test labels and values
        mockSeries.forEach((points, pointsIndex) => {
          // Move mouse to estimated tooltip position
          cy.get('.apexcharts-canvas').trigger('mousemove', {
            clientX: 100 + (pointsIndex * 1000) / numberOfPoints,
            clientY: 150,
          });

          points.forEach((point, pointIndex) => {
            // Ensure the label are correct
            cy.get('.apexcharts-tooltip-text-y-label').should(
              'contain',
              `Variable ${pointIndex + 1}`
            );

            // Ensure the values are correct
            cy.get('.apexcharts-tooltip-text-y-value').should('contain', point);
          });
        });
      });
  });

  it('should render multiple variables and large series', () => {
    const mockEventData = plotThreeVariables.eventData;
    const mockSeries = plotThreeVariables.series;

    cy.window()
      .then((win) => {
        return new Promise<void>((resolve) => {
          // Mock data event with numberOfPoints point 50ms apart
          mockEventData.forEach((data, index) => {
            win.onSerialPortEventTrigger({
              type: 'data-delimited',
              data: data,
            });

            if (index === mockEventData.length - 1) {
              resolve();
            }
          });
        });
      })
      .then(() => {
        // Pause data stream (to enable tooltips)
        cy.get('app-plotter-component ion-button').contains('Pause').click();

        // INFO: hacky way to wait until the canvas has finished updating from stream pause
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.get('.apexcharts-canvas')
          .invoke('width')
          .should('be.below', 940)
          .wait(500);

        cy.get('g.apexcharts-series path.apexcharts-line')
          .invoke('attr', 'd')
          .then((dAttribute) => {
            // Get coordinates from the first line element
            const coordinates: { x: any; y: any }[] = [];
            const commands = (dAttribute as string).match(
              /[ML]\s*[-\d.]+\s*[-\d.]+/g
            );

            if (commands) {
              commands.forEach((command) => {
                const [x, y] = command.slice(1).trim().split(/\s+/).map(Number);
                coordinates.push({ x, y });
              });
            }
            return coordinates;
          })
          .then((coordinates) => {
            // Get the chart offset coordinates bases on the first vertical line
            return cy.get('.apexcharts-xaxis-tick').then(($ticks) => {
              const firstElement = $ticks[0];
              const firstX = firstElement.getBoundingClientRect().x;
              const firstY = firstElement.getBoundingClientRect().x;

              return coordinates.map((point) => ({
                x: point.x + firstX,
                y: point.y + firstY + 15,
              }));
            });
          })
          .then((coordinates) => {
            // Test labels and values
            mockSeries.forEach((points, pointsIndex) => {
              // // Helper for debug
              // cy.get('body').then(($body) => {
              //   const refCircle = document.createElement('div');
              //   refCircle.style.position = 'absolute';
              //   refCircle.style.left = `${coordinates[pointsIndex].x}px`;
              //   refCircle.style.top = `${coordinates[pointsIndex].y}px`;
              //   refCircle.style.width = '2px';
              //   refCircle.style.height = '2px';
              //   refCircle.style.borderRadius = '50%';
              //   refCircle.style.backgroundColor = 'red'; // Red for visibility
              //   refCircle.style.zIndex = '9999'; // High z-index to appear on top

              //   // Append the circle to the body to mark the inferred points
              //   $body[0].appendChild(refCircle);
              // });

              // Move mouse to estimated tooltip position
              cy.get('.apexcharts-canvas').trigger('mousemove', {
                clientX: coordinates[pointsIndex].x,
                clientY: coordinates[pointsIndex].y,
              });

              points.forEach((point, pointIndex) => {
                // Ensure the label is correct
                cy.get('.apexcharts-tooltip-text-y-label').should(
                  'contain',
                  `Variable ${pointIndex + 1}`
                );

                // Ensure the values are correct
                cy.get('.apexcharts-tooltip-text-y-value').should(
                  'contain',
                  point
                );
              });
            });
          });
      });
  });

  it('should open and close the advanced modal', () => {
    cy.get('app-plotter-component ion-button [name="icon-settings-outlined"]')
      .parent()
      .click();
    cy.get('ion-modal ion-toolbar ion-title').should(
      'contain',
      'Advanced Plotter Settings'
    );
    cy.get('ion-modal ion-toolbar ion-button').click();
    cy.get('ion-modal').should('not.be.visible');
  });

  it('should use timestamps if it is set', () => {
    cy.get('app-plotter-component ion-button [name="icon-settings-outlined"]')
      .parent()
      .click();
    cy.get('ion-modal ion-toolbar ion-title').should(
      'contain',
      'Advanced Plotter Settings'
    );

    cy.getAdvancedModalCheckboxElement(
      'plotter-advanced-modal',
      'Use sample counter'
    ).click();

    cy.get('ion-modal ion-toolbar ion-button').click();

    cy.get('.apexcharts-xaxis-title-text').should('contain.text', 'Time (ms)');
  });
});
