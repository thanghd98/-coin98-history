import { ChainConfigsCosmos } from "@wallet/constants";
import { CosmosChainInfo } from "../types";

export const ChainConfigs: CosmosChainInfo[] = ChainConfigsCosmos

export const ChainRest: Record<string, string> = {
    cosmos: 'https://go.getblock.io/aab5dca7bb9142189d301a0aa1c60010',
    terra2: 'https://lcd-terra.tfl.foundation',
    //node
    band: 'https://laozi1.bandchain.org/api',
    aura: 'https://lcd.aura.network',
    terra: 'https://api-terra-ia.cosmosia.notional.ventures',
    kava: 'https://api.data.kava.io/',
    secretNetwork: 'https://secretnetwork-api.lavenderfive.com:443',
    persistence: 'https://rest.core.persistence.one',
    functionX: 'https://fx-rest.functionx.io',
    //node
    injective: 'https://injective-1-public-rest.mesa.ec1-prod.newmetric.xyz',
    osmosis: 'https://rest.osmosis.goldenratiostaking.net',
    evmos: 'https://evmos-api.polkachu.com',
    juno: 'https://juno-api.lavenderfive.com:443',
    agoric: 'https://agoric-api.polkachu.com',
    kujira: 'https://lcd-kujira.whispernode.com',
    stargaze: 'https://rest.stargaze-apis.com',
    umee: 'https://api-umee-ia.cosmosia.notional.ventures',
    stride: 'https://stride-api.polkachu.com',
    seiMainnet: 'https://sei-api.lavenderfive.com:443',
    archwayMainnet: 'https://api.mainnet.archway.io',
    xion: 'https://api.xion-testnet-1.burnt.com',
    celestia: 'https://public-celestia-lcd.numia.xyz'
}