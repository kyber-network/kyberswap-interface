import { ChainId } from '@kyberswap/ks-sdk-core'
import { WalletConnect as WalletConnectV2 } from '@web3-react/walletconnect-v2'

import { blocto, bloctoInject, gnosisSafe, krystalWalletConnectV2, walletConnectV2 } from 'constants/connectors/evm'
import { BLOCTO_SUPPORTED_NETWORKS, SUPPORTED_NETWORKS } from 'constants/networks'
import { useWeb3React } from 'hooks'

function getChainsFromEIP155Accounts(accounts?: string[]): ChainId[] {
  if (!accounts) return []
  return accounts
    .map(account => {
      const splitAccount = account.split(':')
      return splitAccount[1] ? parseInt(splitAccount[1]) : undefined
    })
    .filter(x => x !== undefined) as ChainId[]
}

export function useWalletSupportedChains(): ChainId[] {
  const { connector, chainId } = useWeb3React()

  switch (connector) {
    case walletConnectV2:
    case krystalWalletConnectV2:
      return [
        ...getChainsFromEIP155Accounts((connector as WalletConnectV2).provider?.session?.namespaces?.eip155?.accounts),
      ]
    case gnosisSafe:
      return chainId ? [chainId] : SUPPORTED_NETWORKS
    case blocto:
    case bloctoInject:
      return BLOCTO_SUPPORTED_NETWORKS
    default:
      return SUPPORTED_NETWORKS
  }
}
