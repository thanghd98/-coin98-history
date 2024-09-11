import { QueryParamsType } from 'tonapi-sdk-js';
import CHAINMAP from './chains';
import { IHistoryServicesAbstract } from './HistoryServicesAbstract';
import { ChainType } from './types/Chain';

export default class HistoryService {
  static historyInstance: HistoryService | undefined = undefined;
  static factories = new Map<
    ChainType,
    IHistoryServicesAbstract
  >();

  constructor(chainlist: ChainType[]) {
    if(HistoryService.historyInstance){
      return HistoryService.historyInstance;
    }

    chainlist.forEach(chain => {
      //@ts-ignore
      const chainInstance = CHAINMAP[chain ] as unknown as any;

      if (chainInstance) {
        const instance = new chainInstance(chain);
        HistoryService.factories.set(chain, instance);
      }
    });

    HistoryService.historyInstance = this;
  }

  getHistory(chainType: ChainType, address: string, params?: QueryParamsType) {
    const factory = HistoryService.factories.get(chainType);

    if (!factory) return [];

    return factory.getHistory(address, params);
  }

  getLegacyPagination(chainType: ChainType, page: number, limit: number) {
    return HistoryService.factories
      .get(chainType)
      ?.getLegacyPagination(page, limit);
  }

  getInfinitePagination(chainType: ChainType) {
    return HistoryService.factories.get(chainType)?.getInfinitePagination();
  }

  getCurrentChain(chainType: ChainType) {
    return HistoryService.factories.get(chainType);
  }

  static register(
    chainType: ChainType,
    chainInstance: IHistoryServicesAbstract
  ) {
    HistoryService.factories.set(chainType, chainInstance);

    return HistoryService.factories.get(chainType);
  }
}
