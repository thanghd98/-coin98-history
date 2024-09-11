import { ChainQueryParams, ChainType } from './types/Chain';
import { HistoryEvent } from './types/History';

export type LegacyPaginationResponse<T> = {
  page: number;
  data: T[];
  limit: number;
  total: number;
};
export type InfinitePaginationResponse<T> = {
  data: T[];
  next?: IHistoryServicesAbstract['getInfinitePagination'];
};

export interface IHistoryServicesAbstract extends HistoryServicesAbstract {}

export default abstract class HistoryServicesAbstract {
  history: HistoryEvent[] = [];
  chainType: ChainType;
  isSupportLegacyPagination?: boolean = false;
  isSupportInfinitePagination?: boolean = false;

  constructor(chainType: ChainType) {
    this.chainType = chainType;
  }

  abstract getHistory(
    address: string,
    params?: ChainQueryParams
  ): Promise<HistoryEvent[]>;

  abstract getLegacyPagination(
    page: number,
    limit: number
  ): Promise<LegacyPaginationResponse<HistoryEvent>>;

  abstract getInfinitePagination(): Promise<
    InfinitePaginationResponse<HistoryEvent>
  >;
}
