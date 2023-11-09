import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Flex } from 'rebass'

import BaseTransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { useAppSelector } from 'state/hooks'
import { setAttemptingTxn, setShowPendingModal, setTxError, setTxnHash } from 'state/myEarnings/actions'

const TransactionConfirmationModal = () => {
  const dispatch = useDispatch()

  const showPendingModal = useAppSelector(state => state.myEarnings.showPendingModal)
  const txnHash = useAppSelector(state => state.myEarnings.txnHash)
  const attemptingTxn = useAppSelector(state => state.myEarnings.attemptingTxn)
  const collectFeeError = useAppSelector(state => state.myEarnings.txError)
  const pendingText = useAppSelector(state => state.myEarnings.pendingText)

  const handleDismiss = useCallback(() => {
    dispatch(setShowPendingModal(false))
    dispatch(setTxnHash(''))
    dispatch(setAttemptingTxn(false))
    dispatch(setTxError(''))
  }, [dispatch])

  useEffect(() => {
    return handleDismiss
  }, [handleDismiss])

  return (
    <BaseTransactionConfirmationModal
      isOpen={showPendingModal}
      onDismiss={handleDismiss}
      hash={txnHash}
      attemptingTxn={attemptingTxn}
      pendingText={pendingText}
      content={() => (
        <Flex flexDirection={'column'} width="100%">
          {collectFeeError ? <TransactionErrorContent onDismiss={handleDismiss} message={collectFeeError} /> : null}
        </Flex>
      )}
    />
  )
}

export default TransactionConfirmationModal
