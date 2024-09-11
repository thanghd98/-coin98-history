import { ChainQueryParams, ChainType } from '../../types/Chain';

import { AddressParse } from '../../types/Address';
import { HistoryEvent } from '../../types/History';
import { Api, HttpClient } from 'tonapi-sdk-js';
import HistoryServicesAbstract, {
  InfinitePaginationResponse,
} from '../../HistoryServicesAbstract';
import convertToParsedAddress from './utils/convertToParsedAddress';
import { formatEventTonData } from './utils/formatData';

const DEFAULT_LIMIT = 25;
type AccountEventsResponse = {
  history: HistoryEvent[];
  nextFrom?: number;
};

type AccountEventsParams = {
  nextFrom?: number;
  tonOnly?: true;
} & Pick<ChainQueryParams, 'limit'>;

export class TON extends HistoryServicesAbstract {
  nextFrom: number | undefined = undefined;
  client: Api<unknown> | undefined;
  currentAddress: AddressParse | null = null;
  currentLimit: number = DEFAULT_LIMIT;
  currentJettonAddress: AddressParse | null = null;

  constructor(chainType: ChainType) {
    super(chainType);
    this.chainType = chainType;
    const httpClient = new HttpClient({
      baseUrl: 'https://tonapi.io',
      baseApiParams: {
        headers: {
          Authorization: `Bearer AFPJTKEBPOX3AIYAAAAKA2HWOTRNJP5MUCV5DMDCZAAOCPSAYEYS3CILNQVLF2HWKED6USY`,
          'Content-type': 'application/json',
        },
      },
    });
    this.client = new Api(httpClient);
    this.isSupportInfinitePagination = true;
  }

  async getHistory(
    address: string,
    params?: ChainQueryParams
  ): Promise<HistoryEvent[]> {
    console.log("🚀 ~ TON ~ params:", params)
    this.history = [];
    this.currentJettonAddress = null;

    if (params?.jettonID) {
      this.currentJettonAddress = convertToParsedAddress(params.jettonID);
    }

    if (params?.limit) {
      this.currentLimit = params.limit;
    }

    const addressData = convertToParsedAddress(address);
    this.currentAddress = addressData;

    if (this.currentJettonAddress) {
      const { history, nextFrom } = await this.getJettonAccountEvents(
        addressData,
        this.currentJettonAddress,
        {
          limit: this.currentLimit,
        }
      );
      console.log("🚀 ~ TON ~ history:", history)

      this.history = history;
      this.nextFrom = nextFrom;

      return this.history;
    }

    const { history, nextFrom } = await this.getAccountEvents(addressData, {
      limit: this.currentLimit,
      tonOnly: true,
    });
    console.log("🚀 ~ TON ~ history:", history)

    this.history = history;
    this.nextFrom = nextFrom;

    return this.history;
  }

  async getInfinitePagination(): Promise<
    InfinitePaginationResponse<HistoryEvent>
  > {
    if (!this.currentAddress || !this.currentLimit || !this.nextFrom) {
      return { data: [] };
    }

    let newHistories: HistoryEvent[] = [];

    if (this.currentJettonAddress) {
      const { history, nextFrom } = await this.getJettonAccountEvents(
        this.currentAddress,
        this.currentJettonAddress,
        { nextFrom: this.nextFrom, limit: this.currentLimit }
      );
      newHistories = history;

      this.history = this.history.concat(newHistories);
      this.nextFrom = nextFrom;

      if (newHistories.length !== 0) {
        return {
          next: this.getInfinitePagination.bind(this),
          data: newHistories,
        };
      }

      return {
        data: newHistories,
      };
    }

    const { history, nextFrom } = await this.getAccountEvents(
      this.currentAddress,
      { nextFrom: this.nextFrom, limit: this.currentLimit, tonOnly: true }
    );

    newHistories = history;
    this.nextFrom = nextFrom;

    this.history = this.history.concat(newHistories);
    this.nextFrom = nextFrom;

    if (newHistories.length !== 0) {
      return {
        data: newHistories,
        next: this.getInfinitePagination.bind(this),
      };
    }

    return {
      data: newHistories,
    };
  }

  async getLegacyPagination(page: number, limit: number) {
    return {
      page,
      data: [],
      limit,
      total: 0,
    };
  }

  private async getJettonAccountEvents(
    addressData: AddressParse,
    currentJettonID: AddressParse,
    params?: AccountEventsParams
  ): Promise<AccountEventsResponse> {
    const jettonAccountEvents = await this.client?.accounts.getAccountJettonHistoryById(
      addressData.raw_form,
      currentJettonID.raw_form,
      {
        limit: params?.limit || DEFAULT_LIMIT,
        before_lt: params?.nextFrom,
      }
    );
    console.log("🚀 ~ TON ~ jettonAccountEvents:", jettonAccountEvents)

    if (jettonAccountEvents?.events) {
      return {
        nextFrom: jettonAccountEvents.next_from,
        history: formatEventTonData(jettonAccountEvents.events, addressData),
      };
    }

    return {
      history: [],
    };
  }

  private async getAccountEvents(
    addressData: AddressParse,
    params?: AccountEventsParams
  ): Promise<AccountEventsResponse> {
    const limitData = params?.limit || DEFAULT_LIMIT;
    const accountEvents = await this.client?.accounts.getAccountEvents(
      addressData.raw_form,
      {
        limit: limitData,
        before_lt: params?.nextFrom,
      }
    );

    if (accountEvents) {
      return {
        nextFrom: accountEvents.next_from,
        history: formatEventTonData(accountEvents.events, addressData, {
          tonOnly: params?.tonOnly,
        }),
      };
    }

    return {
      history: [],
    };
  }
}

export default TON;
