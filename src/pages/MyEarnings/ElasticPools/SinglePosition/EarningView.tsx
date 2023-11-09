import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Logo from 'components/Logo'
import { MouseoverTooltip } from 'components/Tooltip'
import CommonView, { CommonProps } from 'pages/MyEarnings/ElasticPools/SinglePosition/CommonView'
import { Column, Label, Row, Value, ValueAPR } from 'pages/MyEarnings/ElasticPools/SinglePosition/styleds'
import HoverDropdown from 'pages/MyEarnings/HoverDropdown'
import OriginalMyEarningsOverTimePanel from 'pages/MyEarnings/MyEarningsOverTimePanel'
import { calculateEarningStatsTick } from 'pages/MyEarnings/utils'
import { useAppSelector } from 'state/hooks'
import { EarningStatsTick } from 'types/myEarnings'
import { getNativeTokenLogo } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

const MyEarningsOverTimePanel = styled(OriginalMyEarningsOverTimePanel)`
  padding: 0;
  border: none;
  background: unset;
`

const EarningView: React.FC<CommonProps> = props => {
  const { positionEarning, chainId } = props
  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)
  const nativeLogo = getNativeTokenLogo(chainId)

  // format pool value
  const ticks: EarningStatsTick[] | undefined = useMemo(() => {
    return calculateEarningStatsTick({
      data: positionEarning.historicalEarning,
      chainId,
      tokensByChainId: tokensByChainId[chainId],
      nativeLogo,
    })
  }, [chainId, positionEarning.historicalEarning, tokensByChainId, nativeLogo])

  const earningToday = ticks?.[0]

  const myPoolAPR = Number(positionEarning.myPoolApr || '0')
  const myFarmAPR = Number(positionEarning.myFarmApr || '0')

  return (
    <CommonView isEarningView {...props}>
      <Flex
        sx={{
          flexDirection: 'column',
          width: 'fit-content',
          gap: '4px 16px',
        }}
      >
        <Label $hasTooltip>
          <MouseoverTooltip
            text={<Trans>Total earnings from both pool and farm (if applicable).</Trans>}
            placement="top"
          >
            <Trans>Total Earnings</Trans>
          </MouseoverTooltip>
        </Label>

        <HoverDropdown
          disabled={!earningToday?.totalValue}
          anchor={
            <Value>{formatDisplayNumber(earningToday?.totalValue, { style: 'currency', significantDigits: 6 })}</Value>
          }
          text={
            <>
              {earningToday?.tokens.map((token, index) => (
                <Flex
                  alignItems="center"
                  key={index}
                  sx={{
                    gap: '4px',
                  }}
                >
                  <Logo srcs={[token.logoUrl]} style={{ flex: '0 0 16px', height: '16px', borderRadius: '999px' }} />
                  <Text fontSize={12} sx={{ whiteSpace: 'nowrap' }}>
                    {formatDisplayNumber(token.amount, { significantDigits: 6 })} {token.symbol}
                  </Text>
                </Flex>
              ))}
            </>
          }
        />
      </Flex>

      <Column>
        <Row>
          <Label>
            <Trans>My Pool APR</Trans>
          </Label>
          <Label>
            <Trans>My Farm APR</Trans>
          </Label>
        </Row>

        <Row>
          <ValueAPR>{formatDisplayNumber(myPoolAPR / 100, { style: 'percent', fractionDigits: 2 })}</ValueAPR>
          <ValueAPR>{formatDisplayNumber(myFarmAPR / 100, { style: 'percent', fractionDigits: 2 })}</ValueAPR>
        </Row>
      </Column>

      <Flex
        sx={{
          width: '100%',
          flex: '1 0 360px',
        }}
      >
        <MyEarningsOverTimePanel isLoading={false} ticks={ticks} isContainerSmall />
      </Flex>
    </CommonView>
  )
}

export default EarningView
