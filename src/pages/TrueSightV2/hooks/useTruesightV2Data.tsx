import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/dist/query/react'

import { TRUESIGHT_V2_API } from 'constants/env'

import { testParams } from '../pages/SingleToken'
import { INetflowToWhaleWallets, INumberOfTrades, ITokenOverview, ITradeVolume } from '../types'
import { FUNDING_RATE, HOLDER_LIST, NETFLOW_TO_WHALE_WALLETS, TOKEN_LIST } from './sampleData'

const truesightV2Api = createApi({
  reducerPath: 'truesightV2Api',
  baseQuery: fetchBaseQuery({
    baseUrl: TRUESIGHT_V2_API,
  }),
  endpoints: builder => ({
    tokenDetail: builder.query<ITokenOverview, string>({
      query: (tokenAddress?: string) => ({
        url: '/overview/ethereum/' + tokenAddress,
      }),
    }),
    numberOfTrades: builder.query<INumberOfTrades[], string>({
      query: (tokenAddress?: string) => ({
        url: '/trades/ethereum/' + tokenAddress,
        params: {
          from: testParams.from,
          to: testParams.to,
        },
      }),
      transformResponse: (res: any) => res.data,
    }),
    tradingVolume: builder.query({
      query: (tokenAddress?: string) => ({
        url: '/volume/ethereum/' + tokenAddress,
        params: {
          from: testParams.from,
          to: testParams.to,
        },
      }),
      transformResponse: (res: any) => {
        const parsedData: {
          buy: number
          sell: number
          buyVolume: number
          sellVolume: number
          timestamp: number
        }[] = []
        res.data.buy.forEach((item: ITradeVolume, index: number) => {
          parsedData.push({
            buy: item.numberOfTrade || 0,
            buyVolume: item.tradeVolume || 0,
            timestamp: item.timestamp || 0,
            sell: res.data.sell[index].numberOfTrade || 0,
            sellVolume: res.data.sell[index].tradeVolume || 0,
          })
        })
        return parsedData
      },
    }),
    netflowToWhaleWallets: builder.query<INetflowToWhaleWallets[], string>({
      query: (tokenAddress?: string) => ({
        url: '/netflow/ethereum/0xdefa4e8a7bcba345f687a2f1456f5edd9ce97202?from=1669867147&to=1672372747',
      }),
      transformResponse: (res: any) => res.data.contents,
    }),
    netflowToCEX: builder.query({
      query: () => ({
        url: '/netflow/cexes',
      }),
      transformResponse: (res: any) => NETFLOW_TO_WHALE_WALLETS,
    }),
    numberOfTransfers: builder.query({
      query: () => ({
        url: '/holdersNum/ethereum/0xdac17f958d2ee523a2206206994597c13d831ec7?from=1633344036&to=1675215565',
      }),
      transformResponse: (res: any) => res.data,
    }),
    numberOfHolders: builder.query({
      query: () => ({
        url: '/holdersNum/ethereum/0xdac17f958d2ee523a2206206994597c13d831ec7?from=1633344036&to=1675215565',
      }),
      transformResponse: (res: any) => res.data,
    }),
    holderList: builder.query({
      query: () => ({
        url: '/holders/ethereum/0xdac17f958d2ee523a2206206994597c13d831ec7?from=1633344036&to=1675215565',
      }),
      transformResponse: (res: any) => HOLDER_LIST,
    }),
    fundingRate: builder.query({
      query: () => ({
        url: '/holders/ethereum/C/BTC',
      }),
      transformResponse: (res: any) => FUNDING_RATE,
    }),
    tokenList: builder.query({
      query: () => ({
        url: '/holders/ethereum/C/BTC',
      }),
      transformResponse: (res: any) => TOKEN_LIST,
    }),
  }),
})

export const {
  useTokenDetailQuery,
  useNumberOfTradesQuery,
  useTradingVolumeQuery,
  useNetflowToWhaleWalletsQuery,
  useNetflowToCEXQuery,
  useNumberOfTransfersQuery,
  useNumberOfHoldersQuery,
  useHolderListQuery,
  useFundingRateQuery,
  useTokenListQuery,
} = truesightV2Api

export default truesightV2Api
