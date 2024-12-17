import {
  cleanBuffer,
  parseSerialMessages,
  setCurrentTimestamp,
} from './plotter.worker';

describe('Plotter web worker', () => {
  const fixedTimestamp = 1734411049296;

  beforeEach(() => {
    setCurrentTimestamp(fixedTimestamp);
  });

  afterEach(() => {
    cleanBuffer();
  });

  describe.each([
    ['space', ' '],
    ['tab', '\t'],
    ['comma', ','],
  ])('%s variable delimiter', (_, delimiter) => {
    describe.each([
      ['trailing', delimiter],
      ['no trailing', ''],
    ])('%s', (_, trailingDelimiter) => {
      describe.each([
        ['LF', '\n'],
        ['CRLF', '\r\n'],
      ])('%s record delimiter', (_, terminator) => {
        it('should parse single variable', () => {
          const messages = [
            `1${trailingDelimiter}${terminator}`,
            `2${trailingDelimiter}${terminator}`,
          ];

          const assertion = {
            series: [
              {
                name: 'Variable 1',
                data: [
                  { x: fixedTimestamp, y: 1 },
                  { x: fixedTimestamp, y: 2 },
                ],
              },
            ],
          };

          const parsedMessage = parseSerialMessages(messages);
          expect(parsedMessage).toEqual(assertion);
        });

        it('should handle multiple variables correctly', () => {
          if (delimiter !== ' ') {
            return;
          }
          const messages = [
            `1${delimiter}2${trailingDelimiter}${terminator}`,
            `3${delimiter}4${trailingDelimiter}${terminator}`,
          ];

          const assertion = {
            series: [
              {
                name: 'Variable 1',
                data: [
                  { x: fixedTimestamp, y: 1 },
                  { x: fixedTimestamp, y: 3 },
                ],
              },
              {
                name: 'Variable 2',
                data: [
                  { x: fixedTimestamp, y: 2 },
                  { x: fixedTimestamp, y: 4 },
                ],
              },
            ],
          };

          const parsedMessage = parseSerialMessages(messages);
          expect(parsedMessage).toEqual(assertion);
        });

        it('should handle labeled variables correctly', () => {
          const messages = [
            `temperature_1:1${delimiter}temperature_2:2${trailingDelimiter}${terminator}`,
            `temperature_1:3${delimiter}temperature_2:4${trailingDelimiter}${terminator}`,
          ];

          const assertion = {
            series: [
              {
                name: 'temperature_1',
                data: [
                  { x: fixedTimestamp, y: 1 },
                  { x: fixedTimestamp, y: 3 },
                ],
              },
              {
                name: 'temperature_2',
                data: [
                  { x: fixedTimestamp, y: 2 },
                  { x: fixedTimestamp, y: 4 },
                ],
              },
            ],
          };

          const parsedMessage = parseSerialMessages(messages);
          expect(parsedMessage).toEqual(assertion);
        });

        it('should handle incomplete message buffering', () => {
          const messages1 = [`1${delimiter}`];
          const assertion1 = {
            series: [],
          };
          const parsedMessage1 = parseSerialMessages(messages1);
          expect(parsedMessage1).toEqual(assertion1);

          const messages2 = [`2${trailingDelimiter}${terminator}`];
          const assertion2 = {
            series: [
              {
                name: 'Variable 1',
                data: [{ x: fixedTimestamp, y: 1 }],
              },
              {
                name: 'Variable 2',
                data: [{ x: fixedTimestamp, y: 2 }],
              },
            ],
          };
          const parsedMessage2 = parseSerialMessages(messages2);
          expect(parsedMessage2).toEqual(assertion2);
        });

        it('should return empty series if no valid data', () => {
          const messages = ['invalid_data'];

          const assertion = {
            series: [],
          };

          const parsedMessage = parseSerialMessages(messages);
          expect(parsedMessage).toEqual(assertion);
        });
      });
    });
  });
});
