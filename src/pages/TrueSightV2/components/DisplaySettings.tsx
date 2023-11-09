import { Trans, t } from '@lingui/macro'
import { useRef, useState } from 'react'
import { Sliders } from 'react-feather'
import { useParams } from 'react-router'
import { Text } from 'rebass'
import styled from 'styled-components'

import Column from 'components/Column'
import Divider from 'components/Divider'
import ExpandableBox from 'components/ExpandableBox'
import Icon from 'components/Icons/Icon'
import Popover from 'components/Popover'
import { RowBetween, RowFit } from 'components/Row'
import Toggle from 'components/Toggle'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'
import { useTokenAnalysisSettings, useUpdateTokenAnalysisSettings } from 'state/user/hooks'

import useKyberAIAssetOverview from '../hooks/useKyberAIAssetOverview'
import { HeaderButton } from '../pages/SingleToken'
import { DiscoverTokenTab } from '../types'

const SettingsWrapper = styled.div`
  padding: 16px;
  border-radius: 20px;
  min-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: ${({ theme }) => theme.tableHeader};
`

const ViewTutorialButton = styled(RowFit)`
  color: ${({ theme }) => theme.text};
  font-size: 12px;
  font-weight: 500;
  gap: 2px;
  cursor: pointer;

  :hover {
    color: ${({ theme }) => theme.subText};
  }
`

const onChainAnalysisSettings = [
  {
    id: 'numberOfTrades',
    name: t`Number of Trades / Type of Trade`,
  },
  {
    id: 'tradingVolume',
    name: t`Trading Volume`,
  },
  {
    id: 'netflowToWhaleWallets',
    name: t`Netflow to Whale Wallets`,
  },
  {
    id: 'netflowToCEX',
    name: t`Netflow to CEX`,
  },
  {
    id: 'volumeOfTransfers',
    name: t`Number / Volume of Tranfers`,
  },
  {
    id: 'numberOfHolders',
    name: t`Number of Holders`,
  },
  {
    id: 'top10Holders',
    name: t`Top 10 Holders`,
  },
  {
    id: 'top25Holders',
    name: t`Top 25 Holders`,
  },
]

const technicalAnalysisSettings = [
  {
    id: 'liveCharts',
    name: t`Live Charts`,
  },
  {
    id: 'supportResistanceLevels',
    name: t`Support & Resistance Levels`,
  },
  {
    id: 'liveDEXTrades',
    name: t`Live DEX Trades`,
  },
  {
    id: 'fundingRateOnCEX',
    name: t`Funding Rate on CEX`,
  },
  {
    id: 'liquidationsOnCEX',
    name: t`Liquidations on CEX`,
  },
]

export default function DisplaySettings({ currentTab }: { currentTab: DiscoverTokenTab }) {
  const theme = useTheme()
  const mixpanelHandler = useMixpanelKyberAI()
  const [showSettings, setShowSettings] = useState(false)
  const [showOnchainSetting, setShowOnchainSetting] = useState(currentTab === DiscoverTokenTab.OnChainAnalysis)
  const [showTechnicalSetting, setShowTechnicalSetting] = useState(currentTab === DiscoverTokenTab.TechnicalAnalysis)
  const storedTokenAnalysisSettings = useTokenAnalysisSettings()
  const updateTokenAnalysisSettings = useUpdateTokenAnalysisSettings()
  const toggleTutorial = useToggleModal(ApplicationModal.KYBERAI_TUTORIAL)
  const { data: token } = useKyberAIAssetOverview()
  const { chain } = useParams()
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => {
    setShowSettings(false)
  })
  return (
    <Popover
      show={showSettings}
      style={{ backgroundColor: theme.tableHeader }}
      opacity={1}
      content={
        <SettingsWrapper ref={ref}>
          <Text color={theme.text} fontWeight={500}>
            <Trans>Display Settings</Trans>
          </Text>
          <RowBetween>
            <Text fontSize={14}>
              <Trans>KyberAI Tutorial</Trans>
            </Text>
            <ViewTutorialButton
              onClick={() => {
                toggleTutorial()
                setShowSettings(false)
              }}
            >
              View <Icon id="lightbulb" size={16} />
            </ViewTutorialButton>
          </RowBetween>
          <ExpandableBox
            style={{ padding: 0, opacity: 1 }}
            backgroundColor="inherit"
            isExpanded={showOnchainSetting}
            onChange={value => {
              setShowOnchainSetting(value)
              if (value) {
                setShowTechnicalSetting(false)
              }
            }}
            headerContent={
              <Text color={theme.text} fontSize={14} fontWeight={500}>
                <Trans>On-Chain Analysis</Trans>
              </Text>
            }
            hasDivider={false}
            expandContent={
              <Column gap="12px" style={{ marginTop: '12px' }}>
                {onChainAnalysisSettings.map(t => (
                  <RowBetween key={t.id}>
                    <Text fontSize={14}>{t.name}</Text>
                    <Toggle
                      isActive={storedTokenAnalysisSettings?.[t.id] ?? true}
                      toggle={() => {
                        mixpanelHandler(MIXPANEL_TYPE.KYBERAI_EXPLORING_CHANGE_DISPLAY_SETTING, {
                          token_name: token?.symbol?.toUpperCase(),
                          network: chain,
                          source:
                            currentTab === DiscoverTokenTab.OnChainAnalysis ? 'onchain_analysis' : 'technical_analysis',
                          option: t.name,
                          on_off: !(storedTokenAnalysisSettings?.[t.id] ?? true),
                        })
                        updateTokenAnalysisSettings(t.id)
                      }}
                    />
                  </RowBetween>
                ))}
              </Column>
            }
          />
          <Divider />
          <ExpandableBox
            style={{ padding: 0 }}
            backgroundColor="inherit"
            isExpanded={showTechnicalSetting}
            onChange={value => {
              setShowTechnicalSetting(value)
              if (value) {
                setShowOnchainSetting(false)
              }
            }}
            headerContent={
              <Text color={theme.text} fontSize={14} fontWeight={500}>
                <Trans>Technical Analysis</Trans>
              </Text>
            }
            hasDivider={false}
            expandContent={
              <Column gap="12px" style={{ marginTop: '12px' }}>
                {technicalAnalysisSettings.map(t => (
                  <RowBetween key={t.id}>
                    <Text fontSize={14}>{t.name}</Text>
                    <Toggle
                      isActive={storedTokenAnalysisSettings?.[t.id] ?? true}
                      toggle={() => {
                        mixpanelHandler(MIXPANEL_TYPE.KYBERAI_EXPLORING_CHANGE_DISPLAY_SETTING, {
                          token_name: token?.symbol?.toUpperCase(),
                          network: chain,
                          source:
                            currentTab === DiscoverTokenTab.OnChainAnalysis ? 'onchain_analysis' : 'technical_analysis',
                          option: t.name,
                          on_off: !(storedTokenAnalysisSettings?.[t.id] ?? true),
                        })
                        updateTokenAnalysisSettings(t.id)
                      }}
                    />
                  </RowBetween>
                ))}
              </Column>
            }
          />
        </SettingsWrapper>
      }
      noArrow={true}
      placement="bottom-end"
    >
      <HeaderButton
        onClick={() => {
          mixpanelHandler(MIXPANEL_TYPE.KYBERAI_EXPLORING_DISPLAY_SETTING_CLICK, {
            token_name: token?.symbol?.toUpperCase(),
            network: chain,
            source: currentTab === DiscoverTokenTab.OnChainAnalysis ? 'onchain_analysis' : 'technical_analysis',
          })
          setShowSettings(true)
        }}
      >
        <Sliders size={16} fill="currentcolor" style={{ transform: 'rotate(-90deg)' }} />
      </HeaderButton>
    </Popover>
  )
}
