import { BigNumber } from '@ethersproject/bignumber'
import { Trans, t } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import InfoHelper from 'components/InfoHelper'
import Row, { RowBetween, RowFit } from 'components/Row'
import { AMP_HINT } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import useFairLaunch from 'hooks/useFairLaunch'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useBlockNumber } from 'state/application/hooks'
import { setAttemptingTxn, setShowConfirm, setTxHash, setYieldPoolsError } from 'state/farms/classic/actions'
import { FairLaunchVersion, Farm } from 'state/farms/classic/types'
import { useAppDispatch } from 'state/hooks'
import { useViewMode } from 'state/user/hooks'
import { VIEW_MODE } from 'state/user/reducer'
import { MEDIA_WIDTHS } from 'theme'
import { useFarmRewards } from 'utils/dmm'
import { getFullDisplayBalance } from 'utils/formatBalance'
import { getFormattedTimeFromSecond } from 'utils/formatTime'

import HarvestAll from './HarvestAll'
import ListItem from './ListItem'
import {
  ClassicFarmGridWrapper,
  ClassicFarmWrapper,
  ExpandableWrapper,
  ListItemWrapper,
  TableHeader,
  ToggleButtonWrapper,
} from './styleds'

interface FarmsListProps {
  fairLaunchAddress: string
  farms?: Farm[]
  active?: boolean
}

const ToggleButton = ({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) => {
  return (
    <ToggleButtonWrapper onClick={onClick}>
      <DropdownSVG style={{ rotate: isOpen ? '180deg' : 'none' }} />
    </ToggleButtonWrapper>
  )
}

const FairLaunchPools = ({ fairLaunchAddress, farms, active }: FarmsListProps) => {
  const dispatch = useAppDispatch()
  const [viewMode] = useViewMode()
  const above1200 = useMedia(`(min-width:${MEDIA_WIDTHS.upToLarge}px)`)
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const { account, isEVM, networkInfo } = useActiveWeb3React()
  const theme = useTheme()
  const blockNumber = useBlockNumber()
  const totalRewards = useFarmRewards(farms)
  const { harvestMultiplePools } = useFairLaunch(fairLaunchAddress)
  const { mixpanelHandler } = useMixpanel()

  const [expanded, setExpanded] = useState(true)

  const handleHarvestAll = useCallback(async () => {
    if (!account) {
      return
    }

    dispatch(setShowConfirm(true))
    dispatch(setAttemptingTxn(true))
    dispatch(setTxHash(''))

    try {
      const poolsHaveReward = (farms || []).filter(farm => {
        if (!farm.userData?.rewards) {
          return false
        }

        const hasReward = farm.userData?.rewards?.some(value => BigNumber.from(value).gt(0))

        return hasReward
      })

      const txHash = await harvestMultiplePools(
        poolsHaveReward.map(farm => farm.pid),
        totalRewards,
      )
      if (txHash) {
        mixpanelHandler(MIXPANEL_TYPE.ALL_REWARDS_HARVESTED, {
          reward_tokens_and_amounts:
            totalRewards &&
            Object.assign(
              {},
              ...totalRewards.map(reward => {
                if (reward?.token?.symbol)
                  return { [reward.token.symbol]: getFullDisplayBalance(reward.amount, reward.token.decimals) }
                return {}
              }),
            ),
        })
      }
      dispatch(setTxHash(txHash))
    } catch (err) {
      console.error(err)
      dispatch(setYieldPoolsError(err as Error))
    }

    dispatch(setAttemptingTxn(false))
  }, [account, dispatch, farms, harvestMultiplePools, mixpanelHandler, totalRewards])

  const currentTimestamp = Math.floor(Date.now() / 1000)

  const farmsList: Farm[] = (farms || [])?.map(farm => {
    if (farm.version === FairLaunchVersion.V1) {
      const isFarmStarted = farm && blockNumber && farm.startBlock < blockNumber
      const isFarmEnded = farm && blockNumber && farm.endBlock < blockNumber

      let remainingBlocks: number | false | undefined

      if (!isFarmStarted) {
        remainingBlocks = farm && blockNumber && farm.startBlock - blockNumber
      } else {
        remainingBlocks = farm && blockNumber && farm.endBlock - blockNumber
      }
      const estimatedRemainingSeconds =
        remainingBlocks && remainingBlocks * (networkInfo as EVMNetworkInfo).averageBlockTimeInSeconds
      const formattedEstimatedRemainingTime =
        estimatedRemainingSeconds && getFormattedTimeFromSecond(estimatedRemainingSeconds)

      return {
        ...farm,
        time: `${isFarmEnded ? 'Ended' : 'Starting in ' + formattedEstimatedRemainingTime}`,
      }
    } else {
      const isFarmStarted = farm && currentTimestamp && farm.startTime < currentTimestamp
      const isFarmEnded = farm && currentTimestamp && farm.endTime < currentTimestamp

      let formattedEstimatedRemainingTime: string

      if (!isFarmStarted) {
        formattedEstimatedRemainingTime = getFormattedTimeFromSecond(farm.startTime - currentTimestamp)
      } else {
        formattedEstimatedRemainingTime = getFormattedTimeFromSecond(farm.endTime - currentTimestamp)
      }

      return {
        ...farm,
        time: `${isFarmEnded ? 'Ended' : (isFarmStarted ? '' : 'Starting in ') + formattedEstimatedRemainingTime}`,
      }
    }
  })

  const displayFarms = farmsList.sort((a, b) =>
    a.version === FairLaunchVersion.V1 && b.version === FairLaunchVersion.V1 ? b.endBlock - a.endBlock : 0,
  )

  const ConditionListWrapper = viewMode === VIEW_MODE.LIST && above1200 ? ListItemWrapper : ClassicFarmGridWrapper
  if (!isEVM) return <Navigate to="/" />

  return (
    <ClassicFarmWrapper>
      {!!displayFarms.length && (
        <>
          <RowBetween gap="16px">
            <RowFit style={{ whiteSpace: 'nowrap' }}>
              <Text fontSize={16} lineHeight="20px" color={theme.subText}>
                <Trans>Farming Contract</Trans>
              </Text>
            </RowFit>
            {above768 && (
              <Row justify="flex-end">
                <HarvestAll totalRewards={totalRewards} onHarvestAll={handleHarvestAll} />
              </Row>
            )}
            <RowFit flex="0 0 36px">
              <ToggleButton isOpen={expanded} onClick={() => setExpanded(prev => !prev)} />
            </RowFit>
          </RowBetween>
          {!above768 && (
            <Row justify="flex-end">
              <HarvestAll totalRewards={totalRewards} onHarvestAll={handleHarvestAll} />
            </Row>
          )}
          <ExpandableWrapper expanded={expanded}>
            <ConditionListWrapper>
              {viewMode === VIEW_MODE.LIST && above1200 && (
                <TableHeader>
                  <Row>
                    <Text color={theme.subText}>
                      <Trans>POOLS | AMP</Trans>
                    </Text>
                    <InfoHelper text={AMP_HINT} />
                  </Row>
                  <Row>
                    <Text color={theme.subText}>
                      <Trans>STAKED TVL</Trans>
                    </Text>
                  </Row>
                  <Row>
                    <Text color={theme.subText}>
                      <Trans>AVG APR</Trans>
                    </Text>
                    <InfoHelper
                      text={
                        active
                          ? t`Total estimated return based on yearly fees and bonus rewards of the pool.`
                          : t`Estimated return based on yearly fees of the pool.`
                      }
                    />
                  </Row>
                  <Row>
                    <Text color={theme.subText}>
                      <Trans>ENDING IN</Trans>
                    </Text>
                    <InfoHelper
                      text={t`After harvesting, your rewards will unlock linearly over the indicated time period`}
                    />
                  </Row>
                  <Row>
                    <Text color={theme.subText}>
                      <Trans>MY DEPOSIT</Trans>
                    </Text>
                  </Row>
                  <Row justify="flex-end">
                    <Text color={theme.subText}>
                      <Trans>My Rewards</Trans>
                    </Text>
                  </Row>
                  <Row justify="flex-end">
                    <Text color={theme.subText}>
                      <Trans>ACTIONS</Trans>
                    </Text>
                  </Row>
                </TableHeader>
              )}

              {displayFarms.map(farm => {
                return <ListItem key={`${farm.fairLaunchAddress}_${farm.stakeToken}_${farm.pid}`} farm={farm} />
              })}
            </ConditionListWrapper>
          </ExpandableWrapper>
        </>
      )}
    </ClassicFarmWrapper>
  )
}

export default FairLaunchPools
