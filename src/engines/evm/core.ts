import { decodeMessage } from '@wallet/abi-decoder';
import { History } from "../../HistoryAbstract";
import { IHistoryParams, IHistoryResponse } from "../../types";
import { CHAIN_DATA } from '@wallet/constants'
import { generateInputCode, getAccountTransactionHistory } from "./services";
 
// const otherChain = [CHAIN_TYPE.heco]
export class EvmHistory extends History{
    constructor(){
        super()
    }

    async getHistory(params: IHistoryParams<any>): Promise<IHistoryResponse> {
        const {address, chain} = params

        const decodeHash = (name: string, hex: string) => decodeMessage({ name }, hex)
        const historyTx = await getAccountTransactionHistory(params)
        const func = generateInputCode(decodeHash)
        const data = historyTx.map(item=>{
            return func(item,address,chain)
        })
        
        return {
            result: data
        }
    }

    hasChain(_chain: string): boolean {
        return Object.values(CHAIN_DATA).filter(chain=>chain.isWeb3).map(item=>item.chain).includes(_chain)
    }    
}