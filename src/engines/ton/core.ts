import { CHAIN_TYPE } from '@wallet/constants';
import {History} from '../../HistoryAbstract'
import { IHistoryParams, IHistoryResponse } from '../../types';
import HistoryService from './services/history-services/src/HistoryServices'
import { returnParsedAddress } from './utils';

export class TonHistory extends History{
    constructor(){
        console.log('Ton init')
        super()
    }

    async getHistory<T extends IHistoryParams<T>>(params: T): Promise<IHistoryResponse>{
        const { address, pagination, token } = params
        try {
        const limit = pagination?.limit || 25
        const account = returnParsedAddress(address)
        const tonHistory = new HistoryService(["ton"]).getCurrentChain("ton")
    
        if (!account?.raw_form || !tonHistory) {
            return {result: []};
        }

        let jettonID = undefined

        if(token?.address){
            jettonID = returnParsedAddress(token?.address).raw_form
        }
        
        let history = await tonHistory.getHistory(account.raw_form, {
            limit,
            jettonID,
        });

        if (tonHistory.isSupportInfinitePagination) {
            await tonHistory.getInfinitePagination();
            history = tonHistory.history ;
        }
    
        const historyFormat = history.map((item: any) => {
            const accountFrom = returnParsedAddress(item.from)
            const accountTo = returnParsedAddress(item.to)
    
            return {
            ...item,
            from : accountFrom.bounceable.b64,
            to : accountTo.bounceable.b64
            }
        })
    
        return { result: historyFormat }
        } catch (error) {
            return { result: [] }
        }
    }

    hasChain(chain: string): boolean {
       return chain === CHAIN_TYPE.ton
    }

}