import { Engines } from './constants'
import { HistoryBase } from './HistoryBase'
import { IHistoryParams, IHistoryResponse } from './types'

export class HistoryServices {
    baseWallet: HistoryBase | undefined 
    static instance: HistoryServices
    
    constructor(){
        if(HistoryServices.instance){
            return HistoryServices.instance
        }

        this.baseWallet = new HistoryBase({engines: Engines})
        HistoryServices.instance = this;

        return this
    }


    async getHistory(params: IHistoryParams): Promise<IHistoryResponse>{

        if(this.baseWallet){
            return await this.baseWallet.getHistory(params)
        }

        return { result: [] }
    }
}