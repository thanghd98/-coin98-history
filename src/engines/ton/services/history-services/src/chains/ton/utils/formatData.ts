import { AddressParse } from '../../../types/Address';
import { HistoryEvent } from '../../../types/History';
import { AccountEvent } from 'tonapi-sdk-js';
import TonWeb from 'tonweb';
import formatAddress from './formatAddress';

const formatEventTonData = (
  accountEvents: AccountEvent[],
  currentAccount: Partial<AddressParse> | null,
  options?: {
    tonOnly?: boolean;
  }
): HistoryEvent[] => {
  return accountEvents
    .filter(accountEvent => {
      if (options?.tonOnly) {
        return accountEvent.actions.some(
          action => ['TonTransfer', 'JettonSwap', 'SmartContractExec'].includes(action.type)
        );
      }
      return true;
    })
    .map(accountEvent => {

      const { timestamp: timeStamp } = accountEvent;
      return accountEvent.actions.map(action => {

        if (action.type === 'SmartContractExec') {
          return {
            timeStamp,
            type: 'callContract' as HistoryEvent['type'],
            //@ts-ignore
            to: formatAddress(action[action.type]?.contract?.address),
            //@ts-ignore
            from: formatAddress(action[action.type]?.executor?.address),
            //@ts-ignore
            amount:  action[action.type]?.ton_attached
              ? TonWeb.utils.fromNano(
                //@ts-ignore
                  action[action.type]?.ton_attached?.toString() as string
                )
              : '0',
            hash: accountEvent.event_id,
          };
        }

        if (
          [
            'JettonSwap',
            'JettonTransfer',
            'TonTransfer',
            'NftItemTransfer',
            'InscriptionTransfer',
          ].includes(action.type)
        ) {
          let actionType: HistoryEvent['type'];

          //@ts-ignore
          let recipient = action[action.type]?.recipient?.address;
          //@ts-ignore
          let sender = action[action.type]?.sender?.address;
          
          
          if (action.type === 'JettonTransfer') {

            if (recipient === sender) {
              actionType = 'self';
            } else {
              if (currentAccount?.raw_form === recipient) {
                actionType = 'receive';
              } else {
                actionType = 'send';
              }
            }
          //@ts-ignore
            let amount = action[action.type]?.amount

            if(options?.tonOnly){
              const tonActions = accountEvent.actions.find(action => action.type === 'TonTransfer')
              if(tonActions){
                amount = tonActions!['TonTransfer']?.amount.toString()
                recipient = tonActions!['TonTransfer']?.recipient?.address
                sender = tonActions!['TonTransfer']?.sender?.address
              }
            }
            return {
              timeStamp: accountEvent.timestamp,
              type: actionType,
              isRawAmount: true,
              to: formatAddress(recipient, 'bounceable'),
              from: formatAddress(sender, 'bounceable'),
              amount,
              hash: accountEvent.event_id,
            };
          }

          if (action.type === 'JettonSwap') {

            actionType = 'swap'

            let amount

          //@ts-ignore

            if( action[action.type]?.ton_in && options?.tonOnly){
              amount =  action[action.type]?.ton_in?.toString() 
          //@ts-ignore

            }else if(action[action.type]?.ton_out && options?.tonOnly){
          //@ts-ignore

              amount = action[action.type]?.ton_out?.toString() 
            }else{
          //@ts-ignore

              amount =  action[action.type]?.amount_in || action[action.type]?.amount_out
            }
            
        
            return {
              timeStamp: accountEvent.timestamp,
              type: actionType,
              isRawAmount: true,
              to: formatAddress( currentAccount?.raw_form , 'bounceable'),
          //@ts-ignore

              from: formatAddress( action[action.type]?.jetton_master_out?.address ||  action[action.type]?.jetton_master_in?.address , 'bounceable'),
              amount: amount || '0',
              hash: accountEvent.event_id,
            };
          }

          if (recipient === sender) {
            actionType = 'self';
          } else {
            if (currentAccount?.raw_form === recipient) {
              actionType = 'receive';
            } else {
              actionType = 'send';
            }
          }

          if (options?.tonOnly && action.type !== 'TonTransfer') {
            return {
              timeStamp: accountEvent.timestamp,
              type: actionType,
              to: formatAddress(recipient),
              from: formatAddress(sender),
              amount: '0',
              hash: accountEvent.event_id,
            };
          }

          return {
            timeStamp: accountEvent.timestamp,
            type: actionType,
            to: formatAddress(recipient),
            from: formatAddress(sender),
          //@ts-ignore

            amount: action[action.type]?.amount
          //@ts-ignore

            ? TonWeb.utils.fromNano(action[action.type]?.amount.toString())
            : '0',
            hash: accountEvent.event_id,
          };
        }

        return {
          type: 'executingContract' as HistoryEvent['type'],
          from: formatAddress(currentAccount?.non_bounceable?.b64),
          amount: '0',
          timeStamp,
          hash: accountEvent.event_id,
        };
      });
    })
    .flat();
};

export { formatEventTonData };
