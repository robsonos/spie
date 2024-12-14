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

  it('should render series', () => {
    const numberOfPoints = 2;
    const mockEventData = plotOneVariable.eventData.slice(0, numberOfPoints);
    const numberOfSeries = plotOneVariable.numberOfSeries;

    cy.window()
      .then((win) => {
        return new Promise<void>((resolve) => {
          // Mock data event with numberOfPoints point 50ms apart
          mockEventData.forEach((data, index) => {
            setTimeout(() => {
              win.onSerialPortEventTrigger({
                type: 'data',
                data: data,
              });

              if (index === mockEventData.length - 1) {
                resolve();
              }
            }, index * 50);
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
            setTimeout(() => {
              win.onSerialPortEventTrigger({
                type: 'data',
                data: data,
              });

              if (index === mockEventData.length - 1) {
                resolve();
              }
            }, index * 50);
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
            setTimeout(() => {
              win.onSerialPortEventTrigger({
                type: 'data',
                data: data,
              });

              if (index === mockEventData.length - 1) {
                resolve();
              }
            }, index * 50);
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
    const chartStartOffset = 89; // Estimated offset to the first tooltip
    const chartEndOffset = 9; // Estimated offset to the last tooltip

    cy.window()
      .then((win) => {
        return new Promise<void>((resolve) => {
          // Mock data event with numberOfPoints point 50ms apart
          mockEventData.forEach((data, index) => {
            setTimeout(() => {
              win.onSerialPortEventTrigger({
                type: 'data',
                data: data,
              });

              if (index === mockEventData.length - 1) {
                resolve();
              }
            }, index * 50);
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

        // Select the first path element and extract X coordinates
        cy.get('g.apexcharts-series path.apexcharts-line')
          .first()
          .then(($path) => {
            const pathData = $path.attr('d');

            const xCoordinates = (pathData as string)
              .split('L')
              .map((segment, index, array) => {
                const [x] = segment
                  .trim()
                  .replace('M', '')
                  .split(' ')
                  .map(Number);

                // If it's the last element in the array, adjust the X coordinate
                if (index === array.length - 1) {
                  return x + chartStartOffset - chartEndOffset;
                }

                // Otherwise, add the pageOffset to the X value
                return x + chartStartOffset;
              })
              .filter((x) => !isNaN(x)); // Filter out NaN values

            // Test labels and values
            mockSeries.forEach((points, pointsIndex) => {
              // // Helper for debug
              // cy.get('body').then(($body) => {
              //   const refCircle = document.createElement('div');
              //   refCircle.style.position = 'absolute';
              //   refCircle.style.left = `${xCoordinates[pointsIndex]}px`;
              //   refCircle.style.top = `${150}px`;
              //   refCircle.style.width = '5px';
              //   refCircle.style.height = '5px';
              //   refCircle.style.borderRadius = '50%';
              //   refCircle.style.backgroundColor = 'red'; // Red for visibility
              //   refCircle.style.zIndex = '9999'; // High z-index to appear on top

              //   // Append the circle to the body to mark the inferred points
              //   $body[0].appendChild(refCircle);
              // });

              // Move mouse to estimated tooltip position
              cy.get('.apexcharts-canvas').trigger('mousemove', {
                clientX: xCoordinates[pointsIndex],
                clientY: 150,
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
});
