import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { CSSProperties, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Info } from 'react-feather'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import Icon from 'components/Icons/Icon'
import InfoHelper from 'components/InfoHelper'
import AnimatedLoader from 'components/Loader/AnimatedLoader'
import Pagination from 'components/Pagination'
import Row, { RowFit } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { NETWORK_IMAGE_URL, NETWORK_TO_CHAINID, Z_INDEX_KYBER_AI } from 'pages/TrueSightV2/constants'
import useKyberAIAssetOverview from 'pages/TrueSightV2/hooks/useKyberAIAssetOverview'
import { useFundingRateQuery, useHolderListQuery, useLiveDexTradesQuery } from 'pages/TrueSightV2/hooks/useKyberAIData'
import { TechnicalAnalysisContext } from 'pages/TrueSightV2/pages/TechnicalAnalysis'
import { IHolderList, ILiveTrade, ITokenList, KyberAITimeframe } from 'pages/TrueSightV2/types'
import {
  calculateValueToColor,
  colorFundingRateText,
  formatLocaleStringNum,
  formatTokenPrice,
  navigateToSwapPage,
} from 'pages/TrueSightV2/utils'
import { ExternalLink } from 'theme'
import { getEtherscanLink, shortenAddress } from 'utils'
import { getProxyTokenLogo } from 'utils/tokenInfo'

import ChevronIcon from '../ChevronIcon'
import { WidgetTab } from '../KyberAIWidget'
import MultipleChainDropdown from '../MultipleChainDropdown'
import SmallKyberScoreMeter from '../SmallKyberScoreMeter'
import TimeFrameLegend from '../TimeFrameLegend'
import TokenChart from '../TokenChartSVG'
import TokenListVariants from '../TokenListVariants'
import WatchlistButton from '../WatchlistButton'

const TableWrapper = styled.div`
  overflow-x: scroll;
  border-radius: 6px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    border-radius: 0;
    margin: -16px;
  `}
`
const Table = styled.table`
  border-collapse: collapse;
  min-width: 100%;
  thead {
    font-size: 12px;
    line-height: 16px;
    font-weight: 500;
    white-space: nowrap;
    color: ${({ theme }) => theme.subText};
    text-transform: uppercase;
    tr {
      height: 48px;
      background: ${({ theme }) => theme.buttonGray};
    }
    th {
      text-align: left;
      padding: 16px;
    }
  }

  tr {
    height: 72px;
    border-spacing: 1px;
    background-color: ${({ theme }) => theme.background};
    td {
      padding: 16px;
    }
  }
  tr:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.border};
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    tr{
      td, th{
        padding: 12px 16px;
        font-size: 12px;
      }
    }
  `}
`

const ActionButton = styled.div<{ color: string; hasBg?: boolean }>`
  display: flex;
  align-items: center;
  font-size: 12px;
  line-height: 16px;
  gap: 4px;
  padding: 6px;
  border-radius: 50%;
  background-color: ${({ theme, hasBg }) => (hasBg ? theme.subText + '32' : 'none')};
  cursor: pointer;
  ${({ theme, color }) => css`
    color: ${color || theme.primary};
  `}
  :hover {
    filter: brightness(0.9);
  }
  :active {
    filter: brightness(1.2);
  }
`

const StyledLoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
`

export const LoadingHandleWrapper = ({
  isLoading,
  isFetching,
  hasData,
  children,
  height,
  minHeight,
  style,
}: {
  isLoading: boolean
  isFetching?: boolean
  hasData: boolean
  children: ReactNode
  height?: string
  minHeight?: string
  style?: CSSProperties
}) => {
  return (
    <TableWrapper style={{ ...style }}>
      <Table style={{ opacity: isFetching ? 0.4 : 1 }}>
        {!hasData ? (
          <tr style={{ backgroundColor: 'unset' }}>
            <StyledLoadingWrapper style={{ height: height, minHeight: minHeight }}>
              {isLoading ? (
                <AnimatedLoader />
              ) : (
                <Column gap="14px" alignItems="center">
                  <Info size="38px" />
                  <Text fontSize="14px">
                    <Trans>We couldn&apos;t find any information for this token.</Trans>
                  </Text>
                </Column>
              )}
            </StyledLoadingWrapper>
          </tr>
        ) : (
          <>{children}</>
        )}
      </Table>
    </TableWrapper>
  )
}

export const Top10HoldersTable = () => {
  const theme = useTheme()
  const { data: tokenOverview, chain, address } = useKyberAIAssetOverview()
  const { data, isLoading } = useHolderListQuery({ address, chain }, { skip: !chain || !address })
  return (
    <LoadingHandleWrapper isLoading={isLoading} hasData={!!data && data.length > 0} height="400px">
      <colgroup>
        <col style={{ width: '300px', minWidth: '150px' }} />
        <col style={{ width: '300px' }} />
        <col style={{ width: '300px' }} />
      </colgroup>
      <thead>
        <tr>
          <th style={{ position: 'sticky', zIndex: Z_INDEX_KYBER_AI.HEADER_TABLE_TOKENS }}>
            <Trans>Address</Trans>
          </th>
          <th>
            <Trans>Supply owned</Trans>
          </th>
          <th>
            <Trans>Amount held</Trans>
          </th>
        </tr>
      </thead>
      <tbody>
        {data?.slice(0, 10).map((item: IHolderList, i: number) => (
          <tr key={i}>
            <td style={{ position: 'sticky', zIndex: Z_INDEX_KYBER_AI.HEADER_TABLE_TOKENS }}>
              <Column gap="4px">
                <Text fontSize="14px" lineHeight="20px" color={theme.text}>
                  {shortenAddress(1, item.address)}
                </Text>
                <RowFit gap="12px">
                  <ActionButton color={theme.subText} style={{ padding: '6px 0' }}>
                    <CopyHelper toCopy={item.address} text="Copy" size={16} />
                  </ActionButton>
                  <ActionButton
                    color={theme.subText}
                    style={{ padding: '6px 0' }}
                    onClick={() => {
                      chain &&
                        window.open(getEtherscanLink(NETWORK_TO_CHAINID[chain], item.address, 'address'), '_blank')
                    }}
                  >
                    <Icon id="open-link" size={16} /> <Trans>Explore</Trans>
                  </ActionButton>
                </RowFit>
              </Column>
            </td>
            <td>
              <Text fontSize="14px" lineHeight="20px" color={theme.text}>
                {(item.percentage * 100).toPrecision(4)}%
              </Text>
            </td>
            <td>
              <Text fontSize="14px" lineHeight="20px" color={theme.text}>
                {tokenOverview &&
                  item.quantity &&
                  formatLocaleStringNum(
                    +formatUnits(
                      BigNumber.from(item.quantity.toLocaleString('fullwide', { useGrouping: false })),
                      tokenOverview.decimals,
                    ),
                    0,
                  )}
              </Text>
            </td>
          </tr>
        ))}
      </tbody>
    </LoadingHandleWrapper>
  )
}

const formatLevelValue = (value: number): string => {
  if (value > 1000) return (+value.toFixed(2)).toLocaleString()
  return value.toPrecision(5)
}

const timeframesSRLevels = [
  KyberAITimeframe.ONE_HOUR,
  KyberAITimeframe.FOUR_HOURS,
  KyberAITimeframe.ONE_DAY,
  KyberAITimeframe.FOUR_DAY,
]

export const SupportResistanceLevel = () => {
  const theme = useTheme()
  const { SRLevels, currentPrice, resolution, setResolution } = useContext(TechnicalAnalysisContext)
  const [supports, resistances] = useMemo(() => {
    if (!SRLevels || !currentPrice) return []

    return [
      SRLevels?.filter(level => level.value < currentPrice).sort((a, b) => b.value - a.value),
      SRLevels?.filter(level => level.value > currentPrice).sort((a, b) => a.value - b.value),
    ]
  }, [SRLevels, currentPrice])
  const maxLength = Math.max(supports?.length || 0, resistances?.length || 0, 6)

  const handleTimeframeSelect = useCallback((t: KyberAITimeframe) => setResolution?.(t as string), [setResolution])

  return (
    <TableWrapper>
      <Table>
        <colgroup>
          <col width="300px" style={{ minWidth: '100px' }} />
          {Array(maxLength)
            .fill('')
            .map((_, index) => (
              <col key={index} width="300px" />
            ))}
        </colgroup>
        <thead>
          <tr>
            <th>
              <Trans>Type</Trans>
            </th>
            <th>
              <Trans>Levels</Trans>
            </th>
            <>
              {Array(maxLength - 2)
                .fill('')
                .map((_, index) => (
                  <th key={index} />
                ))}
            </>
            <th>
              <Row justify="flex-end">
                <div style={{ width: '180px' }}>
                  <TimeFrameLegend
                    selected={resolution}
                    timeframes={timeframesSRLevels}
                    onSelect={handleTimeframeSelect}
                  />
                </div>
              </Row>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <>
              <td>
                <Text color={theme.primary} fontSize="14px">
                  Support
                </Text>
              </td>
              {Array(maxLength)
                .fill('')
                .map((i, index) => (
                  <td key={index} style={{ alignItems: 'flex-start' }}>
                    <Text color={theme.text} fontSize="14px" lineHeight="20px">
                      {supports?.[index] && currentPrice && `${formatLevelValue(supports[index].value)}`}
                    </Text>
                    <Text color={theme.apr} fontSize="12px" lineHeight="16px">
                      {supports?.[index] && currentPrice
                        ? (((supports[index].value - currentPrice) / currentPrice) * 100).toFixed(2) + '%'
                        : '--'}
                    </Text>
                  </td>
                ))}
            </>
          </tr>
          <tr>
            <>
              <td>
                <Text color={theme.red} fontSize="14px">
                  Resistance
                </Text>
              </td>
              {Array(maxLength)
                .fill('')
                .map((i, index) => (
                  <td key={index} style={{ alignItems: 'flex-start' }}>
                    <Text color={theme.text} fontSize="14px" lineHeight="20px">
                      {resistances?.[index] && currentPrice && `${formatLevelValue(resistances[index].value)} `}
                    </Text>
                    <Text color={theme.red} fontSize="12px" lineHeight="16px">
                      {resistances?.[index] && currentPrice
                        ? (((resistances[index].value - currentPrice) / currentPrice) * 100).toFixed(2) + '%'
                        : '--'}
                    </Text>
                  </td>
                ))}
            </>
          </tr>
        </tbody>
      </Table>
    </TableWrapper>
  )
}

export const FundingRateTable = ({ mobileMode }: { mobileMode?: boolean }) => {
  const theme = useTheme()
  const { chain, address } = useKyberAIAssetOverview()
  const { data, isLoading } = useFundingRateQuery({ address, chain }, { skip: !chain || !address })

  if (mobileMode) {
    return (
      <LoadingHandleWrapper isLoading={isLoading} hasData={!!data} height="300px">
        <thead>
          <tr style={{ height: '50px' }}>
            <td>CEX</td>
            <td style={{ textAlign: 'right' }}>Funding Rate</td>
          </tr>
        </thead>
        <tbody>
          {data?.uMarginList?.slice(0, 5).map((i: any) => (
            <tr key={i.exchangeName} style={{ height: '50px' }}>
              <td>
                <Row gap="4px">
                  <img alt={i.exchangeName} src={i.exchangeLogo} style={{ height: '18px', width: '18px' }} />
                  <Text color={theme.text}>{i.exchangeName}</Text>
                </Row>
              </td>
              <td>
                <Row justify="flex-end">
                  <Text color={colorFundingRateText(i.rate, theme)} fontSize="14px" lineHeight="20px" fontWeight={500}>
                    {i.rate ? i.rate.toFixed(4) + '%' : '--'}
                  </Text>
                </Row>
              </td>
            </tr>
          ))}
        </tbody>
      </LoadingHandleWrapper>
    )
  }
  return (
    <LoadingHandleWrapper isLoading={isLoading} hasData={!!data} height="200px">
      <colgroup>
        <col />
        {Array(data?.uMarginList?.length)
          .fill(1)
          .map((_, index) => (
            <col key={index} style={{ width: '150px' }} />
          ))}
      </colgroup>
      <thead>
        <tr>
          <th></th>
          {data?.uMarginList?.map((i: any) => (
            <th key={i.exchangeName}>
              <Row gap="4px">
                <img alt={i.exchangeName} src={i.exchangeLogo} style={{ height: '18px', width: '18px' }} />
                <Text color={theme.text}>{i.exchangeName}</Text>
              </Row>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <Row gap="4px">
              <img alt={data?.symbol} src={data?.symbolLogo} style={{ height: '40px' }} />
              <Column gap="4px">
                <Text color={theme.text} fontSize="14px">
                  {data?.symbol}
                </Text>
              </Column>
            </Row>
          </td>
          {data?.uMarginList?.map((i: any) => (
            <td key={i.exchangeName}>
              <Text color={colorFundingRateText(i.rate, theme)} fontSize="14px" lineHeight="20px" fontWeight={500}>
                {i.rate ? i.rate.toFixed(4) + '%' : '--'}
              </Text>
            </td>
          ))}
        </tr>
      </tbody>
    </LoadingHandleWrapper>
  )
}

export const LiveDEXTrades = () => {
  const theme = useTheme()
  const [currentPage, setCurrentPage] = useState(1)
  const { data: tokenOverview, chain, address } = useKyberAIAssetOverview()

  const { data, isLoading } = useLiveDexTradesQuery(
    {
      chain,
      address,
    },
    { pollingInterval: 10000, skip: !chain || !address },
  )

  return (
    <>
      <LoadingHandleWrapper isLoading={isLoading} hasData={!!data && data.length > 0} height="500px">
        <colgroup>
          <col width="50px" />
          <col width="100px" />
          <col width="200px" />
          <col width="260px" />
          <col width="200px" />
          <col width="100px" />
        </colgroup>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Price ($)</th>
            <th>Amount</th>
            <th>Trader</th>
            <th style={{ textAlign: 'right' }}>Transaction</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px', lineHeight: '20px' }}>
          {data?.slice((currentPage - 1) * 10, currentPage * 10).map((trade: ILiveTrade, i: number) => {
            const isBuy = trade.type === 'buy'
            return (
              <tr key={i}>
                <td>
                  <Text>{dayjs(trade.timestamp * 1000).format('DD/MM/YYYY')}</Text>
                  <Text fontSize={12} color={theme.subText}>
                    {dayjs(trade.timestamp * 1000).format('HH:mm:ss A')}
                  </Text>
                </td>
                <td>
                  <Text color={isBuy ? theme.primary : theme.red} style={{ textTransform: 'capitalize' }}>
                    {trade.type}
                  </Text>
                </td>
                <td>${formatLocaleStringNum(trade.price, 6)}</td>
                <td>
                  <Row gap="6px">
                    <img src={tokenOverview?.logo} width="16px" height="16px" style={{ borderRadius: '8px' }} />
                    <Text color={isBuy ? theme.primary : theme.red} style={{ whiteSpace: 'nowrap' }}>
                      {isBuy ? '+' : '-'} {formatLocaleStringNum(+trade.amountToken)} {tokenOverview?.symbol}
                    </Text>
                    {trade.price * +trade.amountToken > 100000 && (
                      <InfoHelper text={t`This transaction is higher than >$100k`} placement="top" />
                    )}
                  </Row>
                  <Text color={theme.subText} fontSize={12}>
                    ${formatLocaleStringNum(trade.price * +trade.amountToken)}{' '}
                  </Text>
                </td>
                <td>
                  <ExternalLink
                    href={chain ? getEtherscanLink(NETWORK_TO_CHAINID[chain], trade.trader, 'address') : '#'}
                  >
                    <Text color={theme.primary}>{shortenAddress(1, trade.trader)}</Text>
                  </ExternalLink>
                </td>
                <td>
                  <Row justify="flex-end" gap="8px">
                    <ActionButton color={theme.subText} hasBg>
                      <CopyHelper toCopy={trade.txn} style={{ marginLeft: 0 }} />
                    </ActionButton>
                    <ActionButton color={theme.subText} hasBg>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={chain ? getEtherscanLink(NETWORK_TO_CHAINID[chain], trade.txn, 'transaction') : '#'}
                      >
                        <Icon id="open-link" size={16} />
                      </a>
                    </ActionButton>
                  </Row>
                </td>
              </tr>
            )
          })}
        </tbody>
      </LoadingHandleWrapper>
      <Pagination
        currentPage={currentPage}
        pageSize={10}
        totalCount={data?.length || 10}
        onPageChange={page => setCurrentPage(page)}
      />
    </>
  )
}

const WidgetTableWrapper = styled(Table)`
  width: 100%;
  thead {
    th {
      padding: 8px 16px;
    }
  }
  tr {
    background-color: ${({ theme }) => theme.tableHeader};
    cursor: pointer;
    td {
      padding: 8px 16px;
    }
    :hover {
      background-color: ${({ theme }) => theme.background + '50'};
    }
  }
`

const WidgetTokenRow = ({
  token,
  onClick,
}: // activeTab,
// index,
{
  token: ITokenList
  onClick?: () => void
  activeTab: WidgetTab
  index: number
}) => {
  const theme = useTheme()
  const navigate = useNavigate()

  const hasMutipleChain = token?.addresses?.length > 1
  const [showSwapMenu, setShowSwapMenu] = useState(false)

  const rowRef = useRef<HTMLTableRowElement>(null)

  useOnClickOutside(rowRef, () => setShowSwapMenu(false))
  const tokens = token.addresses || []

  const handleRowClick = () => {
    navigate(`${APP_PATHS.KYBERAI_EXPLORE}/${token.assetId}?chain=${tokens[0].chain}&address=${tokens[0].address}`)
    onClick?.()
  }

  const handleSwapClick = (e: any) => {
    e.stopPropagation()
    if (hasMutipleChain) {
      setShowSwapMenu(true)
    } else {
      navigateToSwapPage({ address: tokens[0].address, chain: tokens[0].chain })
    }
  }

  const handleSwapNavigateClick = (chain: string, address: string) => {
    navigateToSwapPage({ address, chain })
  }

  return (
    <tr onClick={handleRowClick} style={{ position: 'relative' }} ref={rowRef}>
      {isMobile ? (
        <>
          <td>
            <Column gap="4px">
              <RowFit gap="6px">
                <WatchlistButton assetId={token.assetId} symbol={token.symbol} />
                <img alt="tokenInList" src={token.logo} width="24px" height="24px" style={{ borderRadius: '12px' }} />
                <Column gap="2px" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
                  <Text fontSize="14px" style={{ textTransform: 'uppercase' }}>
                    {token.symbol}
                  </Text>{' '}
                  <RowFit gap="6px" color={theme.text}>
                    <TokenListVariants tokens={token.addresses} iconSize={10} />
                  </RowFit>
                </Column>
              </RowFit>
              <Text color={theme.text} fontSize="14px" lineHeight="20px">
                ${formatTokenPrice(token.price)}
              </Text>
              <Text fontSize="10px" lineHeight="12px" color={token.priceChange24H > 0 ? theme.primary : theme.red}>
                <Row gap="2px">
                  <ChevronIcon
                    rotate={token.priceChange24H > 0 ? '180deg' : '0deg'}
                    color={token.priceChange24H > 0 ? theme.primary : theme.red}
                  />
                  {Math.abs(token.priceChange24H).toFixed(2)}%
                </Row>
              </Text>
            </Column>
          </td>
        </>
      ) : (
        <>
          <td>
            <RowFit gap="6px">
              <WatchlistButton assetId={token.assetId} symbol={token.symbol} />
              <Row gap="8px" style={{ position: 'relative', width: '24px', height: '24px' }}>
                <img alt="tokenInList" src={token.logo} width="24px" height="24px" style={{ borderRadius: '12px' }} />
                <Column gap="4px" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
                  <Text style={{ textTransform: 'uppercase' }}>{token.symbol}</Text>{' '}
                  <RowFit gap="6px" color={theme.text}>
                    <TokenListVariants tokens={token.addresses} />
                  </RowFit>
                </Column>
              </Row>
            </RowFit>
          </td>
          <td>
            <Column style={{ alignItems: 'center', width: '110px' }}>
              <SmallKyberScoreMeter token={token} disabledTooltip={token.symbol === 'KNC'} />
              <Text color={calculateValueToColor(token.kyberScore || 0, theme)} fontSize="14px" fontWeight={500}>
                {token?.kyberScoreTag || t`Not Applicable`}
              </Text>
            </Column>
          </td>
          <td>
            <Column gap="4px" style={{ textAlign: 'left' }}>
              <Text color={theme.text} fontSize="14px" lineHeight="20px">
                ${formatTokenPrice(token.price)}
              </Text>
              <Text fontSize="10px" lineHeight="12px" color={token.priceChange24H > 0 ? theme.primary : theme.red}>
                <Row gap="2px">
                  <ChevronIcon
                    rotate={token.priceChange24H > 0 ? '180deg' : '0deg'}
                    color={token.priceChange24H > 0 ? theme.primary : theme.red}
                  />
                  {Math.abs(token.priceChange24H).toFixed(2)}%
                </Row>
              </Text>
            </Column>
          </td>
        </>
      )}
      <td>
        <TokenChart data={token.weekPrices} index={token.addresses[0].address} width={isMobile ? '100%' : ''} />
      </td>
      <td>
        <Row justifyContent="flex-end">
          <ButtonLight height="28px" width="75px" padding="4px 8px" onClick={handleSwapClick}>
            <RowFit gap="4px" fontSize="14px">
              <Icon id="swap" size={16} />
              Swap
            </RowFit>
          </ButtonLight>
        </Row>
      </td>
      {hasMutipleChain && (
        <>
          <MultipleChainDropdown show={showSwapMenu} tokens={token?.addresses} onChainClick={handleSwapNavigateClick} />
        </>
      )}
    </tr>
  )
}

export const WidgetTable = ({
  data,
  isLoading,
  isError,
  onRowClick,
  activeTab,
}: {
  data?: ITokenList[]
  isLoading: boolean
  isError: boolean
  onRowClick?: () => void
  activeTab: WidgetTab
}) => {
  const theme = useTheme()
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'scroll' }}>
      <WidgetTableWrapper style={{ borderRadius: '0' }}>
        <colgroup>
          <col style={{ width: '220px' }} />
          <col style={{ width: '160px' }} />
          <col style={{ width: '200px' }} />
          <col style={{ width: '130px' }} />
          <col style={{ width: '80px' }} />
        </colgroup>
        <thead style={{ backgroundColor: theme.background }}>
          <tr>
            <th>
              <Trans>Token</Trans>
            </th>
            <th>
              <Trans>KyberScore</Trans>
            </th>
            <th>
              <Trans>Price | 24 Change</Trans>
            </th>
            <th>
              <Trans>Last 7 days</Trans>
            </th>
            <th style={{ textAlign: 'right' }}>
              <Trans>Action</Trans>
            </th>
          </tr>
        </thead>
        {isLoading ? (
          <tbody>
            <SkeletonTheme
              baseColor={theme.border}
              height="32px"
              borderRadius="8px"
              direction="ltr"
              duration={1.5}
              highlightColor={theme.tabActive}
            >
              {[
                ...Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <tr key={index} style={{ backgroundColor: theme.tableHeader, height: '72px' }}>
                      <td>
                        <Skeleton></Skeleton>
                      </td>
                      <td>
                        <Skeleton></Skeleton>
                      </td>
                      <td>
                        <Skeleton></Skeleton>
                      </td>
                      <td>
                        <Skeleton></Skeleton>
                      </td>
                      <td>
                        <Skeleton></Skeleton>
                      </td>
                    </tr>
                  )),
              ]}
            </SkeletonTheme>
          </tbody>
        ) : isError ? (
          <>
            <tbody>
              <tr style={{ height: '300px' }}>
                <td colSpan={5}>
                  <Row align="center" justify="center" height="70%">
                    <Trans>There was an error. Please try again later.</Trans>
                  </Row>
                </td>
              </tr>
            </tbody>
          </>
        ) : (
          <tbody>
            {data?.map((token, i) => {
              return <WidgetTokenRow token={token} key={i} onClick={onRowClick} activeTab={activeTab} index={i + 1} />
            })}
          </tbody>
        )}
      </WidgetTableWrapper>
    </div>
  )
}
export const WidgetMobileTable = ({
  data,
  isLoading,
  isError,
  onRowClick,
  activeTab,
}: {
  data?: ITokenList[]
  isLoading: boolean
  isError: boolean
  onRowClick?: () => void
  activeTab: WidgetTab
}) => {
  const theme = useTheme()
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'scroll' }}>
      <WidgetTableWrapper style={{ borderRadius: '0' }}>
        <colgroup>
          <col style={{ width: '140px' }} />
          <col style={{ width: '140px' }} />
          <col style={{ width: '60px' }} />
        </colgroup>
        {isLoading && !data ? (
          <tbody>
            <SkeletonTheme
              baseColor={theme.border + '80'}
              height="60px"
              borderRadius="12px"
              direction="ltr"
              duration={1}
              highlightColor={theme.tabActive}
            >
              {[
                ...Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <tr key={index} style={{ backgroundColor: theme.tableHeader, height: '82px' }}>
                      <td>
                        <Skeleton></Skeleton>
                      </td>
                      <td>
                        <Skeleton></Skeleton>
                      </td>
                      <td>
                        <Skeleton></Skeleton>
                      </td>
                    </tr>
                  )),
              ]}
            </SkeletonTheme>
          </tbody>
        ) : isError ? (
          <>
            <tbody>
              <tr style={{ height: '300px' }}>
                <td colSpan={3}>
                  <Row align="center" justify="center" height="70%">
                    <Trans>There was an error. Please try again later.</Trans>
                  </Row>
                </td>
              </tr>
            </tbody>
          </>
        ) : (
          <tbody>
            {data?.map((token, i) => {
              return <WidgetTokenRow token={token} key={i} onClick={onRowClick} activeTab={activeTab} index={i + 1} />
            })}
          </tbody>
        )}
      </WidgetTableWrapper>
    </div>
  )
}

const ShareTableWrapper = styled(Table)`
  margin: 0px !important;
  min-width: inherit;
  tbody tr {
    background-color: transparent !important;
  }
  tr td,
  thead th {
    padding: 14px 10px !important;
  }
`

export const Top10HoldersShareModalTable = ({
  data,
  mobileMode,
  startIndex = 0,
}: {
  data: Array<IHolderList>
  mobileMode?: boolean
  startIndex?: number
}) => {
  const theme = useTheme()
  const { data: tokenOverview } = useKyberAIAssetOverview()

  return (
    <ShareTableWrapper style={{ flex: 1 }}>
      <colgroup>
        {!mobileMode && <col />}
        <col />
        <col />
        <col />
      </colgroup>
      <thead>
        <tr style={{ height: mobileMode ? '52px' : '60px' }}>
          <th>#</th>
          <th>Address</th>
          {!mobileMode && <th>Supply owner</th>}
          <th style={{ textAlign: 'right', padding: '6px' }}>Amount held</th>
        </tr>
      </thead>
      <tbody>
        {data?.map((holder, index) => {
          return (
            <tr key={holder.address} style={{ height: mobileMode ? '52px' : '60px' }}>
              <td>{startIndex + index + 1}</td>
              <td>
                <Text fontSize={14}>{shortenAddress(1, holder.address)}</Text>
              </td>
              {!mobileMode && (
                <td>
                  <Text fontSize={14}>{(holder.percentage * 100).toFixed(2)}%</Text>
                </td>
              )}
              <td>
                <Row justify="flex-end" gap="4px">
                  <Text fontSize={14}>
                    {tokenOverview &&
                      holder.quantity &&
                      formatLocaleStringNum(
                        +formatUnits(
                          BigNumber.from(holder.quantity.toLocaleString('fullwide', { useGrouping: false })),
                          tokenOverview.decimals,
                        ),
                        0,
                      )}
                  </Text>
                  {mobileMode && (
                    <Text fontSize={14} color={theme.subText}>
                      ({(holder.percentage * 100).toFixed(2)}%)
                    </Text>
                  )}
                </Row>
              </td>
            </tr>
          )
        })}
      </tbody>
    </ShareTableWrapper>
  )
}

export const LiveTradesInShareModalTable = ({
  data,
  mobileMode,
}: {
  data: Array<ILiveTrade>
  mobileMode?: boolean
}) => {
  const theme = useTheme()
  const { data: tokenOverview } = useKyberAIAssetOverview()

  return (
    <ShareTableWrapper style={{ flex: 1 }}>
      <colgroup>
        {!mobileMode && <col />}
        <col />
        <col />
        <col />
      </colgroup>
      <thead>
        <tr>
          {!mobileMode && <th>Date</th>}
          <th>Address</th>
          <th>Price ($)</th>
          <th style={{ textAlign: 'right', padding: '6px' }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {data?.map(trade => {
          const isBuy = trade.type === 'buy'
          return (
            <tr key={trade.txn} style={{ height: mobileMode ? '52px' : '60px' }}>
              {!mobileMode && (
                <td>
                  <Text fontSize={14}>{dayjs(trade.timestamp * 1000).format('DD/MM/YYYY')}</Text>
                  <Text fontSize={12} color={theme.subText}>
                    {dayjs(trade.timestamp * 1000).format('HH:mm:ss A')}
                  </Text>
                </td>
              )}
              <td>
                <Text fontSize={14}>{shortenAddress(1, trade.trader)}</Text>
              </td>
              <td>
                <Text fontSize={14}>${formatTokenPrice(trade.price)}</Text>
              </td>
              <td style={{ padding: '6px', textAlign: 'right' }}>
                {mobileMode ? (
                  <>
                    <Text fontSize={14} color={isBuy ? theme.primary : theme.red}>
                      {isBuy ? '+' : '-'} {formatLocaleStringNum(+trade.amountToken)} {tokenOverview?.symbol}
                    </Text>
                  </>
                ) : (
                  <>
                    <Row gap="4px">
                      <img src={tokenOverview?.logo} width="16px" height="16px" style={{ borderRadius: '8px' }} />
                      <Text fontSize={14} color={isBuy ? theme.primary : theme.red}>
                        {isBuy ? '+' : '-'} {formatLocaleStringNum(+trade.amountToken)} {tokenOverview?.symbol}
                      </Text>
                      {trade.price * +trade.amountToken > 100000 && (
                        <InfoHelper text={t`This transaction is higher than >$100k`} placement="top" />
                      )}
                    </Row>
                    <Text color={theme.subText} fontSize={12} textAlign="right">
                      ${formatLocaleStringNum(trade.price * +trade.amountToken)}{' '}
                    </Text>
                  </>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </ShareTableWrapper>
  )
}

export const TokenListInShareModalTable = ({
  data,
  startIndex = 0,
  mobileMode,
}: {
  data: ITokenList[]
  startIndex: number
  mobileMode?: boolean
}) => {
  const theme = useTheme()
  return (
    <ShareTableWrapper>
      <colgroup>
        <col width="30px" />
        <col width="160px" />
        <col width="300px" />
        {!mobileMode && <col width="100px" />}
      </colgroup>
      <thead>
        <tr>
          <th style={{ padding: '16px 0px 16px 10px' }}>#</th>
          <th>
            <Trans>Token Name</Trans>
          </th>
          <th>
            <Trans>Price</Trans>
          </th>
          {!mobileMode && (
            <th>
              <Trans>KyberScore</Trans>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {data.map((token, index) => {
          return (
            <tr key={token.symbol + index} style={{ height: '50px' }}>
              <td style={{ padding: '16px 0px 16px 10px', color: theme.subText }}>{index + 1 + startIndex}</td>
              <td style={{ padding: '10px' }}>
                <RowFit gap="6px" align="center">
                  <img
                    alt="tokenInList"
                    src={getProxyTokenLogo(token.logo)}
                    width="18px"
                    height="18px"
                    loading="lazy"
                    style={{ borderRadius: '18px' }}
                  />
                  <Text>{token.symbol.toUpperCase()}</Text>
                  <RowFit gap="4px" marginLeft="4px">
                    {token.addresses.slice(0, 6).map(item => {
                      const size = token.addresses.length > 6 ? '12px' : '14px'
                      return <img src={NETWORK_IMAGE_URL[item.chain]} key={item.address} width={size} height={size} />
                    })}
                    {token.addresses.length > 6 && <span style={{ fontSize: '10px' }}>...</span>}
                  </RowFit>
                </RowFit>
              </td>
              <td>
                <RowFit>
                  <Text fontSize={formatTokenPrice(token.price).length > 14 ? '14px' : '16px'}>
                    ${formatTokenPrice(token.price)}
                  </Text>
                  <Text fontSize={12} color={token.priceChange24H > 0 ? theme.primary : theme.red}>
                    <Row gap="2px">
                      <ChevronIcon
                        rotate={token.priceChange24H > 0 ? '180deg' : '0deg'}
                        color={token.priceChange24H > 0 ? theme.primary : theme.red}
                      />
                      {Math.abs(token.priceChange24H).toFixed(2)}%
                    </Row>
                  </Text>
                </RowFit>
              </td>
              {!mobileMode && (
                <td style={{ textAlign: 'right' }}>
                  <Text color={calculateValueToColor(token?.kyberScore || 0, theme)}>{token?.kyberScore}</Text>
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </ShareTableWrapper>
  )
}

export const SupportResistanceShareModalTable = ({ mobileMode }: { mobileMode?: boolean }) => {
  const theme = useTheme()
  const { SRLevels, currentPrice } = useContext(TechnicalAnalysisContext)
  const [supports, resistances] = useMemo(() => {
    if (!SRLevels || !currentPrice) return []

    return [
      SRLevels?.filter(level => level.value < currentPrice).sort((a, b) => b.value - a.value),
      SRLevels?.filter(level => level.value > currentPrice).sort((a, b) => a.value - b.value),
    ]
  }, [SRLevels, currentPrice])

  const maxLength = Math.max(supports?.length || 0, resistances?.length || 0)
  if (mobileMode) {
    return (
      <ShareTableWrapper>
        <thead>
          <tr style={{ height: '50px' }}>
            <th>Support</th>
            <th style={{ textAlign: 'right' }}>Resistance</th>
          </tr>
        </thead>
        <tbody>
          {Array(maxLength)
            .fill(0)
            .map((_, index) => {
              return (
                <tr key={index} style={{ height: '50px' }}>
                  <td>
                    <RowFit gap="4px">
                      <Text color={theme.text} fontSize="14px" lineHeight="20px">
                        {supports?.[index] && currentPrice && `${formatLevelValue(supports[index].value)}`}
                      </Text>
                      <Text color={theme.apr} fontSize="12px" lineHeight="16px">
                        (
                        {supports?.[index] && currentPrice
                          ? (((supports[index].value - currentPrice) / currentPrice) * 100).toFixed(2) + '%'
                          : '--'}
                        )
                      </Text>
                    </RowFit>
                  </td>
                  <td style={{ alignContent: '' }}>
                    <Row gap="4px" justify="flex-end">
                      <Text color={theme.text} fontSize="14px" lineHeight="20px">
                        {resistances?.[index] && currentPrice && `${formatLevelValue(resistances[index].value)} `}
                      </Text>
                      <Text color={theme.red} fontSize="12px" lineHeight="16px">
                        {resistances?.[index] && currentPrice
                          ? `(${(((resistances[index].value - currentPrice) / currentPrice) * 100).toFixed(2)}%)`
                          : ''}
                      </Text>
                    </Row>
                  </td>
                </tr>
              )
            })}
        </tbody>
      </ShareTableWrapper>
    )
  }

  return (
    <ShareTableWrapper>
      <colgroup>
        <col width="300px" style={{ minWidth: '100px' }} />
        {Array(maxLength)
          .fill('')
          .map((_, index) => (
            <col key={index} width="300px" />
          ))}
      </colgroup>
      <thead>
        <tr style={{ height: '52px' }}>
          <th>Type</th>
          <>
            {Array(maxLength)
              .fill('')
              .map((i, index) => (
                <th key={index}>{index === 0 && <Trans>Levels</Trans>}</th>
              ))}
          </>
        </tr>
      </thead>
      <tbody>
        <tr style={{ height: '52px' }}>
          <>
            <td>
              <Text color={theme.primary} fontSize="14px">
                Support
              </Text>
            </td>
            {Array(maxLength)
              .fill('')
              .map((i, index) => (
                <td key={index} style={{ alignItems: 'flex-start' }}>
                  <Text color={theme.text} fontSize="14px" lineHeight="20px">
                    {supports?.[index] && currentPrice && `${formatLevelValue(supports[index].value)}`}
                  </Text>
                  <Text color={theme.apr} fontSize="12px" lineHeight="16px">
                    {supports?.[index] && currentPrice
                      ? (((supports[index].value - currentPrice) / currentPrice) * 100).toFixed(2) + '%'
                      : '--'}
                  </Text>
                </td>
              ))}
          </>
        </tr>
        <tr style={{ height: '52px' }}>
          <>
            <td>
              <Text color={theme.red} fontSize="14px">
                Resistance
              </Text>
            </td>
            {Array(maxLength)
              .fill('')
              .map((i, index) => (
                <td key={index} style={{ alignItems: 'flex-start' }}>
                  <Text color={theme.text} fontSize="14px" lineHeight="20px">
                    {resistances?.[index] && currentPrice && `${formatLevelValue(resistances[index].value)} `}
                  </Text>
                  <Text color={theme.red} fontSize="12px" lineHeight="16px">
                    {resistances?.[index] && currentPrice
                      ? (((resistances[index].value - currentPrice) / currentPrice) * 100).toFixed(2) + '%'
                      : '--'}
                  </Text>
                </td>
              ))}
          </>
        </tr>
      </tbody>
    </ShareTableWrapper>
  )
}
