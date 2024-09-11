import { Token } from "@wallet/core"

export type HistoryType = 'send' | 'receive' | 'self' | 'createAta' | 'callContract' | 'closeAccount' | ''

export interface HistoryHanleResponse {
    from: string
    to: string
    amount: string
    type: HistoryType
}
  
export interface HistoryHanle {
    instruction: any
    addressWallet: string
    token?: Token
}