import { CHAIN_TYPE } from '@wallet/constants';

export type ChainType = keyof typeof CHAIN_TYPE;

export type ChainQueryParams = {
  limit?: number;
  jettonID?: string;
};
