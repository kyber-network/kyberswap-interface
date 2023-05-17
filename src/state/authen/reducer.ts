import { createReducer } from '@reduxjs/toolkit'

import { updatePossibleWalletAddress, updateProcessingLogin, updateProfile } from './actions'

export type UserProfile = {
  email: string
  identityId: string
  telegramUsername: string
  data: { hasAccessToKyberAI: boolean }
}
export interface AuthenState {
  readonly possibleConnectedWalletAddress: null | string | undefined // null is checking
  readonly anonymousUserInfo: UserProfile | undefined
  readonly userInfo: UserProfile | undefined
  readonly isLogin: boolean
  readonly pendingAuthentication: boolean
}

const DEFAULT_AUTHEN_STATE: AuthenState = {
  possibleConnectedWalletAddress: null,
  anonymousUserInfo: undefined,
  userInfo: undefined,
  isLogin: false,
  pendingAuthentication: true,
}

export default createReducer(DEFAULT_AUTHEN_STATE, builder =>
  builder
    .addCase(updatePossibleWalletAddress, (state, { payload: possibleConnectedWalletAddress }) => {
      state.possibleConnectedWalletAddress = possibleConnectedWalletAddress
    })
    .addCase(updateProcessingLogin, (state, { payload: processing }) => {
      state.pendingAuthentication = processing
    })
    .addCase(updateProfile, (state, { payload: { profile, isAnonymous } }) => {
      if (isAnonymous) {
        state.anonymousUserInfo = profile
        state.userInfo = undefined
      } else {
        state.userInfo = profile
        state.anonymousUserInfo = undefined
      }
      state.isLogin = !isAnonymous
    }),
)
