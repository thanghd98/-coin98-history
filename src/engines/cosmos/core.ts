import { CHAIN_DATA, CHAIN_TYPE } from '@wallet/constants';
import { concat, first, uniqBy } from 'lodash';
import get from 'lodash/get';
import { History } from '../../HistoryAbstract';
import { IHistoryObject, IHistoryParams, IHistoryResponse } from '../../types';
import { ChainRest } from './constants';
import axios from 'axios';
import { MSG_TYPE, TYPE } from '../../constants';
import { historyFactory } from './others';

const OTHER_SERVICE_CHAINS = [CHAIN_TYPE.injective] as string[];

export class CosmosHistory extends History {
  async getHistory<T extends IHistoryParams>(
    params: T
  ): Promise<IHistoryResponse> {
    const { address, pagination, chain } = params;

    const pageNumber = pagination?.page || 1;
    const pageSize = pagination?.limit || 20;

    try {
      if (OTHER_SERVICE_CHAINS.includes(chain)) {
        const history = await historyFactory[chain](
          address,
          pageNumber,
          pageSize
        );

        return { result: history };
      }
      const endpoint = ChainRest[chain];

      const receiveApi = `${endpoint}/cosmos/tx/v1beta1/txs?events=coin_received.receiver=%27${address}%27&pagination.offset=${(pageNumber -
        1) *
        pageSize}&pagination.limit=${pageSize}`;
      const sendApi = `${endpoint}/cosmos/tx/v1beta1/txs?events=message.sender=%27${address}%27&pagination.offset=${(pageNumber -
        1) *
        pageSize}&pagination.limit=${pageSize}`;

      let finalData = [];

      try {
        const [resReceive, resSend] = await Promise.all([
          axios.get(receiveApi),
          axios.get(sendApi),
        ]);

        const arrReceive = resReceive.data.tx_responses || [];
        const arrSend = resSend.data.tx_responses || [];

        finalData = uniqBy(concat(arrReceive, arrSend), it =>
          JSON.stringify(it)
        );
      } catch (e) {
        return { result: [] };
      }

      const result: IHistoryObject[] = finalData.map(it => {
        const tx = first(it.tx.body.messages) as any;
        const feeAmount = +get(it, 'tx.auth_info.fee.amount[0].amount', 0);
        const gasWanted = get(it, 'gas_wanted', '0');
        const gasUsed = get(it, 'gas_used');
        let fromAddress: string =
          tx?.from_address || get(it, 'tx.body.messages[0].sender');
        let toAddress: string =
          tx?.to_address || get(it, 'tx.body.messages[0].contract');
        const input = get(it, 'data');
        let nonce = get(it, 'tx.auth_info.signer_infos[0].sequence');
        let amount = first(tx.amount as any[])?.amount as string;
        const msgType: string = get(tx, '@type');
        const gasPrice = feeAmount / (gasWanted || 1);

        // const txType = ? TYPE.send : TYPE.executeContract
        let txType = TYPE.executeContract;
        if (!toAddress && chain === CHAIN_TYPE.functionX) {
          const logs = get(it, 'logs');
          const transferLog = logs[0]?.events?.find(
            (log: any) => log.type === 'transfer'
          );
          const sender = transferLog?.attributes?.find(
            (att: any) => att.key === 'sender'
          ).value;
          const recipient = transferLog?.attributes?.find(
            (att: any) => att.key === 'recipient'
          ).value;
          toAddress = recipient;
          fromAddress = sender;
          nonce = get(tx, 'data.nonce');
          amount = get(tx, 'data.value');
          if (amount) txType = 'send';
        }

        if (get(MSG_TYPE, msgType) === TYPE.send) {
          if (toAddress === fromAddress) {
            txType = 'self';
          } else if (fromAddress === address) {
            txType = 'send';
          } else {
            txType = 'receive';
          }
        }

        // Format type
        return {
          type: txType as string,
          hash: it.txhash as string,
          from: fromAddress,
          to: toAddress,
          amount,
          isRawAmount: true,
          gas: gasWanted,
          gasUsed,
          gasFee: feeAmount,
          gasPrice,
          nonce,
          blockNumber: get(it, 'height'),
          input,
          timestamp: it.timestamp as string,
          status: 'success',
          rawDataItem: it,
        };
      });

      return { result: result?.sort((a, b) => Number(b?.blockNumber) - Number(a?.blockNumber))};
    } catch (error) {
      return { result: [] };
    }
  }

  hasChain(chain: string): boolean {
    if (chain === CHAIN_TYPE.thor) return false;
    const chainData = CHAIN_DATA[chain];
    return chainData.isCosmos as boolean;
  }
}
