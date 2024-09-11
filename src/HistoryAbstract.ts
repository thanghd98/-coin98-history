import { IHistoryParams, IHistoryResponse } from "./types";

export interface IHistory{}

export abstract class History{    
    abstract getHistory(params: IHistoryParams): Promise<IHistoryResponse>
    abstract hasChain(chain: string): boolean
}