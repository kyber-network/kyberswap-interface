import { Trans, t } from '@lingui/macro'
import { useMemo } from 'react'
import { Flex, Text } from 'rebass'

import { ReactComponent as LiquidityIcon } from 'assets/svg/liquidity_icon.svg'
import { ButtonAction } from 'components/Button'
import { DataEntry } from 'components/EarningPieChart'
import Icon from 'components/Icons/Icon'
import LocalLoader from 'components/LocalLoader'
import { TokenLogoWithChain } from 'components/Logo'
import Row from 'components/Row'
import Table, { TableColumn } from 'components/Table'
import { EMPTY_ARRAY } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { TokenAllocationChart } from 'pages/MyEarnings/EarningsBreakdownPanel'
import { PortfolioWalletBalance, PortfolioWalletBalanceMap } from 'pages/NotificationCenter/Portfolio/type'
import { Section } from 'pages/TrueSightV2/components'
import { ExternalLink } from 'theme'
import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'

export const LiquidityScore = () => {
  const theme = useTheme()
  return (
    <Flex alignItems={'center'} justifyContent={'center'} sx={{ gap: '6px' }} color={theme.primary}>
      <LiquidityIcon />
      <Trans>High Liquidity</Trans>
    </Flex>
  )
}

const TokenCell = ({ item }: { item: PortfolioWalletBalance }) => {
  const theme = useTheme()
  return (
    <Row gap="8px">
      <TokenLogoWithChain chainId={item.chainId} size={'24px'} tokenLogo={item.logoUrl} />
      <Text fontSize={'14px'} fontWeight={'500'} color={theme.text}>
        {item.symbol}
      </Text>
    </Row>
  )
}

const columns: TableColumn<PortfolioWalletBalance>[] = [
  { title: t`Token`, dataIndex: 'token', align: 'left', render: TokenCell },
  {
    title: t`Liquidity Score`,
    tooltip: (
      <Trans>
        Liquidity Score of a token refers to how easily that token can be bought or sold in the market without
        significantly impacting its price. Read more <ExternalLink href="/todo">here ↗</ExternalLink>
      </Trans>
    ),
    dataIndex: 'test',
    render: LiquidityScore,
  },
  {
    title: t`Balance`,
    dataIndex: 'amount',
    render: ({ value, item }) =>
      formatDisplayNumber(uint256ToFraction(value, item.decimals), { style: 'decimal', significantDigits: 6 }), // todo uint256ToFraction
  },
  {
    title: t`Value`,
    dataIndex: 'amountUsd',
    render: ({ value }) => formatDisplayNumber(value, { style: 'currency', fractionDigits: 2 }),
  },
  {
    title: t`Asset Ratio`,
    align: 'right',
    dataIndex: 'percent',
    render: ({ value }) => formatDisplayNumber(value, { style: 'percent', fractionDigits: 2 }),
  },
]

export default function TokenAllocation({
  balances,
  totalBalanceUsd = 0,
  loading,
}: {
  totalBalanceUsd: number
  loading: boolean
  balances: PortfolioWalletBalanceMap | undefined
}) {
  const data: DataEntry[] = useMemo(() => {
    if (!balances) return EMPTY_ARRAY
    const mapData = Object.values(balances)
      .flat()
      .map(el => {
        return { ...el, percent: +el.amountUsd / totalBalanceUsd, value: el.amountUsd }
      })

    return mapData
  }, [balances, totalBalanceUsd])

  const theme = useTheme()
  return (
    <Section
      title={
        <Text color={theme.subText}>
          <Trans>Token Allocation</Trans>
        </Text>
      }
      actions={
        <ButtonAction>
          <Icon id="share" size={14} />
        </ButtonAction>
      }
    >
      <Row gap="16px" align="flex-start">
        <TokenAllocationChart
          style={{ background: 'transparent' }}
          {...{
            data,
            isLoading: loading,
            horizontalLayout: false,
            numberOfTokens: data.length,
            totalUsd: totalBalanceUsd,
            border: false,
          }}
        />
        {loading ? (
          <LocalLoader />
        ) : (
          <Table data={data as any} columns={columns} style={{ flex: 1 }} totalItems={data.length} pageSize={6} /> // todo
        )}
      </Row>
    </Section>
  ) // todo update SectionWrapper can reuse
}
