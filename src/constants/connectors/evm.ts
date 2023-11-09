import { BloctoConnector } from '@blocto/web3-react-connector'
import { WalletConnect as KrystalWalletConnect } from '@kyberswap/krystal-walletconnect-v2'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { OPTIONAL_EVENTS } from '@walletconnect/ethereum-provider'
import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { initializeConnector } from '@web3-react/core'
import { GnosisSafe } from '@web3-react/gnosis-safe'
import { MetaMask } from '@web3-react/metamask'
import { WalletConnect as WalletConnectV2 } from '@web3-react/walletconnect-v2'

import WC_BG from 'assets/images/wc-bg.png'
import Kyber from 'assets/svg/kyber/logo_kyberswap_with_padding.svg'
import { WALLETCONNECT_PROJECT_ID } from 'constants/env'
import {
  NETWORKS_INFO,
  WALLET_CONNECT_OPTIONAL_CHAIN_IDS,
  WALLET_CONNECT_REQUIRED_CHAIN_IDS,
  WALLET_CONNECT_SUPPORTED_CHAIN_IDS,
} from 'constants/networks'

export const [injected, injectedHooks] = initializeConnector<MetaMask>(actions => new MetaMask({ actions }))
export const [rabby, rabbyHooks] = initializeConnector<MetaMask>(actions => new MetaMask({ actions }))
export const [krystal, krystalHooks] = initializeConnector<MetaMask>(actions => new MetaMask({ actions }))
export const [metaMask, metamaskHooks] = initializeConnector<MetaMask>(actions => new MetaMask({ actions }))
export const [gnosisSafe, gnosisSafeHooks] = initializeConnector<GnosisSafe>(actions => new GnosisSafe({ actions }))
export const [coin98, coin98Hooks] = initializeConnector<MetaMask>(actions => new MetaMask({ actions }))
export const [brave, braveHooks] = initializeConnector<MetaMask>(actions => new MetaMask({ actions }))
export const [trust, trustHooks] = initializeConnector<MetaMask>(actions => new MetaMask({ actions }))
export const [blocto, bloctoHooks] = initializeConnector<BloctoConnector>(
  actions =>
    new BloctoConnector({
      actions,
      options: { chainId: ChainId.MATIC, rpc: NETWORKS_INFO[ChainId.MATIC].defaultRpcUrl },
    }),
)
export const [bloctoInject, bloctoInjectHooks] = initializeConnector<MetaMask>(actions => new MetaMask({ actions }))

const walletconnectConfig = {
  options: {
    projectId: WALLETCONNECT_PROJECT_ID,
    chains: WALLET_CONNECT_REQUIRED_CHAIN_IDS,
    optionalChains: WALLET_CONNECT_OPTIONAL_CHAIN_IDS,
    showQrModal: true,
    methods: ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData_v4'],
    optionalMethods: ['eth_signTypedData', 'eth_sign'],
    // optionalMethods: OPTIONAL_METHODS,
    optionalEvents: OPTIONAL_EVENTS,
    rpcMap: WALLET_CONNECT_SUPPORTED_CHAIN_IDS.reduce((acc, cur) => {
      acc[cur] = NETWORKS_INFO[cur].defaultRpcUrl
      return acc
    }, {} as { [key in ChainId]: string }),
    qrModalOptions: {
      chainImages: undefined,
      themeMode: 'dark' as const,
      themeVariables: {
        '--w3m-z-index': '1000',
        '--w3m-logo-image-url': Kyber,
        '--w3m-background-image-url': WC_BG,
        '--w3m-accent-color': '#31CB9E',
        '--w3m-accent-fill-color': '#222222',
        '--w3m-color-bg-1': '#0F0F0F',
      } as any,
    },
    metadata: {
      name: 'KyberSwap',
      description: document.title,
      url: window.location.origin,
      icons: ['https://kyberswap.com/favicon.svg'],
    },
  },
}

export const [walletConnectV2, walletConnectV2Hooks] = initializeConnector<WalletConnectV2>(
  actions =>
    new WalletConnectV2({
      actions,
      ...walletconnectConfig,
    }),
)
export const [krystalWalletConnectV2, krystalWalletConnectV2Hooks] = initializeConnector<KrystalWalletConnect>(
  actions =>
    new KrystalWalletConnect({
      actions,
      ...walletconnectConfig,
    }),
)

export const [coinbaseWallet, coinbaseWalletHooks] = initializeConnector<CoinbaseWallet>(
  actions =>
    new CoinbaseWallet({
      actions,
      options: {
        url: NETWORKS_INFO[ChainId.MAINNET].defaultRpcUrl,
        appName: 'KyberSwap',
      },
    }),
)
