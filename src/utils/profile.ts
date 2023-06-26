import { EMPTY_OBJECT } from 'constants/index'

export const ProfileLocalStorageKeys = {
  PROFILE_INFO: 'profileInfo',
  /** sub item*/
  CONNECTED_ACCOUNT: 'account',
  CONNECTED_METHOD: 'method',
  PROFILE: 'profile',
  IMPORT_TOKENS_LOCAL_STORAGE_KEY: 'import_tokens',
}

export const getProfileLocalStorage = (key: string) => {
  const info: { [key: string]: any } = JSON.parse(localStorage.getItem(ProfileLocalStorageKeys.PROFILE_INFO) || '{}')
  return info?.[key]
}

export const setProfileLocalStorage = (key: string, value: any) => {
  const info: { [key: string]: any } = JSON.parse(localStorage.getItem(ProfileLocalStorageKeys.PROFILE_INFO) || '{}')
  localStorage.setItem(ProfileLocalStorageKeys.PROFILE_INFO, JSON.stringify({ ...info, [key]: value }))
}

export const getConnectedProfile = () => {
  const connectedMethod = getProfileLocalStorage(ProfileLocalStorageKeys.CONNECTED_METHOD)
  const connectedAccount = getProfileLocalStorage(ProfileLocalStorageKeys.CONNECTED_ACCOUNT)
  return { connectedMethod, connectedAccount }
}

export const setConnectedProfile = (account: string | undefined, method: string) => {
  setProfileLocalStorage(ProfileLocalStorageKeys.CONNECTED_ACCOUNT, account)
  setProfileLocalStorage(ProfileLocalStorageKeys.CONNECTED_METHOD, method)
}

type TokenByAccount = Record<string /* account */, string /* import token */>

const getImportTokens = () => {
  return getProfileLocalStorage(ProfileLocalStorageKeys.IMPORT_TOKENS_LOCAL_STORAGE_KEY) || EMPTY_OBJECT
}

const saveImportTokens = (tokenByAccount: TokenByAccount) => {
  setProfileLocalStorage(ProfileLocalStorageKeys.IMPORT_TOKENS_LOCAL_STORAGE_KEY, tokenByAccount)
}

export const getImportToken = (account: string): string | undefined => {
  const importTokens = getImportTokens()
  return importTokens[account]
}

export const saveImportToken = (account: string, importToken: string) => {
  const importTokens = getImportTokens()
  importTokens[account] = importToken

  saveImportTokens(importTokens)
}

export const removeImportToken = (account: string) => {
  const importTokens = getImportTokens()
  delete importTokens[account]

  saveImportTokens(importTokens)
}