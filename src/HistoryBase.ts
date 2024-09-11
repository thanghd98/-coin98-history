/* eslint-disable @typescript-eslint/no-explicit-any */

import { History } from "./HistoryAbstract";
import { IHistoryParams, IHistoryResponse } from "./types";
import { HistoryEngine } from "./types/engine";

export class  HistoryBase{
    engines: History[]

    constructor(configs: HistoryEngine){
        // @ts-expect-error
        this.engines = configs.engines.map(Engine => new Engine())
    }

    getChainHistory(chain: string){
            const engine = this.engines.find(engine => engine.hasChain(chain))
            
            if(!engine) throw new Error('Engine not exists')
    
            return engine
    }

    async getHistory(params: IHistoryParams): Promise<IHistoryResponse>{
        const {chain} = params

        const engine = this.getChainHistory(chain)

        if(engine){
            try {
                return engine.getHistory(params)
            } catch (error) {
                return {result: []}
            }
        }

        throw new Error('Method not implement')
    }

}