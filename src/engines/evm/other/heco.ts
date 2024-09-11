import { Token } from "@wallet/core";
import get  from "lodash/get";
import { IHistoryObject, IHistoryResponse } from "../../../types";

export const getHecoHistory = async (address: string, limit: number, page: number, token: Token): Promise<IHistoryResponse> => {
    try {
        if(token?.address){
            const txs = await fetch(`https://api.hecoscan.io/api/token_trc20/transfers?limit=${limit}&start=${page -1 }&sort=-timestamp&count=true&relatedAddress=0x184a14eac74c0464f6f5e325d7c8a2eeb7e97973`)

            const {token_transfers} = await txs.json()
    
            const history = token_transfers.filter((tx: any) => tx?.tokenInfo.tokenId === token.address).map((tx: any): IHistoryObject => {
                let type 
    
                const from = get(tx, 'from_address', '')
                const to = get(tx, 'to_address', '')
    
                if(from  === to){
                    type = 'self'
                }else if( from === address){
                    type = 'send'
                }else{
                    type ='receive'
                }
                return {
                    hash: get(tx, 'transaction_id', ''),
                    type,
                    from,
                    to,
                    amount:  get(tx, 'amount_str', ''),
                    isRawAmount: true,
                    timestamp: get(tx, 'block_ts', '')
                }
            })
    
            return {result: history}
        }

        const txs = await fetch(`https://api.hecoscan.io/api/transfer?sort=-timestamp&count=true&limit=${limit}&start=${page - 1}&address=${address}`)

        const {data} = await txs.json()

        const history = data.map((tx: any): IHistoryObject => {
            let type 

            const from = get(tx, 'transferFromAddress', '')
            const to = get(tx, 'transferToAddress', '')

            if(from  === to){
                type = 'self'
            }else if( from === address){
                type = 'send'
            }else{
                type ='receive'
            }
            return {
                hash: get(tx, 'transactionHash', ''),
                type,
                from,
                to,
                amount:  get(tx, 'amount', ''),
                isRawAmount: true,
                timestamp: get(tx, 'timestamp', '')
            }
        })
        console.log("🚀 ~ history ~ history:", history)

        return {result: history}
    } catch (error) {
        return {result: []}   
    }
}