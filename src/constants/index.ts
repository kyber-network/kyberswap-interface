import { ChainId, Percent } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import JSBI from 'jsbi'
import { v4 as uuid } from 'uuid'

import { TransactionFlowState } from 'types/TransactionFlowState'

import { CAMPAIGN_BASE_URL } from './env'
import * as ENV from './env'
import { EVM_MAINNET_NETWORKS, EVM_NETWORK, NETWORKS_INFO, SUPPORTED_NETWORKS, isEVM } from './networks'

export const EMPTY_OBJECT: any = {}
export const EMPTY_ARRAY: any[] = []
export const EMPTY_FUNCTION = () => {
  // empty
}

export const BAD_RECIPIENT_ADDRESSES: Set<string> = new Set(
  EVM_MAINNET_NETWORKS.map(chainId => [
    ...Object.values(NETWORKS_INFO[chainId].classic.static || {}),
    ...Object.values(NETWORKS_INFO[chainId].classic.oldStatic || {}),
    ...Object.values(NETWORKS_INFO[chainId].classic.dynamic || {}),
    ...Object.values(NETWORKS_INFO[chainId].classic.fairlaunchV2 || {}),
    ...Object.values(NETWORKS_INFO[chainId].elastic.farms || {}),
    ...Object.values(NETWORKS_INFO[chainId].elastic.farmV2S || {}),
    ...([
      NETWORKS_INFO[chainId].classic.claimReward,
      NETWORKS_INFO[chainId].elastic.coreFactory,
      NETWORKS_INFO[chainId].elastic.nonfungiblePositionManager,
      NETWORKS_INFO[chainId].elastic.tickReader,
      NETWORKS_INFO[chainId].elastic.quoter,
      NETWORKS_INFO[chainId].elastic.routers,
      NETWORKS_INFO[chainId].elastic.farmv2Quoter,
      NETWORKS_INFO[chainId].kyberDAO?.staking,
      NETWORKS_INFO[chainId].kyberDAO?.dao,
      NETWORKS_INFO[chainId].kyberDAO?.rewardsDistributor,
      NETWORKS_INFO[chainId].kyberDAO?.KNCAddress,
      NETWORKS_INFO[chainId].kyberDAO?.KNCLAddress,
    ].filter(s => typeof s === 'string') as string[]),
  ]).flat(),
)

export class AbortedError extends Error {}
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const ZERO_ADDRESS_SOLANA = 'zeroooooooooooooooooooooooooooooooooooooooo'

const DMM_ANALYTICS = 'https://analytics.kyberswap.com/classic'

export const DMM_ANALYTICS_URL: { [chainId in ChainId]: string } = SUPPORTED_NETWORKS.reduce((acc, cur) => {
  if (isEVM(cur))
    return {
      ...acc,
      [cur]: `${DMM_ANALYTICS}/${NETWORKS_INFO[cur].route}`,
    }
  return {
    ...acc,
    [cur]: `${DMM_ANALYTICS}`,
  }
}, {}) as { [chainId in ChainId]: string }

const PROMM_ANALYTICS = 'https://analytics.kyberswap.com/elastic'
export const AGGREGATOR_ANALYTICS_URL = 'https://secure.holistics.io/dashboards/v3/55952?_pl=672a0e4ff266f14541b8f54b'

export const PROMM_ANALYTICS_URL: { [chainId in ChainId]: string } = SUPPORTED_NETWORKS.reduce((acc, cur) => {
  if (isEVM(cur))
    return {
      ...acc,
      [cur]:
        cur === ChainId.AURORA
          ? `${DMM_ANALYTICS}/${NETWORKS_INFO[cur].route}`
          : `${PROMM_ANALYTICS}/${NETWORKS_INFO[cur].route}`,
    }
  return {
    ...acc,
    [cur]: `${PROMM_ANALYTICS}`,
  }
}, {}) as { [chainId in ChainId]: string }

export const BLOCKS_PER_YEAR = (chainId: EVM_NETWORK): number =>
  Math.floor((60 / NETWORKS_INFO[chainId].averageBlockTimeInSeconds) * 60 * 24 * 365)

export const SECONDS_PER_YEAR = 31556926

// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 50
// 20 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 20
// denominated in seconds
export const TIME_TO_REFRESH_SWAP_RATE = 10

export const BIG_INT_ONE = JSBI.BigInt(1)
export const BIG_INT_ZERO = JSBI.BigInt(0)

// one basis point
export const ONE_BIPS = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))
export const BIPS_BASE = JSBI.BigInt(10000)
// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(JSBI.BigInt(300), BIPS_BASE) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(JSBI.BigInt(500), BIPS_BASE) // 5%

// for non degen mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_DEGEN: Percent = new Percent(JSBI.BigInt(1500), BIPS_BASE) // 15%

export const BUNDLE_ID = '1'

export const COINGECKO_BFF_API_URL = `${ENV.BFF_API}/v1/coingecko/api/v3`
export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

export const ETHER_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
export const ETHER_ADDRESS_SOLANA = 'So11111111111111111111111111111111111111111'

export const KYBER_NETWORK_DISCORD_URL = 'https://discord.com/invite/NB3vc8J9uv'
export const KYBER_NETWORK_TWITTER_URL = 'https://twitter.com/KyberNetwork'

export const DEFAULT_GAS_LIMIT_MARGIN = 20000

// This variable to handle crazy APR which it can be wrong calculations or a bug
// But now, for FOMO of Pagxy, updated this to 10000 (before we set 2000 for it)
export const MAX_ALLOW_APY = 10000
export const RESERVE_USD_DECIMALS = 100
export const DEFAULT_SIGNIFICANT = 6
export const SUBGRAPH_AMP_MULTIPLIER = 10000
export const AMP_LIQUIDITY_HINT = t`AMP factor x Liquidity in the pool. Amplified pools have higher capital efficiency and liquidity.`
export const AMP_HINT = t`Stands for amplification factor. Each pool can have its own AMP. Pools with a higher AMP provide higher capital efficiency within a particular price range.`
export const CREATE_POOL_AMP_HINT = t`Stands for amplification factor. Pools with a higher AMP provide higher capital efficiency within a particular price range. We recommend higher AMP for stable token pairs and lower AMP for volatile token pairs.`

export const sentryRequestId = uuid()

export const CAMPAIGN_LEADERBOARD_ITEM_PER_PAGE = 10
export const CAMPAIGN_YOUR_TRANSACTIONS_ITEM_PER_PAGE = 10000

export const ELASTIC_BASE_FEE_UNIT = 100_000
export const KYBERSWAP_SOURCE = '{"source":"kyberswap"}'

export const SWR_KEYS = {
  getGrantProgramLeaderBoard: (id: number | string) => `${CAMPAIGN_BASE_URL}/api/v1/competitions/${id}/leaderboard`,
  getListGrantPrograms: `${CAMPAIGN_BASE_URL}/api/v1/competitions`,
  getGrantProgram: (id: number | string) => `${CAMPAIGN_BASE_URL}/api/v1/competitions/${id}`,
}

// https://www.nasdaq.com/glossary/b/bip
export const MAX_NORMAL_SLIPPAGE_IN_BIPS = 1999
export const MAX_DEGEN_SLIPPAGE_IN_BIPS = 5000
export const DEFAULT_SLIPPAGES = [5, 10, 50, 100]

export const DEFAULT_SLIPPAGE = 50
export const DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP = 5

export const AGGREGATOR_WAITING_TIME = 1700 // 1700 means that we at least show '.' '..' '...' '.' '..' '...'

export const APP_PATHS = {
  ABOUT: '/about',
  SWAP: '/swap',
  PARTNER_SWAP: '/partner-swap',
  CAMPAIGN: '/campaigns',
  FIND_POOL: '/find',
  POOLS: '/pools',
  CLASSIC_CREATE_POOL: '/create',
  CLASSIC_ADD_LIQ: '/add',
  CLASSIC_REMOVE_POOL: '/remove',
  ELASTIC_CREATE_POOL: '/elastic/add',
  ELASTIC_INCREASE_LIQ: '/elastic/increase',
  ELASTIC_REMOVE_POOL: '/elastic/remove',
  FARMS: '/farms',
  MY_POOLS: '/myPools',
  MY_EARNINGS: '/my-earnings',
  DISCOVER: '/discover',
  KYBERAI: '/KyberAI',
  KYBERAI_ABOUT: '/KyberAI/About',
  KYBERAI_RANKINGS: '/KyberAI/Rankings',
  KYBERAI_EXPLORE: '/KyberAI/Explore',
  BUY_CRYPTO: '/buy-crypto',
  BRIDGE: '/bridge',
  CROSS_CHAIN: '/cross-chain',
  KYBERDAO: '/kyberdao',
  KYBERDAO_STAKE: '/kyberdao/stake-knc',
  KYBERDAO_VOTE: '/kyberdao/vote',
  KYBERDAO_KNC_UTILITY: '/kyberdao/knc-utility',
  LIMIT: '/limit',
  GRANT_PROGRAMS: '/inter-project-trading-campaigns',
  PROFILE_MANAGE: '/manage',
  ELASTIC_LEGACY: '/elastic-legacy',
  VERIFY_AUTH: '/auth',

  IAM_LOGIN: '/login',
  IAM_LOGOUT: '/logout',
  IAM_CONSENT: '/consent',

  PORTFOLIO: '/portfolios',
  PROFILE: '/profiles',
} as const

export const TERM_FILES_PATH = {
  KYBERSWAP_TERMS: '/files/Kyber - Terms of Service - 1 August 2023.pdf',
  PRIVACY_POLICY: '/files/Kyber - Privacy Policy - 23 Aug 2023.pdf',
  // Timestamp of changed date, update this to latest timestamp whenever change any above files. This also used to check on client side for updated to force user to disconnect and re-accept terms.
  VERSION: 1692748800000,
}

export enum FARM_TAB {
  ACTIVE = 'active',
  ENDED = 'ended',
  MY_FARMS = 'my_farms',
  VESTING = 'vesting',
}

export enum ELASTIC_FARM_TYPE {
  ALL = 'all',
  DYNAMIC = 'dynamic',
  STATIC = 'static',
}

export const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
]

export const INPUT_DEBOUNCE_TIME = 300

export const ENABLE_CLICK_TO_REFRESH_GET_ROUTE = false

export const TIMES_IN_SECS = {
  ONE_DAY: 86400,
  ONE_HOUR: 3600,
  ONE_MIN: 60,
}

export const RTK_QUERY_TAGS = {
  // announcement
  GET_PRIVATE_ANN_BY_ID: 'GET_PRIVATE_ANN_BY_ID',
  GET_ALL_PRIVATE_ANN: 'GET_ALL_PRIVATE_ANN',
  GET_TOTAL_UNREAD_PRIVATE_ANN: 'GET_TOTAL_UNREAD_PRIVATE_ANN',
  GET_ALL_TOPICS_GROUP: 'GET_ALL_TOPICS_GROUP',

  // price alert
  GET_ALERTS: 'GET_ALERTS',
  GET_ALERTS_HISTORY: 'GET_ALERTS_HISTORY',
  GET_ALERTS_STAT: 'GET_ALERTS_STAT',

  // cross chain
  GET_CROSS_CHAIN_HISTORY: 'GET_CROSS_CHAIN_HISTORY',
  GET_BRIDGE_HISTORY: 'GET_BRIDGE_HISTORY',

  // kyber ai
  GET_PARTICIPANT_INFO_KYBER_AI: 'GET_PARTICIPANT_INFO_KYBER_AI',
  GET_WATCHLIST_TOKENS_KYBER_AI: 'GET_WATCHLIST_TOKENS_KYBER_AI',
  GET_WATCHLIST_INFO_KYBER_AI: 'GET_WATCHLIST_INFO_KYBER_AI',
  GET_TOKEN_OVERVIEW_KYBER_AI: 'GET_TOKEN_OVERVIEW_KYBER_AI',
  GET_TOKEN_LIST_KYBER_AI: 'GET_TOKEN_LIST_KYBER_AI',

  // limit order
  GET_LIST_ORDERS: 'GET_LIST_ORDERS',

  GET_FARM_V2: 'GET_FARM_V2',

  // portfolio
  GET_LIST_PORTFOLIO: 'GET_LIST_PORTFOLIO',
}

export const TRANSACTION_STATE_DEFAULT: TransactionFlowState = {
  showConfirm: false,
  attemptingTxn: false,
  errorMessage: '',
  txHash: undefined,
  pendingText: '',
}

export const CHAINS_SUPPORT_FEE_CONFIGS = [ChainId.AURORA, ChainId.CRONOS]
export const CHAINS_SUPPORT_CROSS_CHAIN =
  ENV.ENV_KEY === ENV.EnvKeys.PROD || ENV.ENV_KEY === ENV.EnvKeys.STG
    ? [
        ChainId.MAINNET,
        ChainId.BSCMAINNET,
        ChainId.MATIC,
        ChainId.AVAXMAINNET,
        ChainId.ARBITRUM,
        ChainId.OPTIMISM,
        ChainId.FANTOM,
        ChainId.LINEA,
        ChainId.BASE,
        ChainId.SCROLL,
      ]
    : SUPPORTED_NETWORKS

export const TYPE_AND_SWAP_NOT_SUPPORTED_CHAINS: ChainId[] = [
  ChainId.ZKSYNC,
  ChainId.LINEA,
  ChainId.ZKEVM,
  ChainId.BASE,
  ChainId.SCROLL,
]

export const SWAP_FEE_RECEIVER_ADDRESS = '0x4f82e73EDb06d29Ff62C91EC8f5Ff06571bdeb29'

export const TOKEN_SCORE_TTL = 86400

export const AGGREGATOR_API_PATHS = {
  BUILD_ROUTE: '/api/v1/route/build',
  GET_ROUTE: '/api/v1/routes',
}

export const ICON_IDS = [
  'truesight-v2',
  'notification-2',
  'bullish',
  'bearish',
  'trending-soon',
  'flame',
  'download',
  'upload',
  'coin-bag',
  'check',
  'pig',
  'speaker',
  'share',
  'liquid-outline',
  'refund',
  'swap',
  'copy',
  'open-link',
  'star',
  'fullscreen',
  'leaderboard',
  'liquid',
  'alarm',
  'on-chain',
  'technical-analysis',
  'liquidity-analysis',
  'news',
  'arrow',
  'chart',
  'lightbulb',
  'info',
  'question',
  'timer',
  'search',
  'devices',
  'eth-mono',
  'ava-mono',
  'bnb-mono',
  'matic-mono',
  'fantom-mono',
  'optimism-mono',
  'arbitrum-mono',
  'telegram',
  'twitter',
  'facebook',
  'discord',
  'assignment',
  'drag-indicator',
  'pencil',
  'trash',
] as const
export type ICON_ID = typeof ICON_IDS[number]

export const FRAX_FARMS: { [chainId in ChainId]?: string[] } = {
  [ChainId.MAINNET]: [
    '0xe5379f5ee90d70a0f9de0ed8b3cdde3b9427524a',
    '0xfd7b111aa83b9b6f547e617c7601efd997f64703',
    '0x36240069ff26cecbde04d9e49a2af8d39146263e',
  ],
  [ChainId.MATIC]: ['0xa5ebdde0f2e657d77bebeda085dd49f6decf8504'],
  [ChainId.ARBITRUM]: ['0x6a7dccf168fba624a81b293c2538d31427b5b4bd'],
  [ChainId.OPTIMISM]: ['0xa837d04a64acf66912d05cfd9b951e4e399ab680'],
}

export enum SORT_DIRECTION {
  ASC = 'asc',
  DESC = 'desc',
}
