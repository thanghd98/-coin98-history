import get from "lodash/get";
import { IHistoryObject } from "../../../types"

export const getInjHistory = async (address: string, skip: number, limit: number) =>{
    const history = await fetch(`https://k8s.mainnet.explorer.grpc-web.injective.network/api/explorer/v1/accountTxs/${address}?skip=${skip}&limit=${limit}`)

    const { data } = await history.json()

    const historyFormat = data.map((item: any): IHistoryObject => {
        let type, from, amount, to

        const message = get(item, 'messages').find((t: any) => t.type === '/cosmos.bank.v1beta1.MsgSend')

        const feeAmount = +get(item, 'gas_fee.amount[0].amount', 0)
        const gasWanted =  get(item, 'gas_wanted', '0')
        const gasUsed =  get(item, 'gas_used')
        const input = get(item, 'data')
        const nonce = get(item, 'signatures[0].sequence')
        const gasPrice = feeAmount / ( gasWanted || 1)

        if(message){
            from = get(message, 'value.from_address')
            to = get(message, 'value.to_address')

            if(to === from ){
                type = 'self'
            }else if( from === address){
                type = 'send'
            }else{
                type = 'receive'
            }

            amount =  get(message, 'value.amount[0].amount')
        }else{
            type = 'excuteContract'

            const logMessage = get(item, 'logs[0].events').find((e: any) => e.type === 'message')
            const logCoinSpent = get(item, 'logs[0].events').find((e: any) => e.type === 'coin_spent')

            from = logMessage?.attributes.find((attr: any) => attr.key === 'sender').value || ''

            to = logCoinSpent?.attributes.find((attr: any) => attr.key === 'spender').value || ''
            amount = logCoinSpent?.attributes.find((attr: any) => attr.key === 'amount').value || '0'

        }


        return {
            hash: get(item, 'hash', ''),
            from,
            to,
            type,
            amount,
            isRawAmount: true,
            timestamp: get(item, 'block_timestamp',''),
            data: {
                gas: gasWanted,
                gasUsed,
                gasFee: feeAmount,
                gasPrice,
                nonce,
                blockNumber: get(item, 'height'),
                rawDataItem: item,
                input,
            }
          };
    })

    return historyFormat
}