import { Connection, PublicKey } from "@solana/web3.js";
import { CHAIN_TYPE } from "@wallet/constants";
import { convertBalanceToWei, convertWeiToBalance } from "@wallet/utils";
import get from "lodash/get";
import { History } from "../../HistoryAbstract";
import { IHistoryParams, IHistoryResponse } from "../../types";
import { DEFAULT_CONFIG, KNOW_CONTRACT } from "./constants";
import { HistoryHanle, HistoryHanleResponse, HistoryType } from "./types";
import 'rpc-websockets/dist/lib/client'
import 'rpc-websockets/dist/lib/client/websocket.browser'
import { getTransactions, ITransactionParams } from "./api";

export class SolanaHistory extends History{   
    connection: Connection

    //Try singleton after
    constructor(){
        super()

        this.connection = new Connection(DEFAULT_CONFIG)
    }

    async getHistory<T extends IHistoryParams<T>>(params: T): Promise<IHistoryResponse<{gas: number}>>{
        const { address, token, pagination } = params;

        const page = pagination?.page ?? 1
        const limit = pagination?.limit ?? 20

        const size = page * limit
        let status: 'success' | 'failed'

        try {
            const txsData = await this.connection.getSignaturesForAddress(new PublicKey(token?.address ? String(get(token, 'baseAddress')) : address), { limit })
            if (txsData.length === 0) return { result: []}

            const transactionParams: ITransactionParams[] = txsData.slice((page - 1) * size, page * size).map((tx) => {
                return {
                  id: new Date().getTime().toString(),
                  method: "getTransaction",
                  jsonrpc: "2.0",
                  params:[
                    tx.signature,
                    {
                      encoding: 'jsonParsed',
                      maxSupportedTransactionVersion: 0
                    }
                  ]
                }
            })


            const data = await getTransactions(transactionParams)

            const formatTxs = data.map((txs: any) => txs?.result)

            const tokenTxs = formatTxs.filter((item: any) => {
                status =  get(item, 'meta.err') !== null ? 'failed' : 'success'
                if (token?.address) return item
                const parsedInstruction = get(item, 'transaction.message.instructions')
        
                const instructionParsedIndex = parsedInstruction.findIndex((item: any) => item?.parsed?.type === 'transfer')
        
                if (instructionParsedIndex === -1) return item
        
                return instructionParsedIndex !== -1 && !(parsedInstruction[instructionParsedIndex].program === 'spl-token')
            })

            const finalResult = tokenTxs?.map((item: any) => {
                const { type, amount, from, to } = this.getHistoryTransasction({ instruction: item, addressWallet: address, token })
        
                const GAS_PRICE = 5000
        
                return {
                    type,
                    hash: get(item, 'transaction.signatures[0]'),
                    from,
                    to,
                    amount: convertBalanceToWei(amount,token?.decimal || 9),
                    isRawAmount: true,
                    timestamp: get(item, 'blockTime'),
                    status,
                    data: {
                        gas: get(item, 'meta.fee', GAS_PRICE)
                    }
                }
             
            })?.sort((a: any,b: any) => b?.timestamp - a?.timestamp )
        
            return {result: finalResult}
        } catch (error) {
            return {result: []}      
        }
    }

    hasChain(chain: string): boolean {
        return chain === CHAIN_TYPE.solana
    }

    getHistoryTransasction (params: HistoryHanle): HistoryHanleResponse {
        const { instruction, addressWallet } = params
    
        const accountKeys = get(instruction, 'transaction.message.accountKeys')
        const accounts = accountKeys?.map((item: any) => item.pubkey.toString())
        
        const metaData = get(instruction, 'meta')
        const preBalance = metaData[params?.token?.address ? 'preTokenBalances' : 'preBalances']
        const postBalance = metaData[params?.token?.address ? 'postTokenBalances' : 'postBalances']
    
        const parsedInstruction = get(instruction, 'transaction.message.instructions')
        let instructionParsedIndex
        
        if (params?.token?.address) {
          const isTransfer = parsedInstruction.some((item: any) => item?.parsed?.type === 'transfer')
          instructionParsedIndex = parsedInstruction.findIndex((item: any) => isTransfer ? item?.parsed?.type === 'transfer' : item?.parsed?.type)
        } else {
          instructionParsedIndex = parsedInstruction.findIndex((item: any) => item?.parsed?.type)
        }
    
        const findIndex = accounts.indexOf(params?.token?.address ? params?.token?.baseAddress : addressWallet)
    
        if (instructionParsedIndex !== -1) {
          const txsType = get(parsedInstruction[instructionParsedIndex], 'parsed.type')
    
          switch (txsType) {
            case 'transfer':{
    
              const fromAddress = get(parsedInstruction[instructionParsedIndex], 'parsed.info.source')
              const toAddress = get(parsedInstruction[instructionParsedIndex], 'parsed.info.destination')
    
              let amount: string, type: HistoryType
    
              type = fromAddress === toAddress ? 'self' : fromAddress === (params?.token?.address ? params?.token?.baseAddress : addressWallet) ? 'send' : 'receive'
    
              if (params?.token?.address) {
                const postAccount = postBalance.find((ins: any) => ins.accountIndex === findIndex)
                const preAccount = preBalance.find((ins: any) => ins.accountIndex === findIndex)
                amount = get(parsedInstruction[instructionParsedIndex], 'parsed.info.amount', '').toString()
    
                if (Number(amount) !== 0 && !amount) {
                  amount = Math.abs(postAccount.uiTokenAmount.uiAmount - get(preAccount, 'uiTokenAmount.uiAmount', 0)).toString()
                  type = fromAddress === toAddress ? 'self' : fromAddress === addressWallet ? 'send' : 'receive'
                } 
              } else {
                amount = get(parsedInstruction[instructionParsedIndex], 'parsed.info.lamports').toString()
              }
              
              return {
                from: fromAddress,
                to: toAddress,
                amount: convertWeiToBalance(amount, params?.token?.decimal),
                type
              }
            }
            case 'create' ?? 'createAccount':{          
              const parsedIndex = parsedInstruction.findIndex((item: any) => item?.parsed?.type === 'createAccount' || item?.parsed?.type === 'createAccount')
              // const instructionParsedIndex = parsedInstruction.findIndex((item: any) => item?.parsed?.type)
    
              const fromAddress = get(parsedInstruction[parsedIndex], 'parsed.info.source')
              const toAddress = get(parsedInstruction[parsedIndex], 'parsed.info.newAccount')
    
              let amount 
    
              if (params?.token?.address) {
                const postAccount = postBalance.find((ins: any) => ins.accountIndex === findIndex)
                const preAccount = preBalance.find((ins: any) => ins.accountIndex === findIndex)
      
                if (postAccount) {
                  amount = Math.abs(postAccount.uiTokenAmount.uiAmount - get(preAccount, 'uiTokenAmount.uiAmount', 0)).toString()
                }
              } else {
                amount = convertWeiToBalance(get(parsedInstruction[parsedIndex], 'parsed.info.lamports'), 9)
              }
    
              return {
                from: fromAddress, 
                to: toAddress,
                amount,
                type: 'createAta'
              }
            }
            case 'closeAccount':{
              const parsedIndex = parsedInstruction.findIndex((item: any) => item?.parsed?.type === 'closeAccount')
    
              const fromAddress = get(parsedInstruction[parsedIndex], 'parsed.info.owner')
              const toAddress = get(parsedInstruction[parsedIndex], 'parsed.info.account')
    
              return {
                from: fromAddress, 
                to: toAddress,
                amount: convertWeiToBalance(Math.abs(postBalance[findIndex] - preBalance[findIndex]).toString(), params?.token ? params?.token?.decimal : 9),
                type: 'closeAccount'
              }
            }
            default: {
              let amount 
    
              if (params?.token?.address) {
                const postAccount = postBalance.find((ins: any) => ins.accountIndex === findIndex)
                const preAccount = preBalance.find((ins: any) => ins.accountIndex === findIndex)
    
                if (postAccount) {
                  amount = Math.abs(postAccount.uiTokenAmount.uiAmount - get(preAccount, 'uiTokenAmount.uiAmount', 0)).toString()
                }
              } else {
                amount = convertWeiToBalance(Math.abs(postBalance[findIndex] - preBalance[findIndex]).toString(), 9)
              }
              return {
                type: 'callContract',
                from: accounts[0],
                to: accounts[accounts.length - 1],
                amount
              } }
          }
        } else {
          const knowContract = accounts.find((item: any) => KNOW_CONTRACT[item])
    
          if (knowContract) {
            const detailKnownContract = KNOW_CONTRACT[knowContract]
                
            return {
              type: detailKnownContract.type,
              from:'',
              to:'',
              amount:convertWeiToBalance(Math.abs(postBalance[findIndex] - preBalance[findIndex]).toString(), params?.token ? params?.token?.decimal : 9),
            }
          } else {
            let amount
    
            if (params?.token?.address) {
              const postAccount = postBalance.find((ins: any) => ins.accountIndex === findIndex)
              const preAccount = preBalance.find((ins: any) => ins.accountIndex === findIndex)
    
              if (postAccount) {
                amount = Math.abs(postAccount.uiTokenAmount.uiAmount - get(preAccount, 'uiTokenAmount.uiAmount', 0)).toString()
              }
            } else {
              amount = convertWeiToBalance(Math.abs(postBalance[findIndex] - preBalance[findIndex]).toString(), params?.token?.address ? params?.token?.decimal : 9)
            }
    
            return {
              type: 'callContract',
              from: accounts[0],
              to: accounts[accounts.length - 1],
              amount
            }
          }
        }
      }
    
}