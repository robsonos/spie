import { type Delimiter, type Encoding } from '@spie/types';

export interface TerminalOptions {
  encoding: Encoding;
  isAutoScrollEnabled: boolean;
  showTimestampsEnabled: boolean;
  scrollbackLength: number;
}

export interface SendOptions {
  delimiter: Delimiter;
  encoding: Encoding;
  isSendInputValid: boolean;
}
