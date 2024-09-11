import { CosmosHistory, SolanaHistory, EvmHistory } from "../engines";
import { History } from '../HistoryAbstract'

export const Engines:  History[] = [
    SolanaHistory, 
    CosmosHistory, 
    CosmosHistory,
    EvmHistory, 
] as any

export const TYPE = {
    send: 'send',
    executeContract: 'executeContract'
}
  
export const MSG_TYPE = {
    '/cosmos.bank.v1beta1.MsgSend': TYPE.send,
    '/cosmos.tx.v1beta1.Tx': TYPE.send
}
  
