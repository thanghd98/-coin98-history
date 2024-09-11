import _get from 'lodash/get'
import _groupBy from 'lodash/groupBy'
// import _uniqBy from 'lodash/uniqBy'
import _toLower from 'lodash/toLower'
import _isEmpty from 'lodash/isEmpty'

export const serialize = (obj: any) => new URLSearchParams(obj).toString()

export const typeFunctionTomoChain = (type: string) => {
  switch (type) {
    case '0xd9f8ab8d':
      return 'callContract'
    case '0x23b872dd':
      return 'callContract'
    case '0xce06a4af':
      return 'callContract'
    case '0x51da2975':
      return 'stake'
    case '0x095ea7b3':
      return 'approve'
    default:
      return 'transfer'
  }
}

export const uniqueCustomTxAndTokenTxByHash = (extraResponse: any[]) => {
  const groupTxs = Object.values(_groupBy(extraResponse, 'hash'))
  const fullHistory = groupTxs
    .map(vals => {
      let contractAddressTx = vals[0]?.to
      const consolidatedData = vals.reduce((pre, val) => {
        // if (token?.address && val?.action === 'tokentx') return val
        if (val?.action === 'txlist') {
          contractAddressTx = val?.to
          return {...pre, ...val}
        }

        if (_isEmpty(pre)) {
          return val
        }

        if (val?.action === 'tokentx') {
          return {...pre, tokentx: _get(pre, 'tokentx', [])?.concat(val)}
        }
        if (val?.action === 'nfttx') {
          return {...pre, nfttx: val}
        }

        return pre
      }, {})
      return {...consolidatedData, contractAddress: _get(consolidatedData, 'contractAddress', ''), toContract: contractAddressTx}
    })
    .sort((a, b) => b.timeStamp - a.timeStamp)
  return fullHistory
}

export const getFunctionName = (inputData: string) => {
  // *AURORA chain: not define unoswap tx
  if (inputData.startsWith('0x0502b1c5')) return 'unoswap'
  if (inputData.startsWith('0x095ea7b3')) return 'approve'
  if (inputData.length > 10) return 'transfer'
  return ''
}
