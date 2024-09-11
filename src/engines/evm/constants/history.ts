export const CHAIN_HISTORY: Record<string, {url: string, apiKey?: string}>   = {
    base: {
        url: 'https://api.basescan.org/api',
        apiKey: 'RTDZPUZ83PJDN4FRFQGDIJ1IE9Q9KVK4TF'
    },
    bitgert: {
        url: 'https://scan.brisescan.com/api',
        apiKey: ''
    },
    bitkub:{
        url: 'https://www.bkcscan.com/api',
        apiKey: ''
    },
    boba:{
        url: 'https://api.routescan.io/v2/network/mainnet/evm/288/etherscan/api',
        apiKey: ''
    },
    berachain:{
        url: 'https://api.routescan.io/v2/network/testnet/evm/80085/etherscan/api',
        apiKey: ''
    },
    kardia:{
        url: 'https://explorer.kardiachain.io/api',
        apiKey: ''
    },
    linea:{
        url: 'https://api.lineascan.build/api',
        apiKey: 'WE24ED6XW2IC2577231JYCPR2F64AC9UYA'
    },
    zkSyncEra:{
        url: 'https://block-explorer-api.mainnet.zksync.io/api',
    },
    manta:{
        url: 'https://www.oklink.com/api/v5/explorer/manta/api',
        apiKey: '6ff621a9-4040-4cd1-a131-3251e08bbcaf'
    },
    kucoin:{
        url: 'https://scan.kcc.io/api',
        apiKey: '6ff621a9-4040-4cd1-a131-3251e08bbcaf'
    },
    ancient8Mainnet:{
        url: 'https://scan.ancient8.gg/api',
        apiKey: ''
    },
    kroma: {
        url: 'https://api.kromascan.com/api',
        apiKey: ''
    }
}