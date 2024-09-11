import { DEFAULT_CONFIG } from "../constants"

export interface ITransactionParams{
    method: "getTransaction",
    jsonrpc: "2.0",
    params:  any
    id: string
}

export const getTransactions = async (params: ITransactionParams[]) => {
    const request = await fetch(DEFAULT_CONFIG,{
        method: "POST",
        headers: {
            "content-type": "application/json",
            "authority": "coin98.com",
            "version": "1",
            "authorization": "Bearer token",
            "signature": "c26340d5243d802f03de751b9cbc049557ad0a14296aacf4a37dc7399adbe65c",
            "origin": "https://wallet.coin98.com",
            "referer": "https://wallet.coin98.com",
            "solana-client": "js/0.0.0-development",
            "Cookie": "__cf_bm=5o2gASUkosfUk_p4B9cKzVs79dkHAV2_yKjt20GgA0A-1718178151-1.0.1.1-UZwcyD8MmobscCb79HCpmi0Yf0fSL.4ixnXfaBb8LjhM0vUNXFc2moahx2IwqK44I6pugoVikgQmobqrUjTCKA"
        },
        body:  JSON.stringify(params)
    })

    return await request.json()
}