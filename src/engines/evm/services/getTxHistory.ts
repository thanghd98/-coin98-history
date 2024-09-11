import {CHAIN_TYPE} from '@wallet/constants'
import _get from 'lodash/get'
import _pick from 'lodash/pick'
import {IHistoryParams} from '../../../types'
import {serialize, typeFunctionTomoChain, uniqueCustomTxAndTokenTxByHash} from '../common'
import {C98_ADAPTER_ENDPOINT, CHAIN_HISTORY} from '../constants'
import _toLower from 'lodash/toLower'
import get from 'lodash/get'

const getHistoryOnTomoChain = async (params: IHistoryParams<any>) => {
  const {address, token, pagination} = params
  const page = (pagination?.page ?? 1) - 1
  const limit = pagination?.limit ?? 20
  const tokenAddress = get(token, 'address')

  if (tokenAddress) {
    const fetchApiEndpoint = `${C98_ADAPTER_ENDPOINT}/wallet/approval?${serialize({tokenAddress, account: address, page, limit})}`

    const responseData = await (await fetch(fetchApiEndpoint,{
      headers: {
        Version: '14.6.3'
      }
    })).json()

    if (!responseData?.data) {
      return []
    }
    const transformDataResponse = responseData.data.map((item: any) =>
      _pick(item, [
        'blockNumber',
        'timestamp',
        'hash',
        'blockHash',
        'from',
        'to',
        'contractAddress',
        'value',
        'tokenName',
        'tokenSymbol',
        'tokenDecimal',
        'nonce',
        'transactionIndex'
      ])
    )
    return [...transformDataResponse].map((tx: any) => ({...tx, action: 'txlist'}))
  }

  const fetchApiEndpoint = `https://tomoscan.io/api/transaction/list?${serialize({account: address, offset: page * limit, limit})}`

  const responseData = await (await fetch(fetchApiEndpoint)).json()

  if (!responseData.data) {
    return []
  }

  // if(tokenAddress){
  //   responseData = responseData?.data?.filter((tx: any) => tx?.to === tokenAddress)
  // }
  // else{
  //   responseData = responseData?.data?.filter((tx: any) => tx?.input === '0x')
  // }

  const transformDataResponse = responseData?.data?.map((item: any) => ({
    ...item,
    timeStamp: item.timestamp,
    isError: item.status === 'fail' ? 1 : 0,
    contractAddress: item.toContract ? item.to : null,
    functionName: typeFunctionTomoChain(item.input.slice(0, 10))
  }))
  return [...transformDataResponse].map((tx: any) => ({...tx, action: 'txlist'}))
}

const getRawTransaction = async (params: IHistoryParams<any>) => {
  const {address, chain, token} = params
  try {
    let extraResponse: any[] = []

    const page = params?.pagination?.page ?? 1
    const size = params?.pagination?.limit ?? 20

    const fetchApiEnpoint = `${C98_ADAPTER_ENDPOINT}/wallet/approval?chain=${chain}&address=${address}&page=${page}&size=${size}`

    const chainApi = await (await fetch(fetchApiEnpoint,{
      headers:{

      }
    })).json()

    let {url, query} = await chainApi?.data

    if(!url || Object.keys(CHAIN_HISTORY).includes(chain as any)) url = CHAIN_HISTORY[chain].url

    if(!query.action) query = {
      ...query,
      action: 'txlist',
      module: 'account',
      startblock: 0, 
      endblock: 99999999, 
      sort: 'desc',
      address: address,
      page,
      offset: size
    }

    if(!query.apiKey) query = {
      ...query,
      apiKey: CHAIN_HISTORY[chain].apiKey
    }

    let queryScan = {startblock: 0, endblock: 99999999, sort: 'desc', ...query}

    // if (chain === CHAIN_TYPE.ancient8Mainnet) {
    //   queryScan = {startblock: 0, endblock: 99999999, sort: 'desc'}
    // } else {
    //   queryScan = {startblock: 0, endblock: 99999999, sort: 'desc', ...query}
    // }

    const urlScan = String(url).includes('?') ? String(url) : `${String(url)}?`

    if (!url) {
      return []
    }
    if (!token?.address) {
      const txListEnpoint = `${urlScan}${serialize({...queryScan})}`

      const txList = await (await fetch(txListEnpoint,{
        ...(chain === CHAIN_TYPE.manta &&{
          headers: {
            'OK-ACCESS-KEY':  CHAIN_HISTORY[chain].apiKey as string
          }
        })
      })).json()

      const resultTx = (txList?.result ?? txList?.data ?? txList?.items ?? []).map((tx: any) => ({...tx, action: 'txlist'}))

      if (Array.isArray(resultTx)) {
        extraResponse = extraResponse.concat(resultTx)
      }

      const nftTxEnpoint = `${urlScan}${serialize({...queryScan, action: 'tokennfttx'})}`

    

      const nftTxList = await (await fetch(nftTxEnpoint, {
        ...(chain === CHAIN_TYPE.manta &&{
          headers: {
            'OK-ACCESS-KEY':  CHAIN_HISTORY[chain].apiKey as string
          }
        })
      })).json()


      const resultNftTx = (nftTxList?.result ?? nftTxList?.data ?? [])?.map((tx: any) => ({...tx, action: 'nfttx'}))
      if (Array.isArray(resultNftTx)) {
        extraResponse = extraResponse.concat(resultNftTx)
      }
    }

    if (token?.address) {
      if (token?.address) {
        queryScan.contractaddress = token?.address
      }
      const tokenTxListEnpoint = `${urlScan}${serialize({...queryScan, action: 'tokentx'})}`

      const tokenTxList = await (await fetch(tokenTxListEnpoint, {
        ...(chain === CHAIN_TYPE.manta &&{
          headers: {
            'OK-ACCESS-KEY':  CHAIN_HISTORY[chain].apiKey as string
          }
        })
      })).json()

      const resultTokenTx = (tokenTxList?.result ?? tokenTxList?.data ?? []).map((tx: any) => ({...tx, action: 'tokentx'}))
      if (Array.isArray(resultTokenTx)) {
        extraResponse = extraResponse.concat(resultTokenTx)
      }
    }

    return extraResponse
  } catch (error) {
    return []
  }
}

export const getAccountTransactionHistory = async (params: IHistoryParams<any>) => {
  const {chain} = params
  let extraResponse: any[] = []
  if (chain === CHAIN_TYPE.tomo) {
    extraResponse = await getHistoryOnTomoChain(params)
  } else {
    extraResponse = await getRawTransaction(params)
  }

  return uniqueCustomTxAndTokenTxByHash(extraResponse)
}

// async function getFinalHistory(fullHistory: any[], params: any, generateInputCode: any) {
//   const {address, chain, token} = params
//   const dataConvertAsync = fullHistory.map(async (item: any) => {
//     if (token) {
//       let {from, to} = item

//       if (chain === CHAIN_TYPE.ancient8) {
//         from = from?.hash
//         to = to?.hash
//       }

//       // NOTE: condition-1 Transaction has contract address diff with token address => call contract
//       // ? condition 2: Cannot sure condition correctly, but it is working good
//       if (
//         _toLower(item?.contractAddress) !== _toLower(token?.address) ||
//         (item?.value === '0' && item?.input?.length > 2) ||
//         item?.to?.is_contract
//       ) {
//         return {...item, type: 'callContract'}
//       }
//       return {
//         ...item,
//         chain,
//         type: _toLower(from) === _toLower(to) ? 'self' : _toLower(to) === _toLower(address) ? 'receive' : 'send'
//       }
//     }
//     const genCode = await generateInputCode(item, address, chain)
//     return genCode
//   })

//   const dataConvert = await Promise.all(dataConvertAsync)

//   const finalResult: any[] = dataConvert?.map(item => {
//     return {
//       type: _get(item, 'type', 'callContract'),
//       hash: _get(item, 'hash'),
//       from: _get(item, 'from.hash', _get(item, 'from')),
//       to: _get(item, 'to.hash', _get(item, 'to')),
//       amount: _get(item, 'value'),
//       isRawAmount: true,
//       timestamp: _get(item, 'timeStamp', _get(item, 'timestamp')),
//       status: _get(item, 'isError', '0') === '0' ? 'success' : 'failed',
//       contractAddress: _get(item, 'contractAddress', ''),
//       swapData: _get(item, 'swapData'),
//       dataTransfer: _get(item, 'dataTransfer'),
//       isUnlimited: _get(item, 'isUnlimited', false),
//       gas: _get(item, 'gas', 0),
//       gasUsed: _get(item, 'gasUsed', 0),
//       gasPrice: _get(item, 'gasPrice', 0),
//       confirmation: _get(item, 'confirmations'),
//       blockNumber: _get(item, 'blockNumber'),
//       transactionIndex: _get(item, 'transactionIndex'),
//       input: _get(item, 'input'),
//       rawDataItem: item
//     }
//   })
//   return finalResult
// }
