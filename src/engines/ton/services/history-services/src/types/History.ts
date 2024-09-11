export type HistoryEvent = {
  timeStamp: number;
  hash: string;
  isRawAmount?: boolean
  type: 'executingContract' | 'callContract' | 'receive' | 'self' | 'send' |'swap';
  from: string;
  to?: string;
  amount?: string;
};
