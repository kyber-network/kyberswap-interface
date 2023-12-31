import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { NETWORKS_INFO } from 'constants/networks'
import {
  setClaimingCampaignRewardId,
  setRecaptchaCampaignId,
  setRecaptchaCampaignLoading,
  setSelectedCampaignLeaderboardLookupAddress,
  setSelectedCampaignLeaderboardPageNumber,
} from 'state/campaigns/actions'
import { AppState } from 'state/index'

export function useSelectedCampaignLeaderboardPageNumberManager(): [number, (page: number) => void] {
  const selectedCampaignLeaderboardPageNumber = useSelector(
    (state: AppState) => state.campaigns.selectedCampaignLeaderboardPageNumber,
  )
  const dispatch = useDispatch()

  const updateSelectedCampaignLeaderboardPageNumberCallback = useCallback(
    (newPageNumber: number) => {
      dispatch(setSelectedCampaignLeaderboardPageNumber(newPageNumber))
    },
    [dispatch],
  )

  return [selectedCampaignLeaderboardPageNumber, updateSelectedCampaignLeaderboardPageNumberCallback]
}

export function useSelectedCampaignLeaderboardLookupAddressManager() {
  const selectedCampaignLeaderboardLookupAddress = useSelector(
    (state: AppState) => state.campaigns.selectedCampaignLeaderboardLookupAddress,
  )
  const dispatch = useDispatch()

  const updateSelectedCampaignLeaderboardLookupAddressCallback = useCallback(
    (newLookupAddress: string) => {
      dispatch(setSelectedCampaignLeaderboardLookupAddress(newLookupAddress))
    },
    [dispatch],
  )

  return useMemo(
    () => [selectedCampaignLeaderboardLookupAddress, updateSelectedCampaignLeaderboardLookupAddressCallback] as const,
    [selectedCampaignLeaderboardLookupAddress, updateSelectedCampaignLeaderboardLookupAddressCallback],
  )
}

export function useRecaptchaCampaignManager() {
  const recaptchaCampaign = useSelector((state: AppState) => state.campaigns.recaptchaCampaign)
  const dispatch = useDispatch()

  const updateRecaptchaCampaignId = useCallback(
    (id: number | undefined) => {
      dispatch(setRecaptchaCampaignId(id))
    },
    [dispatch],
  )

  const updateRecaptchaCampaignLoading = useCallback(
    (loading: boolean) => {
      dispatch(setRecaptchaCampaignLoading(loading))
    },
    [dispatch],
  )

  return useMemo(
    () => [recaptchaCampaign, updateRecaptchaCampaignId, updateRecaptchaCampaignLoading] as const,
    [recaptchaCampaign, updateRecaptchaCampaignId, updateRecaptchaCampaignLoading],
  )
}

export function useSwapNowHandler() {
  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)
  const navigate = useNavigate()

  return useCallback(
    (chainId: ChainId) => {
      let path = `/swap/${NETWORKS_INFO[chainId].route}?`
      if (selectedCampaign?.eligibleTokens?.length) {
        const firstTokenOfChain = selectedCampaign.eligibleTokens.find(token => token.chainId === chainId)
        if (firstTokenOfChain) {
          path += 'outputCurrency=' + firstTokenOfChain.address
        }
      }
      navigate(path)
    },
    [navigate, selectedCampaign],
  )
}

export function useSetClaimingCampaignRewardId(): [number | null, (id: number | null) => void] {
  const { claimingCampaignRewardId } = useSelector((state: AppState) => state.campaigns)
  const dispatch = useDispatch()

  const setClaimingRewardId = useCallback(
    (id: number | null) => {
      dispatch(setClaimingCampaignRewardId(id))
    },
    [dispatch],
  )

  return [claimingCampaignRewardId, setClaimingRewardId]
}
