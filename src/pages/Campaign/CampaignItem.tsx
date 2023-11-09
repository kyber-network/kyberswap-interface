import { ChainId, Fraction } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { rgba } from 'polished'
import { memo } from 'react'
import { Check } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties, css } from 'styled-components'

import { ReactComponent as GrantCampaignIcon } from 'assets/svg/grant_campaign.svg'
import { ReactComponent as StarMultiplierIcon } from 'assets/svg/star_multiplier.svg'
import ProgressBar from 'components/ProgressBar'
import { MouseoverTooltip } from 'components/Tooltip'
import { DEFAULT_SIGNIFICANT, RESERVE_USD_DECIMALS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { CampaignData, CampaignStatus, CampaignUserInfoStatus, ConditionGroupsType } from 'state/campaigns/actions'

import CampaignActions from './CampaignActions'

const CampaignItemWrapper = styled.div<{ selected?: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  cursor: pointer;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  :last-child {
    border-bottom: none;
  }
  position: relative;
  background: ${({ theme, selected }) => (selected ? rgba(theme.bg6, 0.12) : 'transparent')};

  ${({ theme, selected }) =>
    selected &&
    css`
      &:hover {
        background: darken(0.01, ${theme.background});
      }
    `}
`

const CampaignStatusText = styled.div<{ status: CampaignStatus }>`
  font-size: 12px;
  line-height: 10px;
  padding: 5px 8px;
  text-align: center;
  height: fit-content;
  border-radius: 24px;
  white-space: nowrap;

  ${({ theme, status }) => {
    const color = {
      [CampaignStatus.UPCOMING]: theme.warning,
      [CampaignStatus.ONGOING]: theme.primary,
      [CampaignStatus.ENDED]: theme.red,
    }[status]
    return css`
      background: ${rgba(color, 0.2)};
      color: ${color};
    `
  }}
`

const Container = styled.div`
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  display: flex;
`

interface CampaignItemProps {
  isSelected: boolean
  campaign: CampaignData
  onSelectCampaign: (data: CampaignData) => void
  style: CSSProperties
  index: number
}

export const getCampaignInfo = (campaign: CampaignData, account: string | undefined | null) => {
  if (!campaign) return { showProgressBarVolume: false, showProgressBarNumberTrade: false, isShowProgressBar: false }
  const { tradingNumberRequired, tradingVolumeRequired } = campaign
  const isOngoing = campaign.status === CampaignStatus.ONGOING
  const isShowProgressBar = isOngoing && account && campaign?.userInfo?.status === CampaignUserInfoStatus.Eligible
  const showProgressBarVolume = Boolean(isShowProgressBar && tradingVolumeRequired > 0)
  const showProgressBarNumberTrade = Boolean(isShowProgressBar && tradingNumberRequired > 1)
  return { showProgressBarVolume, showProgressBarNumberTrade, isShowProgressBar }
}

function CampaignItem({ campaign, onSelectCampaign, isSelected, style }: CampaignItemProps) {
  const { account } = useWeb3React()
  const theme = useTheme()
  const isRewardInUSD = campaign.rewardDistribution[0]?.rewardInUSD
  let totalRewardAmount: Fraction = new Fraction(0)
  let percentTradingVolume = 0
  const {
    tradingNumberRequired,
    tradingVolumeRequired,
    userInfo: { tradingNumber, tradingVolume } = { tradingNumber: 0, tradingVolume: 0 },
  } = campaign

  try {
    totalRewardAmount = campaign.rewardDistribution.reduce((acc, value) => {
      return acc.add(
        new Fraction(
          parseUnits(value.amount || '0', RESERVE_USD_DECIMALS).toString(),
          isRewardInUSD
            ? JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS))
            : JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt((value?.token?.decimals ?? 18) + RESERVE_USD_DECIMALS)),
        ),
      )
    }, new Fraction(0))
    if (tradingVolumeRequired) {
      percentTradingVolume = Math.floor((tradingVolume / tradingVolumeRequired) * 100)
    }
  } catch (error) {
    console.log(error)
  }

  const isOngoing = campaign.status === CampaignStatus.ONGOING
  const rCampaignName = campaign.name
  const rCampaignStatus = campaign.status === CampaignStatus.UPCOMING ? t`Upcoming` : isOngoing ? t`Ongoing` : t`Ended`
  const rChainIdImages = campaign?.chainIds?.split?.(',').map(chainId => {
    const { icon, name } = NETWORKS_INFO[chainId as unknown as ChainId]
    return (
      <img
        key={chainId}
        src={icon}
        alt={name + ' icon'}
        style={{ width: '16px', minWidth: '16px', height: '16px', minHeight: '16px' }}
      />
    )
  })
  const totalRewardAmountString = totalRewardAmount.equalTo(0)
    ? ''
    : totalRewardAmount.toSignificant(DEFAULT_SIGNIFICANT, { groupSeparator: ',' })
  const tokenSymbol = campaign.rewardDistribution[0]?.token?.symbol

  const percentTradingNumber = !tradingNumberRequired ? 0 : Math.floor((tradingNumber / tradingNumberRequired) * 100)
  const isPassedVolume = percentTradingVolume >= 100
  const isPassedNumberOfTrade = percentTradingNumber >= 100
  const isQualified =
    (isPassedVolume && isPassedNumberOfTrade) ||
    (isPassedVolume && !tradingNumberRequired) ||
    (isPassedNumberOfTrade && !tradingVolumeRequired)
  const { showProgressBarVolume, showProgressBarNumberTrade, isShowProgressBar } = getCampaignInfo(campaign, account)
  const hasBonusMultiplier = !!campaign?.conditionGroups?.find(
    item => item.type === ConditionGroupsType.POINT_MULTIPLIER && !!item.conditions?.length,
  )

  return (
    <CampaignItemWrapper
      onClick={() => {
        onSelectCampaign(campaign)
      }}
      selected={isSelected}
      style={style}
    >
      <Container>
        <Flex style={{ gap: '8px' }}>{rChainIdImages}</Flex>
        <Flex
          alignItems="center"
          sx={{
            gap: '8px',
          }}
        >
          {campaign.competitionId && campaign.competitorId && campaign.status !== CampaignStatus.ENDED ? (
            <MouseoverTooltip
              placement="top"
              text={<Trans>This campaign is participating in the Grant Campaign.</Trans>}
            >
              <GrantCampaignIcon width="16px" height="16px" />
            </MouseoverTooltip>
          ) : null}
          {hasBonusMultiplier && (
            <MouseoverTooltip placement="top" text={<Trans>Point multiplier is in effect.</Trans>}>
              <StarMultiplierIcon />
            </MouseoverTooltip>
          )}
          <CampaignStatusText status={campaign.status}>{rCampaignStatus}</CampaignStatusText>
        </Flex>
      </Container>

      <Container>
        <Text fontWeight={500} color={theme.text} style={{ wordBreak: 'break-word' }}>
          {rCampaignName}
        </Text>
      </Container>

      {totalRewardAmountString ? (
        <Container>
          <Text fontSize="12px">
            <Trans>
              Total Reward:{' '}
              {isRewardInUSD
                ? `$${totalRewardAmountString} ${t`in`} ${tokenSymbol}`
                : `${totalRewardAmountString} ${tokenSymbol}`}
            </Trans>
          </Text>
        </Container>
      ) : null}

      {isQualified ? (
        <Flex style={{ gap: 10 }} flexDirection="column">
          <Flex justifyContent={'space-between'} alignItems="center">
            <Text fontSize={12}>
              <Trans>Condition(s) to qualify:</Trans>
            </Text>
            <CampaignStatusText
              status={CampaignStatus.ONGOING}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                alignSelf: 'flex-end',
                padding: '2px 7px',
              }}
            >
              <Check width={17} height={17} />
              <Trans>Qualified</Trans>
            </CampaignStatusText>
          </Flex>
        </Flex>
      ) : showProgressBarVolume || showProgressBarNumberTrade ? (
        <Flex style={{ gap: 10 }} flexDirection="column">
          <Text fontSize={12}>
            <Trans>Condition(s) to qualify:</Trans>
          </Text>
          {showProgressBarVolume && (
            <ProgressBar
              label={t`Your Trading Volume`}
              percent={percentTradingVolume}
              value={isPassedVolume ? <Check width={17} height={17} /> : `${percentTradingVolume}%`}
              valueColor={isPassedVolume ? theme.primary : theme.subText}
              color={isPassedVolume ? theme.primary : theme.warning}
            />
          )}
          {showProgressBarNumberTrade && (
            <ProgressBar
              label={t`Your Number of Trades`}
              percent={percentTradingNumber}
              value={isPassedNumberOfTrade ? <Check width={17} height={17} /> : `${percentTradingNumber}%`}
              valueColor={isPassedNumberOfTrade ? theme.primary : theme.subText}
              color={isPassedNumberOfTrade ? theme.primary : theme.warning}
            />
          )}
        </Flex>
      ) : null}

      {!isShowProgressBar && (
        <div>
          <CampaignActions campaign={campaign} size="small" hideWhenDisabled />
        </div>
      )}
    </CampaignItemWrapper>
  )
}

export default memo(CampaignItem)
