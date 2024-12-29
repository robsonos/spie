import MessageParser from './message-parser';
import { type Series } from '../interfaces/app.interface';

describe('PlotterComponent', () => {
  const fixedTimestamp = 1734411049296;

  describe('should parse serial messages', () => {
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
          describe.each([
            ['with counter', true],
            ['with timestamp', false],
          ])('%s', (_, useSampleCount) => {
            beforeEach(() => {
              MessageParser['sampleCounter'] = 0;
              MessageParser['useTestTimestamp'] = false;
              MessageParser['testTimestamp'] = 0;

              if (!useSampleCount) {
                MessageParser['testTimestamp'] = fixedTimestamp;
                MessageParser['useTestTimestamp'] = true;
              }
            });

            it('should parse single variable', () => {
              const messages = [
                `1${trailingDelimiter}${terminator}`,
                `2${trailingDelimiter}${terminator}`,
                `3${trailingDelimiter}${terminator}`,
              ];
              const assertion = [
                [
                  {
                    name: 'Variable 1',
                    data: [{ x: useSampleCount ? 1 : fixedTimestamp, y: 1 }],
                  },
                ],
                [
                  {
                    name: 'Variable 1',
                    data: [{ x: useSampleCount ? 2 : fixedTimestamp, y: 2 }],
                  },
                ],
                [
                  {
                    name: 'Variable 1',
                    data: [{ x: useSampleCount ? 3 : fixedTimestamp, y: 3 }],
                  },
                ],
              ];

              const parsedMessages = messages.map((message) => {
                return MessageParser.parse(message, useSampleCount);
              });
              expect(parsedMessages).toEqual(assertion);
            });

            it('should handle multiple variables correctly', () => {
              const messages = [
                `1${delimiter}2${trailingDelimiter}${terminator}`,
                `3${delimiter}4${trailingDelimiter}${terminator}`,
                `5${delimiter}6${trailingDelimiter}${terminator}`,
              ];
              const assertion = [
                [
                  {
                    name: 'Variable 1',
                    data: [{ x: useSampleCount ? 1 : fixedTimestamp, y: 1 }],
                  },
                  {
                    name: 'Variable 2',
                    data: [{ x: useSampleCount ? 1 : fixedTimestamp, y: 2 }],
                  },
                ],
                [
                  {
                    name: 'Variable 1',
                    data: [{ x: useSampleCount ? 2 : fixedTimestamp, y: 3 }],
                  },
                  {
                    name: 'Variable 2',
                    data: [{ x: useSampleCount ? 2 : fixedTimestamp, y: 4 }],
                  },
                ],
                [
                  {
                    name: 'Variable 1',
                    data: [{ x: useSampleCount ? 3 : fixedTimestamp, y: 5 }],
                  },
                  {
                    name: 'Variable 2',
                    data: [{ x: useSampleCount ? 3 : fixedTimestamp, y: 6 }],
                  },
                ],
              ];

              const parsedMessages = messages.map((message) => {
                return MessageParser.parse(message, useSampleCount);
              });
              expect(parsedMessages).toEqual(assertion);
            });

            it('should handle labeled variables correctly', () => {
              const messages = [
                `temperature_1:1${delimiter}temperature_2:2${trailingDelimiter}${terminator}`,
                `temperature_1:3${delimiter}temperature_2:4${trailingDelimiter}${terminator}`,
                `temperature_1:5${delimiter}temperature_2:6${trailingDelimiter}${terminator}`,
              ];
              const assertion = [
                [
                  {
                    name: 'temperature_1',
                    data: [{ x: useSampleCount ? 1 : fixedTimestamp, y: 1 }],
                  },
                  {
                    name: 'temperature_2',
                    data: [{ x: useSampleCount ? 1 : fixedTimestamp, y: 2 }],
                  },
                ],
                [
                  {
                    name: 'temperature_1',
                    data: [{ x: useSampleCount ? 2 : fixedTimestamp, y: 3 }],
                  },
                  {
                    name: 'temperature_2',
                    data: [{ x: useSampleCount ? 2 : fixedTimestamp, y: 4 }],
                  },
                ],
                [
                  {
                    name: 'temperature_1',
                    data: [{ x: useSampleCount ? 3 : fixedTimestamp, y: 5 }],
                  },
                  {
                    name: 'temperature_2',
                    data: [{ x: useSampleCount ? 3 : fixedTimestamp, y: 6 }],
                  },
                ],
              ];

              const parsedMessages = messages.map((message) => {
                return MessageParser.parse(message, useSampleCount);
              });
              expect(parsedMessages).toEqual(assertion);
            });

            it('should handle duplicates labeled variables correctly', () => {
              const messages = [
                `temperature_1:1${delimiter}temperature_1:2${trailingDelimiter}${terminator}`,
                `temperature_1:3${delimiter}temperature_1:4${trailingDelimiter}${terminator}`,
                `temperature_1:5${delimiter}temperature_1:6${trailingDelimiter}${terminator}`,
              ];
              const assertion = [
                [
                  {
                    name: 'temperature_1',
                    data: [
                      { x: useSampleCount ? 1 : fixedTimestamp, y: 1 },
                      { x: useSampleCount ? 1 : fixedTimestamp, y: 2 },
                    ],
                  },
                ],
                [
                  {
                    name: 'temperature_1',
                    data: [
                      { x: useSampleCount ? 2 : fixedTimestamp, y: 3 },
                      { x: useSampleCount ? 2 : fixedTimestamp, y: 4 },
                    ],
                  },
                ],
                [
                  {
                    name: 'temperature_1',
                    data: [
                      { x: useSampleCount ? 3 : fixedTimestamp, y: 5 },
                      { x: useSampleCount ? 3 : fixedTimestamp, y: 6 },
                    ],
                  },
                ],
              ];

              const parsedMessages = messages.map((message) => {
                return MessageParser.parse(message, useSampleCount);
              });
              expect(parsedMessages).toEqual(assertion);
            });

            it('should return empty series if no valid data', () => {
              const messages = 'invalid_data';
              const assertion: Series[] = [];

              const parsedMessage = MessageParser.parse(
                messages,
                useSampleCount
              );
              expect(parsedMessage).toEqual(assertion);
            });
          });
        });
      });
    });
  });
});
