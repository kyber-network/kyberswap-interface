import { ChainId } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import { HistoricalEarning, TokenEarning } from 'services/earning'

import { TokenAddressMap } from 'state/lists/reducer'
import { EarningStatsTick } from 'types/myEarnings'
import { isAddress } from 'utils'

export const today = Math.floor(Date.now() / 1000 / 86400)

const sumTokenEarnings = (earnings: TokenEarning[]) => {
  return earnings.reduce((sum, tokenEarning) => sum + Number(tokenEarning.amountUSD), 0)
}

export const calculateEarningStatsTick = (
  data: HistoricalEarning['historicalEarning'],
  chainId: ChainId,
  tokensByChainId: TokenAddressMap,
) => {
  if (!data?.length) {
    return undefined
  }

  const ticks: EarningStatsTick[] = data.map(singlePointData => {
    const poolRewardsValueUSD = sumTokenEarnings(singlePointData.fees || [])
    const farmRewardsValueUSD = sumTokenEarnings(singlePointData.rewards || [])

    const tick: EarningStatsTick = {
      date: dayjs(singlePointData.day * 86400 * 1000).format('MMM DD'),
      poolRewardsValue: poolRewardsValueUSD,
      farmRewardsValue: farmRewardsValueUSD,
      totalValue: poolRewardsValueUSD + farmRewardsValueUSD,
      tokens: (singlePointData.total || [])
        .filter(tokenEarning => {
          // TODO: check with native token
          const tokenAddress = isAddress(chainId, tokenEarning.token)
          if (!tokenAddress) {
            return false
          }

          const currency = tokensByChainId[chainId][tokenAddress]
          return !!currency
        })
        .map(tokenEarning => {
          const tokenAddress = isAddress(chainId, tokenEarning.token)
          const currency = tokensByChainId[chainId][String(tokenAddress)]
          return {
            logoUrl: currency.logoURI || '',
            amount: Number(tokenEarning.amountFloat),
            symbol: currency.symbol || 'NO SYMBOL',
          }
        })
        .sort((tokenEarning1, tokenEarning2) => tokenEarning2.amount - tokenEarning1.amount),
    }

    return tick
  })

  // fill ticks for unavailable days
  const latestDay = data[0]?.day || today - 30 // fallback to 30 days ago
  if (latestDay < today) {
    for (let i = latestDay + 1; i <= today; i++) {
      ticks.unshift({
        date: dayjs(i * 86400 * 1000).format('MMM DD'),
        poolRewardsValue: 0,
        farmRewardsValue: 0,
        totalValue: 0,
        tokens: [],
      })
    }
  }

  return ticks
}