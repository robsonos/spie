import { type Delimiter, type Encoding } from '@spie/types';

export const SCROLLBACK_LENGTH_VALUES = [
  10000, 20000, 30000, 40000, 50000,
] as const;
export type ScrollbackLength = (typeof SCROLLBACK_LENGTH_VALUES)[number];
export interface TerminalOptions {
  encoding: Encoding;
  isAutoScrollEnabled: boolean;
  showTimestampsEnabled: boolean;
  scrollbackLength: ScrollbackLength;
  useReadlineParser: boolean;
}

export interface SendOptions {
  delimiter: Delimiter;
  encoding: Encoding;
  isSendInputValid: boolean;
}
