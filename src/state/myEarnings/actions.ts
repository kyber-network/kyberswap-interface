import { ChainId } from '@kyberswap/ks-sdk-core'
import { createAction } from '@reduxjs/toolkit'

import { VERSION } from 'constants/v2'

export const selectChains = createAction<ChainId[]>('myEarnings/selectChains')
export const toggleShowClosedPositions = createAction('myEarnings/toggleShowClosedPositions')

export const setSearchText = createAction<string>('myEarnings/setSearchText')
export const expandAllPools = createAction('myEarnings/expandAllPools')
export const collapseAllPools = createAction('myEarnings/collapseAllPools')
export const setActiveTab = createAction<VERSION>('myEarnings/setActiveTab')
export const setTxError = createAction<string>('myEarnings/setTxError')
export const setAttemptingTxn = createAction<boolean>('myEarnings/setAttemptingTxn')
export const setTxnHash = createAction<string>('myEarnings/setTxnHash')
export const setShowPendingModal = createAction<string | false>('myEarnings/setShowPendingModal')
