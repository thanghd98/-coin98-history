// import { decodeMessage } from '@wallet/abi-decoder'
import { getFunctionName } from '../common'
import _get from 'lodash/get'
import _isEqual from 'lodash/isEqual'
import _toLower from 'lodash/toLower'
import { calculateBigNumber } from '@wallet/utils'
// import Web3 from 'web3'
import { defaultAbiCoder } from '@ethersproject/abi'

const MAX_INTEGER_BIGINT = '115792089237316195423570985008687907853269984665640564039457584007913129639935'
export type DecodeSwapType = (hash: string) => Promise<Record<string, any> | null>
export type DecodeMessageType = (name: string, hexCode: string) => Record<string, any> | null
export type GenerateInputData = (props: any, walletAddress: string, chain: string) => any

export const decodeSwap =(client: any): DecodeSwapType => async (hash: string) => {
    try {
      // uniswap
      const SWAP_TOPIC = [
        '0xd6d34547c69c5ee3d2667625c188acf1006abb93e0ee7cf03925c67cf7760413',
        '0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67'
      ]
      const logSwap = await client.eth.getTransactionReceipt(hash)
      if (!logSwap) return null
      const logs = logSwap.logs.find((item: { topics: string[] }) => SWAP_TOPIC.includes(item.topics[0]))
      if (!logs) return null
      let data
      switch (logs.topics[0]) {
        case SWAP_TOPIC[0]:
          data = defaultAbiCoder.decode(['address', 'address', 'uint256', 'uint256', 'uint256'], data as any)
          if (data) return { sellToken: data[0], buyToken: data[1], sellAmount: data[2], buyAmount: data[3], climateFee: data[4] }
          break
  
  // not have done yet
  
  // case SWAP_TOPIC[1]:
  //   data = this.client.eth.abi.decodeParameters(['int256', 'int256', 'int256', 'uint128', 'int24'], logs.data)
  //   if (data) {
  //     const amountA = Number(data[0]) > 0 ? Number(data[0]) : -Number(data[0])
  //     return [amountA, data[1], ['', '']]
  //   }
  //   break
      }
    // data[0] = Address, data[1] = tokenIn, data[2] = amountA, data[3] = amountSwap, data[4] = receiveAmount
    } catch (error) {
  
    }
  
    return null
  }

export const generateInputCode = (decodeMessage: DecodeMessageType): GenerateInputData => (props: any, walletAddress: string, chain: string) => {
    if (props?.isError === '1') {
      return {
        ...props,
        type: 'fail'
      }
    }
  
    const { from, to, functionName: func, method } = props
    const input: string = props?.input ?? ''
    let functionName: string = func ?? method

    if (!functionName || functionName.startsWith('0x')) { functionName = getFunctionName(input) }
  
    const getDataTransferToken = (preState: any) => {
      const readTransferToken = decodeMessage('transfer', input)
      console.log("🚀 ~ getDataTransferToken ~ readTransferToken:", readTransferToken)
  
      if (!readTransferToken) return null
  
      const result = { ...preState }
      // const to = preState?.toContract ?? ''
      const tokenAddress = _get(result, 'tokentx.0.contractAddress', '')
      if (!result.contractAddress && tokenAddress) { result.contractAddress = tokenAddress }
      result.to = readTransferToken[0]
      result.value = readTransferToken[1]
      if (_toLower(result.to) === _toLower(result.from)) {
        result.type = 'self'
      } else
        if (_toLower(readTransferToken[0]) === _toLower(walletAddress)) {
          result.type = 'receive'
        } else {
          result.type = 'send'
        }
      result.dataTransfer = {
        tokenAddress: result?.contractAddress,
        to: readTransferToken[0],
        amount: readTransferToken[1]
      }
      return result
    }
    const getDataApprovalTx = (state: any) => {
      const result = { ...state }
      const readApprove = decodeMessage('approve', input)
      if (readApprove) {
        result.spender = readApprove[0]
        result.value = readApprove[1]
        result.contractAddress = to
        result.to = readApprove[0]
        result.isUnlimited = readApprove[1] === MAX_INTEGER_BIGINT
        result.type = parseFloat(readApprove[1]) !== 0 ? 'approval' : 'revoked'
        return result
      }
      return null
    }
    const getDataTransferTx = (state: any) => {
      const result = { ...state }
      const transferMultiToken = decodeMessage('transferMultiToken', input)
  
      if (transferMultiToken) {
        result.to = to
        result.contractAddress = transferMultiToken[0]
        // stateOutPut.value = transferMultiToken.amount
        result.value = calculateBigNumber(transferMultiToken[2], 'add')
        result.type = 'transfer' // will be update when have UI multi
        // stateOutPut.type = 'sendMulti'
        result.dataTransfer = {
          type: 'sendMulti',
          tokenAddress: transferMultiToken[0],
          to: transferMultiToken[1],
          amounts: transferMultiToken[2]
        }
  
        return result
      }
      const transferMulti = decodeMessage('transferMulti', input)
  
      if (transferMulti) {
        result.to = to
        result.contractAddress = to
        result.value = calculateBigNumber(transferMulti[1], 'add')
        result.type = 'transfer'
        result.dataTransfer = {
          type: 'sendMulti',
          tokenAddress: '',
          to: transferMulti[0],
          amounts: transferMulti[1]
        }
        return result
      }
      if (input.startsWith('0x1249c58b') || input.startsWith('0x23b872dd')) {
        const readTransfer = decodeMessage('transferNft', input)
        if (readTransfer) {
          if (readTransfer?.type === 'nft') {
            result.type = 'transfer'
            result.dataTransfer = {
              type: _toLower(from) === readTransfer[0] ? 'self' : readTransfer[1] === _toLower(walletAddress) ? 'receive' : 'send',
              to: readTransfer[1],
              tokenId: readTransfer[2],
              extraType: 'erc721'
            }
            return result
          }
          result.to = readTransfer.recipient
          result.contractAddress = to
          result.value = readTransfer.amount
          result.type = 'transfer'
          result.dataTransfer = {
            type: _toLower(from) === readTransfer.recipient ? 'self' : readTransfer.recipient === _toLower(walletAddress) ? 'receive' : 'send',
            tokenAddress: to,
            to: readTransfer.recipient,
            amounts: readTransfer.amount
          }
          return result
        }
      }
  
      const tokenData = getDataTransferToken(result)
  
      if (tokenData) return tokenData
  
      return null
    }
  
    const stateOutPut = {
      ...props,
      chain,
      type: _toLower(from) === _toLower(to)
        ? 'self'
        : (_toLower(to) === _toLower(walletAddress)
            ? 'receive'
            : 'send')
    }

    let nftTransfer = _get(stateOutPut, 'nfttx')
  
    if (nftTransfer || _get(stateOutPut, 'action') === 'nfttx') {
      if (_get(stateOutPut, 'action') === 'nfttx') nftTransfer = stateOutPut
      console.log("🚀 ~ generateInputCode ~ nftTransfer:", nftTransfer)
      stateOutPut.type = 'transfer'
      stateOutPut.contractAddress = nftTransfer.contractAddress
      stateOutPut.to = nftTransfer.contractAddress
      stateOutPut.from = nftTransfer.from
      stateOutPut.dataTransfer = {
        type: _isEqual(_toLower(stateOutPut.to), _toLower(stateOutPut.from))
          ? 'self'
          : _isEqual(_toLower(stateOutPut.to), _toLower(walletAddress))
            ? 'receive'
            : 'send',
        to: nftTransfer.toContract,
        from: nftTransfer.from,
        tokenId: nftTransfer.tokenID,
        tokenName: nftTransfer.tokenName,
        tokenSymbol: nftTransfer.tokenSymbol,
        tokenNftAddress: nftTransfer.contractAddress,
        extraType: 'erc721'
      }
  
      return stateOutPut
    }
  
    if (input === '0x'  || input === 'deprecated' || _get(stateOutPut, 'action') === 'tokentx') {

      return stateOutPut
    }

    if (!functionName) {
      return {
        ...stateOutPut,
        type: 'callContract',
        value: 0,
        amount: 0
      }
    }
  
    if (functionName.includes('approve') || props.type === 'approval' || props.type === 'approve') {
      const approve = getDataApprovalTx(stateOutPut)
      if(_get(stateOutPut, 'action') === 'txlist' && approve){
        return { ...approve, type: 'callContract', value: 0 , to: approve?.toContract}
      }
      if (approve) return approve
    }

    if (functionName.includes('redeem')) {
      const readRedeem = decodeMessage('redeem', input)
      if (readRedeem) {
        stateOutPut.vaultData = {
          amount: readRedeem[4]
        }
        stateOutPut.contractAddress = _get(stateOutPut, 'tokentx.0.contractAddress')
        stateOutPut.value = _get(stateOutPut, 'tokentx.0.value')
        return {
          ...stateOutPut,
          type: 'vault'
        }
      }
    }

    if (functionName === 'unoswap') {
      const unoswap = decodeMessage('unoswap', input)
      if (unoswap) {
        stateOutPut.swapData = {
          amountSend: unoswap[1],
          tokenSend: unoswap[0] === '0x0000000000000000000000000000000000000000' ? '' : unoswap[0],
          swapRouter: stateOutPut?.toContract ?? stateOutPut?.to
        }
        return { ...stateOutPut, type: 'swap' }
      }
      return { ...stateOutPut, type: 'callContract' }
    } else
      if (functionName.includes('swap')) {
        const readSwap = decodeMessage('swap', input)
  
        if (readSwap) {
          const amountSend = readSwap[0]
          const amountReceive = readSwap[1]
          const tokenSend = readSwap[2][0]
          const tokenReceive = readSwap[2][readSwap[2].length - 1]
  
          stateOutPut.swapData = {
            amountSend,
            amountReceive,
            tokenSend,
            tokenReceive,
            swapRouter: stateOutPut?.toContract ?? stateOutPut?.to
          }
          return {
            ...stateOutPut,
            type: 'swap'
          }
        }
        // const readDeposit = await decodeSwap(hash)
        // if (readDeposit) {
        //   const tokenSend = readDeposit.buyToken
        //   const amountReceive = readDeposit.sellToken
        //   const amountSend = readDeposit.buyAmount
        //   const tokenReceive = readDeposit.sellAmount
  
        //   stateOutPut.swapData = {
        //     amountSend,
        //     amountReceive,
        //     tokenSend,
        //     tokenReceive,
        //     swapRouter: stateOutPut?.toContract ?? stateOutPut?.to
        //   }
        //   return {
        //     ...stateOutPut,
        //     type: 'swap'
        //   }
        // }
      }
  
    // Transfer erc20 & erc721
    if (functionName.includes('transfer')) {

      const transferTxData = getDataTransferTx(stateOutPut)
      if(_get(stateOutPut, 'action') === 'txlist' && transferTxData){
        return { ...transferTxData,  to: stateOutPut.to || stateOutPut.contractAddress || stateOutPut.toContract, type: 'callContract', value: 0 }
      }
      if (transferTxData) { return transferTxData }
    }

    const internalTransfer = _get(stateOutPut, 'tokentx.0')
    if (internalTransfer) {
      stateOutPut.contractAddress = _get(internalTransfer, 'contractAddress')
      stateOutPut.value = _get(internalTransfer, 'value')
      stateOutPut.to = _get(internalTransfer, 'to')
      stateOutPut.from = _get(internalTransfer, 'from')
      stateOutPut.type = 'transfer'
      stateOutPut.dataTransfer = {
        type: _toLower(_get(internalTransfer, 'from')) === _toLower(_get(internalTransfer, 'to')) ? 'self' : _toLower(_get(internalTransfer, 'to')) === _toLower(walletAddress) ? 'receive' : 'send',
        tokenAddress: _get(internalTransfer, 'contractAddress'),
        to: _get(internalTransfer, 'to'),
        amounts: _get(internalTransfer, 'value')
      }
  
      return stateOutPut
    }
    return {
      ...stateOutPut,
      to: stateOutPut.to || stateOutPut.contractAddress || stateOutPut.toContract,
      type: 'callContract'
    }
  }
