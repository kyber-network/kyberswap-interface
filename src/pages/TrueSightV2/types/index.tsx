export interface IKyberScoreChart {
  tag: string
  price: number
  kyberScore: number
  createdAt: number
}

export interface ITokenOverview {
  assetId: number
  address: string
  symbol: string
  logo: string
  decimals: number
  chain: string
  description: string
  webs: string[]
  communities: string[]
  tags: string[]
  atl: number
  ath: number
  '24hVolume': number
  price: number
  price24hChangePercent: number
  '24hLow': number
  '24hHigh': number
  '1yLow': number
  '1yHigh': number
  circulatingSupply: number
  marketCap: number
  numberOfHolders: number
  kyberScore: {
    score: number
    label: string
    ks3d: Array<{ tag: string; price: number; kyber_score: number; created_at: number }>
  }
}

export interface IAssetOverview {
  addresses: { chain: string; address: string }[]
  tags: string[]
  name: string
  symbol: string
  decimals: number
  logo: string
  description: string
  webs: string[]
  communities: string[]
  price: number
  price24hChangePercent: number
  '24hLow': number
  '24hHigh': number
  '1yLow': number
  '1yHigh': number
  atl: number
  ath: number
  '24hVolume': number
  circulatingSupply: number
  marketCap: number
  numberOfHolders: number
  kyberScore: {
    score: number
    label: string
    ks3d: Array<IKyberScoreChart>
  }
  cmcId: string
  cgkId: string
}

export interface ITokenList {
  symbol: string
  name: string
  assetId: string
  addresses: Array<{ address: string; chain: string }>
  logo: string
  price: number
  priceChange24H: number
  volume24H: number
  weekPrices: Array<{ value: number; timestamp: number }>
  fundingRate: number
  fundingRateExtra: {
    symbol: string
    symbolLogo: string
    uMarginList: { exchangeLogo: string; exchangeName: string; rate: number }[]
  }
  kyberScore: number
  kyberScore3D?: Array<IKyberScoreChart>
  kyberScoreDelta: number
  prevKyberScore: number
  kyberScoreTag: string
  marketCap: number
  cexNetflow24H: number
  cexNetflow3D: number
  discoveredOn?: number
}

export interface INumberOfTrades {
  buy: number
  sell: number
  timestamp: number
}
export interface ITradeVolume {
  numberOfTrade: number
  tradeVolume: number
  timestamp: number
}
export interface INetflowToWhaleWallets {
  whaleType: string
  inflow: number
  outflow: number
  netflow: number
  timestamp: number
}

export interface INetflowToCEX {
  cex: string
  inflow: number
  outflow: number
  netflow: number
  timestamp: number
}
export interface INumberOfTransfers {
  numberOfTransfer: number
  timestamp: number
  volume: number
}
export interface INumberOfHolders {
  count: number
  timestamp: number
}
export interface IHolderList {
  address: string
  percentage: number
  quantity: number
}
export interface IFundingRate {
  exchangeName: string
  timestamp: number
  rate: number
  symbol: string
}

export interface ITokenSearchResult {
  name: string
  symbol: string
  logo: string
  assetId: string
  price: number
  priceChange24h: number
  kyberScore?: {
    score: number
    label: string
  }
}

export interface ICustomWatchlists {
  id: number
  name: string
  assetNumber: number
  assetIds: number[] | null
  identityId?: string
  updatedAt?: string
  createdAt?: string
}

export interface IPagination {
  page: number
  pageSize: number
  totalItems: number
}

export interface OHLCData {
  close: number
  high: number
  open: number
  low: number
  volume24H: number
  timestamp: number
}

export interface ITradingVolume {
  buy: number
  sell: number
  buyVolume: number
  sellVolume: number
  timestamp: number
  totalVolume: number
  totalTrade: number
}

export interface ILiquidCEX {
  buyVolUsd: number
  sellVolUsd: number
  timestamp: number
  exchanges: Array<{ exchangeName: string; buyVolUsd: number; sellVolUsd: number }>
  price: number
}

export interface ILiveTrade {
  amountToken: string
  price: number
  timestamp: number
  trader: string
  traderType: string
  txn: string
  type: string
}

export interface ISRLevel {
  timestamp: number
  value: number
}

export enum DiscoverTokenTab {
  TechnicalAnalysis = 'Technical Analysis',
  OnChainAnalysis = 'On-Chain Analysis',
  LiquidityAnalysis = 'Liquidity Analysis',
}

export enum ChartTab {
  First = 0,
  Second = 1,
  Third = 2,
}

export enum KyberAITimeframe {
  ONE_HOUR = '1h',
  FOUR_HOURS = '4h',
  ONE_DAY = '1d',
  THREE_DAY = '3d',
  FOUR_DAY = '4d',
  ONE_WEEK = '7d',
  ONE_MONTH = '1m',
  THREE_MONTHS = '3m',
  SIX_MONTHS = '6m',
}

export enum ParticipantStatus {
  WHITELISTED = 'WHITELISTED',
  WAITLISTED = 'WAITLISTED',
  UNKNOWN = 'UNKNOWN',
}

export type ParticipantInfo = {
  id: number
  referralCode: string
  status: ParticipantStatus
  rankNo: number
  updatedAt: number
  createdAt: number
}

export enum KyberAIListType {
  ALL = 'all',
  MYWATCHLIST = 'my_watchlist',
  BULLISH = 'bullish',
  BEARISH = 'bearish',
  TRENDING = 'trending',
  TOP_CEX_INFLOW = 'top_cex_inflow',
  TOP_CEX_OUTFLOW = 'top_cex_outflow',
  TOP_TRADED = 'top_traded',
  TRENDING_SOON = 'trendingsoon',
  FUNDING_RATE = 'funding_rate',
  KYBERSWAP_DELTA = 'kyber_score_delta',
}

export type QueryTokenParams = {
  type?: KyberAIListType
  chain?: string
  page?: number
  pageSize?: number
  watchlist?: string
  keywords?: string
  sort?: string
}
