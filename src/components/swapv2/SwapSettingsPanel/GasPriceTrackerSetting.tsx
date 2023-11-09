import { Trans } from '@lingui/macro'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { ChevronRight } from 'react-feather'
import styled from 'styled-components'

import { TextDashed } from 'components/Tooltip'
import useGasPriceFromDeBank, { GasLevel } from 'hooks/useGasPriceFromDeBank'
import useTheme from 'hooks/useTheme'

type Props = {
  onClick: () => void
}

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  cursor: pointer;
`

const Group = styled.div`
  display: flex;
  align-items: center;
`

const Separator = styled.span`
  margin-left: 4px;
  margin-right: 4px;
`

const PriceInWei = styled.span`
  color: ${({ theme }) => theme.text};
  font-size: ${isMobile ? '14px' : '12px'};
  font-weight: 400;
  line-height: 16px;
`

const PriceInUSD = styled.span`
  color: ${({ theme }) => theme.subText};
  font-size: ${isMobile ? '14px' : '12px'};
  font-weight: 400;
  line-height: 16px;
`

const getPriceInGweiText = (value: number | undefined) => {
  return value ? `${value} gwei` : '-'
}

const getPriceInUSDText = (value: string | undefined) => {
  return value ? `$${value}` : '-'
}

const GasPriceTrackerSetting: React.FC<Props> = ({ onClick }) => {
  const data = useGasPriceFromDeBank()
  const theme = useTheme()

  if (!data) {
    return null
  }

  return (
    <Container onClick={onClick}>
      <TextDashed fontSize={12} fontWeight={400} color={theme.subText} underlineColor={theme.border}>
        <Trans>Gas Price Tracker</Trans>
      </TextDashed>

      <Group>
        <PriceInWei>{getPriceInGweiText(data[GasLevel.NORMAL].gasPriceInGwei)}</PriceInWei>
        <Separator>|</Separator>
        <PriceInUSD>{getPriceInUSDText(data[GasLevel.NORMAL].minimumTxFeeInUSD)}</PriceInUSD>
        <ChevronRight size={20} color={theme.subText} />
      </Group>
    </Container>
  )
}

export default GasPriceTrackerSetting
