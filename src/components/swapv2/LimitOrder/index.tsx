import { t } from '@lingui/macro'
import { memo, useState } from 'react'

import { TutorialKeys } from 'components/Tutorial/TutorialSwap'
import Tutorial from 'components/swapv2/LimitOrder/Tutorial'
import { APP_PATHS, TRANSACTION_STATE_DEFAULT } from 'constants/index'
import useSyncTokenSymbolToUrl from 'hooks/useSyncTokenSymbolToUrl'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { TransactionFlowState } from 'types/TransactionFlowState'

import LimitOrderForm from './LimitOrderForm'

type Props = {
  setIsSelectCurrencyManual: (v: boolean) => void
  isSelectCurrencyManual: boolean
}

function LimitOrderComp({ setIsSelectCurrencyManual, isSelectCurrencyManual }: Props) {
  const { onSelectPair } = useLimitActionHandlers()

  const { currencyIn, currencyOut } = useLimitState()

  const isPartnerSwap = window.location.pathname.startsWith(APP_PATHS.PARTNER_SWAP)
  useSyncTokenSymbolToUrl(currencyIn, currencyOut, onSelectPair, isSelectCurrencyManual, isPartnerSwap)

  const [showTutorial, setShowTutorial] = useState(!localStorage.getItem(TutorialKeys.SHOWED_LO_GUIDE))

  // modal and loading
  const [flowState, setFlowState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)
  if (showTutorial)
    return (
      <Tutorial
        onClose={() => {
          setShowTutorial(false)
          localStorage.setItem(TutorialKeys.SHOWED_LO_GUIDE, '1')
        }}
      />
    )

  return (
    <div style={{ padding: '16px' }}>
      <LimitOrderForm
        flowState={flowState}
        setFlowState={setFlowState}
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        setIsSelectCurrencyManual={setIsSelectCurrencyManual}
        note={
          currencyOut?.isNative
            ? t`Note: Once your order is filled, you will receive ${currencyOut?.wrapped.name} (${currencyOut?.wrapped.symbol})`
            : undefined
        }
      />
    </div>
  )
}

export default memo(LimitOrderComp)
