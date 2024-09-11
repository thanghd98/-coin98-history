import { CHAIN_TYPE } from "@wallet/constants"
import { Token } from "@wallet/core"

export type chainType = keyof typeof CHAIN_TYPE

export interface IHistoryParams<T = any> {
    address: string,
    chain: string,
    token?: Token
    pagination: {
        page?: number,
        next?: string,
        limit: number
    }
    option?: T
}

export interface IHistoryObject<T = any>{
    [x: string]: any
    type: string,
    hash:string,
    from: string,
    to:string,
    amount: string,
    isRawAmount?: boolean,
    timestamp: string
    status?: 'success' | 'failed',
    data?: T
}

export interface IHistoryResponse<T = any>{
    result: Array<IHistoryObject<T>>
    next?: string
}