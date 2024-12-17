/// <reference lib="webworker" />

interface Series {
  name: string;
  data: { x: any; y: any }[];
}

export interface WorkerResult {
  series: Series[];
}

export interface WorkerMessage {
  message?: string[];
}

let useTestTimestamp = false;
let currentTimestamp: number = Date.now(); // Default to current time
let buffer = '';
const separator = '\r?\n'; // Line break separator regex, matches both \n and \r\n
const delimiter = '[, \t]+'; // Delimiters: comma, space, tab (in the original order)
const separatorRegex = new RegExp(`(${separator})`, 'g');
const delimiterRegex = new RegExp(delimiter, 'g');

// Handle incoming messages
addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { message } = event.data;
  if (message) {
    postMessage(parseSerialMessages(message));
  }
});

// Parse serial messages into structured data
export const parseSerialMessages = (messages: string[]): WorkerResult => {
  // Combine messages and append any leftover buffer
  const fullMessage = (buffer || '') + messages.join('');
  const messagesAndBuffer = fullMessage.split(separatorRegex).filter(Boolean);

  // Reset buffer for future incomplete messages
  buffer = '';

  // Check for incomplete message at the end and save it for the next chunk
  if (!separatorRegex.test(messagesAndBuffer[messagesAndBuffer.length - 1])) {
    buffer = messagesAndBuffer.pop()!;
  }

  const timestamp = useTestTimestamp ? currentTimestamp : Date.now();
  const datasetNames: Set<string> = new Set();
  const parsedLines: { [key: string]: { x: number; y: number }[] } = {};

  // Process each message to extract key-value pairs
  messagesAndBuffer.forEach((message) =>
    processMessage(message, timestamp, parsedLines, datasetNames)
  );

  // Convert parsed data into series
  const series: Series[] = Array.from(datasetNames).map((varName) => ({
    name: varName,
    data: parsedLines[varName] || [],
  }));

  return { series };
};

// Process a single message to extract tokens and add to parsed data
const processMessage = (
  message: string,
  timestamp: number,
  parsedLines: { [key: string]: { x: number; y: number }[] },
  datasetNames: Set<string>
) => {
  const tokens: string[] = parseTokens(message);

  // Add parsed tokens to the dataset
  for (let i = 0; i < tokens.length; i += 2) {
    const varName = tokens[i];
    const varValue = parseFloat(tokens[i + 1]);

    if (varName && !isNaN(varValue)) {
      datasetNames.add(varName);

      if (!parsedLines[varName]) {
        parsedLines[varName] = [];
      }

      parsedLines[varName].push({ x: timestamp, y: varValue });
    }
  }
};

// Parse a message into an array of tokens (handling both labelled and unlabelled formats)
const parseTokens = (message: string): string[] => {
  const tokens: string[] = [];

  // Split the message using delimiters
  const parts = message.split(delimiterRegex);

  if (message.includes(':')) {
    // Process key-value pair format (labelled)
    parts.forEach((keyValue) => {
      const [key, value] = keyValue.split(':').map((part) => part.trim());
      if (key && value) {
        tokens.push(key, value);
      }
    });
  } else {
    // Process unlabelled format
    parts.forEach((value, index) => {
      if (value) {
        tokens.push(`Variable ${index + 1}`, value);
      }
    });
  }

  return tokens;
};

// INFO: This is for unit testing only
export const setCurrentTimestamp = (timestamp: number) => {
  currentTimestamp = timestamp;
  useTestTimestamp = true;
};

// INFO: This is for unit testing only
export const cleanBuffer = () => {
  buffer = '';
};
