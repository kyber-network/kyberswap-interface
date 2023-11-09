import { captureException } from '@sentry/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useCallback } from 'react'

import {
  LOCALSTORAGE_LAST_WALLETKEY_EVM,
  LOCALSTORAGE_LAST_WALLETKEY_SOLANA,
  SUPPORTED_WALLETS,
} from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import { isEVMWallet, isSolanaWallet } from 'utils'

export const useActivationWallet: () => {
  tryActivation: (walletKey: string, isEagerly?: boolean) => Promise<void>
} = () => {
  const { select, wallet: solanaWallet } = useWallet()
  const { isSolana, isEVM } = useActiveWeb3React()

  const tryActivationEVM: (walletKey: string, isEagerly?: boolean) => Promise<void> = useCallback(
    async (walletKey: string, isEagerly = false) => {
      const wallet = (SUPPORTED_WALLETS as any)[walletKey]
      if (!isEVMWallet(wallet)) return
      try {
        console.info('Activate EVM start', { walletKey, isEagerly })
        if (isEagerly) {
          if (wallet.connector.connectEagerly) {
            await wallet.connector.connectEagerly()
            console.info('Activate EVM success with .connectEagerly()', {
              walletKey,
              isEagerly,
              'wallet.connector': wallet.connector,
            })
          } else {
            await wallet.connector.activate()
            console.info('Activate EVM success with .activate()', { walletKey, isEagerly })
          }
        } else {
          await wallet.connector.activate()
          console.info('Activate EVM success with .activate()', { walletKey, isEagerly })
        }
        localStorage.setItem(LOCALSTORAGE_LAST_WALLETKEY_EVM, walletKey)
      } catch (error) {
        console.error('Activate EVM failed:', { walletKey, wallet, error, isEagerly })
        localStorage.removeItem(LOCALSTORAGE_LAST_WALLETKEY_EVM)
        const e = new Error(`[Wallet] ${error.message}`)
        e.name = 'Activate EVM failed'
        e.stack = ''
        captureException(e, {
          level: 'warning',
          extra: { error, walletKey, isEagerly },
        })
        throw error
      }
    },
    [],
  )

  const tryActivationSolana: (walletKey: string) => Promise<void> = useCallback(
    async (walletKey: string) => {
      const wallet = (SUPPORTED_WALLETS as any)[walletKey]
      if (!isSolanaWallet(wallet)) return

      try {
        localStorage.removeItem(LOCALSTORAGE_LAST_WALLETKEY_SOLANA)
        await select(wallet.adapter.name)
        localStorage.setItem(LOCALSTORAGE_LAST_WALLETKEY_SOLANA, walletKey)
      } catch (error) {
        localStorage.removeItem(LOCALSTORAGE_LAST_WALLETKEY_SOLANA)
        const e = new Error(`[Wallet] ${error.message}`)
        e.name = 'Activate Solana failed'
        e.stack = ''
        captureException(e, {
          level: 'warning',
          extra: { error, walletKey },
        })
        console.error('Activate Solana failed:', { walletKey, wallet, error })
        throw error
      }
    },
    [select],
  )

  const tryActivation: (walletKey: string, isEagerly?: boolean) => Promise<void> = useCallback(
    async (walletKey: string, isEagerly = false) => {
      const wallet = (SUPPORTED_WALLETS as any)[walletKey]
      if (isEVM && isEVMWallet(wallet) && !wallet.href) {
        await tryActivationEVM(walletKey, isEagerly)
      }
      if (isSolana && isSolanaWallet(wallet) && wallet.adapter !== solanaWallet?.adapter) {
        await tryActivationSolana(walletKey)
      }
    },
    [isSolana, isEVM, solanaWallet?.adapter, tryActivationEVM, tryActivationSolana],
  )

  return {
    tryActivation,
  }
}
