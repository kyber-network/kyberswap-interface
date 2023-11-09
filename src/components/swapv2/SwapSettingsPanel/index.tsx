import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import React, { RefObject, useRef, useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'
import Toggle from 'components/Toggle'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { APP_PATHS } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import {
  useShowKyberAIBanner,
  useShowLiveChart,
  useShowTradeRoutes,
  useToggleKyberAIBanner,
  useToggleLiveChart,
  useToggleTradeRoutes,
} from 'state/user/hooks'

import DegenModeSetting from './DegenModeSetting'
import GasPriceTrackerSetting from './GasPriceTrackerSetting'
import LiquiditySourcesSetting from './LiquiditySourcesSetting'
import SlippageSetting from './SlippageSetting'
import TransactionTimeLimitSetting from './TransactionTimeLimitSetting'

type Props = {
  className?: string
  onBack: () => void
  onClickGasPriceTracker: () => void
  onClickLiquiditySources: () => void
  isLimitOrder?: boolean
  isSwapPage?: boolean
  isCrossChainPage?: boolean
  swapActionsRef: RefObject<HTMLDivElement>
}

const BackText = styled.span`
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const SettingsPanel: React.FC<Props> = ({
  isLimitOrder,
  isSwapPage,
  isCrossChainPage,
  className,
  onBack,
  onClickLiquiditySources,
  onClickGasPriceTracker,
  swapActionsRef,
}) => {
  const theme = useTheme()

  const { mixpanelHandler } = useMixpanel()
  const isShowTradeRoutes = useShowTradeRoutes()
  const isShowLiveChart = useShowLiveChart()
  const isShowKyberAIBanner = useShowKyberAIBanner()
  const toggleLiveChart = useToggleLiveChart()
  const toggleTradeRoutes = useToggleTradeRoutes()
  const toggleKyberAIBanner = useToggleKyberAIBanner()

  const handleToggleLiveChart = () => {
    mixpanelHandler(MIXPANEL_TYPE.LIVE_CHART_ON_OFF, { live_chart_on_or_off: !isShowLiveChart })
    mixpanelHandler(isLimitOrder ? MIXPANEL_TYPE.LO_DISPLAY_SETTING_CLICK : MIXPANEL_TYPE.SWAP_DISPLAY_SETTING_CLICK, {
      display_setting: isShowLiveChart ? 'Live Chart Off' : 'Live Chart On',
    })
    toggleLiveChart()
  }
  const handleToggleTradeRoute = () => {
    mixpanelHandler(MIXPANEL_TYPE.TRADING_ROUTE_ON_OFF, {
      trading_route_on_or_off: !isShowTradeRoutes,
    })
    mixpanelHandler(MIXPANEL_TYPE.SWAP_DISPLAY_SETTING_CLICK, {
      display_setting: isShowTradeRoutes ? 'Trade Route Off' : 'Trade Route On',
    })
    toggleTradeRoutes()
  }

  const [showConfirmation, setShowConfirmation] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  useOnClickOutside([containerRef, swapActionsRef], () => !showConfirmation && onBack())

  const isPartnerSwap = window.location.pathname.includes(APP_PATHS.PARTNER_SWAP)

  return (
    <Box width="100%" className={className} id={TutorialIds.TRADING_SETTING_CONTENT} ref={containerRef}>
      <Flex width={'100%'} flexDirection={'column'} marginBottom="4px">
        <Flex alignItems="center" sx={{ gap: '4px' }}>
          <ChevronLeft onClick={onBack} color={theme.subText} cursor={'pointer'} size={26} />
          <BackText>{t`Settings`}</BackText>
        </Flex>

        <Flex
          sx={{
            marginTop: '22px',
            flexDirection: 'column',
            rowGap: '12px',
            width: '100%',
          }}
        >
          {(isSwapPage || isCrossChainPage) && (
            <>
              <span className="settingTitle">
                <Trans>Advanced Settings</Trans>
              </span>

              <SlippageSetting isCrossChain={isCrossChainPage} />
              {isSwapPage && <TransactionTimeLimitSetting />}
              <DegenModeSetting showConfirmation={showConfirmation} setShowConfirmation={setShowConfirmation} />
              {isSwapPage && (
                <>
                  <GasPriceTrackerSetting onClick={onClickGasPriceTracker} />
                  <LiquiditySourcesSetting onClick={onClickLiquiditySources} />
                </>
              )}
            </>
          )}
          <Flex
            sx={{
              flexDirection: 'column',
              rowGap: '12px',
              paddingTop: '16px',
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <Text
              as="span"
              sx={{
                fontSize: '16px',
                fontWeight: 500,
              }}
            >
              <Trans>Display Settings</Trans>
            </Text>
            <AutoColumn gap="md">
              {!isPartnerSwap && (
                <RowBetween>
                  <RowFixed>
                    <TextDashed fontSize={12} fontWeight={400} color={theme.subText} underlineColor={theme.border}>
                      <MouseoverTooltip text={<Trans>Turn on to display KyberAI banner.</Trans>} placement="right">
                        <Trans>KyberAI Banner</Trans>
                      </MouseoverTooltip>
                    </TextDashed>
                  </RowFixed>
                  <Toggle isActive={isShowKyberAIBanner} toggle={toggleKyberAIBanner} />
                </RowBetween>
              )}
              {!isPartnerSwap && (
                <RowBetween>
                  <RowFixed>
                    <TextDashed fontSize={12} fontWeight={400} color={theme.subText} underlineColor={theme.border}>
                      <MouseoverTooltip text={<Trans>Turn on to display live chart.</Trans>} placement="right">
                        <Trans>Live Chart</Trans>
                      </MouseoverTooltip>
                    </TextDashed>
                  </RowFixed>
                  <Toggle isActive={isShowLiveChart} toggle={handleToggleLiveChart} />
                </RowBetween>
              )}
              {(isSwapPage || isCrossChainPage) && (
                <>
                  <RowBetween>
                    <RowFixed>
                      <TextDashed fontSize={12} fontWeight={400} color={theme.subText} underlineColor={theme.border}>
                        <MouseoverTooltip text={<Trans>Turn on to display trade route.</Trans>} placement="right">
                          <Trans>Trade Route</Trans>
                        </MouseoverTooltip>
                      </TextDashed>
                    </RowFixed>
                    <Toggle isActive={isShowTradeRoutes} toggle={handleToggleTradeRoute} />
                  </RowBetween>
                </>
              )}
            </AutoColumn>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  )
}

export default styled(SettingsPanel)`
  ${Toggle} {
    background: ${({ theme }) => theme.buttonBlack};
    &[data-active='true'] {
      background: ${({ theme }) => rgba(theme.primary, 0.2)};
    }
  }
`
