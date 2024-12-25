import { type Data, type Series } from '../interfaces/app.interface';

export default class MessageParser {
  private static sampleCounter = 0;
  private static useTestTimestamp = false;
  private static testTimestamp = 0;

  private static parseTokens(message: string): string[] {
    // Variable delimiters: comma, space, tab
    const delimiter = '[, \t]+';
    const delimiterRegex = new RegExp(delimiter, 'g');
    const tokens: string[] = [];

    message.split(delimiterRegex).forEach((part, index) => {
      if (!part) {
        return;
      }

      if (part.includes(':')) {
        const [key, value] = part.split(':').map((s) => s.trim());
        if (key && value) {
          tokens.push(key, value);
        }
      } else {
        tokens.push(`Variable ${index + 1}`, part);
      }
    });

    return tokens;
  }

  private static processMessage(
    message: string,
    datasetData: { [key: string]: Data[] },
    datasetNames: Set<string>,
    useSampleCount: boolean
  ): void {
    const tokens: string[] = MessageParser.parseTokens(message);

    let accounted = false;

    // Add parsed tokens to the dataset
    for (let i = 0; i < tokens.length; i += 2) {
      const label = tokens[i];
      const varValue = parseFloat(tokens[i + 1]);

      if (!label || isNaN(varValue)) {
        continue;
      }

      datasetNames.add(label);

      if (!datasetData[label]) {
        datasetData[label] = [];
      }

      if (!accounted) {
        accounted = true;
        MessageParser.sampleCounter++;
      }

      const timestamp = MessageParser.useTestTimestamp
        ? MessageParser.testTimestamp
        : Date.now();
      const xAxisData = useSampleCount
        ? MessageParser.sampleCounter
        : timestamp;

      datasetData[label].push({ x: xAxisData, y: varValue });
    }
  }

  static parse(message: string, useSampleCount: boolean): Series {
    const datasetNames: Set<string> = new Set();
    const datasetData: Record<string, Data[]> = {};

    MessageParser.processMessage(
      message,
      datasetData,
      datasetNames,
      useSampleCount
    );

    return Array.from(datasetNames).map((label) => ({
      name: label,
      data: datasetData[label] || [],
    }));
  }
}
