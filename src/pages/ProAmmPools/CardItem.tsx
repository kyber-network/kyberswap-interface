import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import mixpanel from 'mixpanel-browser'
import { useMemo, useState } from 'react'
import { BarChart2, MoreHorizontal, Plus, Share2 } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import bgimg from 'assets/images/card-background.png'
import { ReactComponent as ViewPositionIcon } from 'assets/svg/view_positions.svg'
import { ButtonLight, ButtonOutlined } from 'components/Button'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import QuickZap, { QuickZapButton } from 'components/ElasticZap/QuickZap'
import { FarmTag } from 'components/FarmTag'
import { MouseoverTooltip } from 'components/Tooltip'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { APRTooltipContent } from 'components/YieldPools/FarmingPoolAPRCell'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT, PROMM_ANALYTICS_URL } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { useElasticFarms } from 'state/farms/elastic/hooks'
import { useElasticFarmsV2 } from 'state/farms/elasticv2/hooks'
import { ExternalLink } from 'theme'
import { ElasticPoolDetail } from 'types/pool'
import { isAddressString } from 'utils'
import { formatDollarAmount } from 'utils/numbers'

import KyberAIModalInPool from './KyberAIModalInPool'

const StyledLink = styled(ExternalLink)`
  :hover {
    text-decoration: none;
  }
`

interface ListItemProps {
  pool: ElasticPoolDetail
  onShared: (id: string) => void
  userPositions: { [key: string]: number }
}

const getPrommAnalyticLink = (chainId: ChainId, poolAddress: string) => {
  if (!chainId) return ''
  return `${PROMM_ANALYTICS_URL[chainId]}/pool/${poolAddress.toLowerCase()}`
}

const Wrapper = styled.div`
  border-radius: 20px;
  padding: 16px;
  background-image: url(${bgimg});
  background-size: cover;
  background-repeat: no-repeat;
  background-color: ${({ theme }) => theme.buttonBlack};
`
export default function ProAmmPoolCardItem({ pool, onShared, userPositions }: ListItemProps) {
  const { chainId, networkInfo } = useActiveWeb3React()
  const theme = useTheme()
  const navigate = useNavigate()

  const [showQuickZap, setShowQuickZap] = useState(false)

  const { farms: farmsV2 } = useElasticFarmsV2()

  const allTokens = useAllTokens()
  const { farms } = useElasticFarms()

  const token0 =
    allTokens[isAddressString(chainId, pool.token0.address)] ||
    new Token(chainId, pool.token0.address, pool.token0.decimals, pool.token0.symbol)
  const token1 =
    allTokens[isAddressString(chainId, pool.token1.address)] ||
    new Token(chainId, pool.token1.address, pool.token1.decimals, pool.token1.symbol)

  const nativeToken = NativeCurrencies[chainId]

  const isToken0WETH = token0.address.toLowerCase() === WETH[chainId].address.toLowerCase()
  const isToken1WETH = token1.address.toLowerCase() === WETH[chainId].address.toLowerCase()

  const token0Slug = isToken0WETH ? nativeToken.symbol : token0.address
  const token0Symbol = isToken0WETH ? nativeToken.symbol : token0.symbol

  const token1Slug = isToken1WETH ? nativeToken.symbol : token1.address
  const token1Symbol = isToken1WETH ? nativeToken.symbol : token1.symbol

  const myLiquidity = userPositions[pool.address]
  const hasLiquidity = pool.address in userPositions

  const farmV2 = farmsV2?.find(
    item =>
      item.endTime > Date.now() / 1000 &&
      !item.isSettled &&
      item.poolAddress.toLowerCase() === pool.address.toLowerCase(),
  )

  const isFarmV2 = !!farmV2
  const maxFarmV2Apr = Math.max(...(farmV2?.ranges.map(item => item.apr || 0) || []))

  const maxFarmAPR = maxFarmV2Apr > (pool.farmAPR || 0) ? maxFarmV2Apr : pool.farmAPR || 0

  const isFarmV1: boolean = useMemo(() => {
    let fairlaunchAddress = ''
    let pid = -1

    farms?.forEach(farm => {
      const p = farm.pools
        .filter(item => item.endTime > Date.now() / 1000)
        .find(item => item.poolAddress.toLowerCase() === pool.address.toLowerCase())

      if (p) {
        fairlaunchAddress = farm.id
        pid = Number(p.pid)
      }
    })

    return !!fairlaunchAddress && pid !== -1
  }, [farms, pool.address])

  const isFarmingPool = isFarmV1 || isFarmV2

  return (
    <Wrapper key={pool.address} data-testid={pool.address}>
      <QuickZap poolAddress={pool.address} isOpen={showQuickZap} onDismiss={() => setShowQuickZap(false)} />

      <Flex alignItems="center" justifyContent="space-between">
        <Link
          to={`/${networkInfo.route}${APP_PATHS.ELASTIC_CREATE_POOL}/${token0Slug}/${token1Slug}/${pool.feeTier}`}
          style={{
            textDecoration: 'none',
          }}
        >
          <Flex alignItems="center">
            <DoubleCurrencyLogo
              size={20}
              currency0={isToken0WETH ? nativeToken : token0}
              currency1={isToken1WETH ? nativeToken : token1}
            />
            <Text fontSize={16} fontWeight="500">
              {token0Symbol} - {token1Symbol}
            </Text>
            <FeeTag style={{ fontSize: '12px', marginRight: '4px' }}>
              Fee {(pool.feeTier * 100) / ELASTIC_BASE_FEE_UNIT}%
            </FeeTag>
          </Flex>
        </Link>

        <Flex alignItems="center" sx={{ gap: '6px' }} color={theme.subText}>
          <CopyHelper toCopy={pool.address} />

          <MouseoverTooltip
            width="fit-content"
            placement="bottom"
            text={
              <div>
                <Flex
                  sx={{ gap: '4px', cursor: 'pointer' }}
                  role="button"
                  alignItems="center"
                  marginBottom="0.5rem"
                  color={theme.subText}
                  onClick={() => {
                    onShared(pool.address)
                  }}
                >
                  <Share2 size="14px" color={theme.subText} />
                  <Trans>Share</Trans>
                </Flex>
                <KyberAIModalInPool
                  currency0={isToken0WETH ? nativeToken : token0}
                  currency1={isToken1WETH ? nativeToken : token1}
                />

                <StyledLink href={getPrommAnalyticLink(chainId, pool.address)}>
                  <Flex alignItems="center">
                    <BarChart2 size="16px" color={theme.subText} />
                    <Text fontSize="12px" fontWeight="500" marginLeft="4px" color={theme.subText}>
                      Pool Analytics ↗
                    </Text>
                  </Flex>
                </StyledLink>
              </div>
            }
          >
            <MoreHorizontal size={16} />
          </MouseoverTooltip>
        </Flex>
      </Flex>

      <Text
        width="fit-content"
        lineHeight="16px"
        fontSize="12px"
        fontWeight="500"
        color={theme.subText}
        sx={{ borderBottom: `1px dashed ${theme.border}` }}
        marginTop="16px"
      >
        <MouseoverTooltip
          width="fit-content"
          placement="right"
          text={<APRTooltipContent farmV2APR={maxFarmV2Apr} farmAPR={pool.farmAPR || 0} poolAPR={pool.apr} />}
        >
          <Trans>Avg APR</Trans>
        </MouseoverTooltip>
      </Text>

      <Flex justifyContent="space-between" alignItems="center">
        <Text fontSize="28px" fontWeight="500" color={theme.apr}>
          {(maxFarmAPR + pool.apr).toFixed(2)}%
        </Text>

        <Flex sx={{ gap: '4px' }}>{isFarmingPool && <FarmTag address={pool.address} />}</Flex>
      </Flex>

      <Flex justifyContent="space-between" color={theme.subText} fontSize="12px" fontWeight="500" marginTop="1rem">
        <Text>
          <Trans>Volume (24H)</Trans>
        </Text>
        <Text>
          <Trans>Fees (24H)</Trans>
        </Text>
      </Flex>

      <Flex justifyContent="space-between" fontSize="16px" fontWeight="500" marginTop="0.25rem" marginBottom="1rem">
        <Text>{formatDollarAmount(pool.volumeUSDLast24h)}</Text>
        <Text>{formatDollarAmount(pool.volumeUSDLast24h * (pool.feeTier / ELASTIC_BASE_FEE_UNIT))}</Text>
      </Flex>

      <Divider />

      <Flex justifyContent="space-between" color={theme.subText} fontSize="12px" fontWeight="500" marginTop="1rem">
        <Text>TVL</Text>
        <Text>My Liquidity</Text>
      </Flex>

      <Flex justifyContent="space-between" fontSize="16px" fontWeight="500" marginTop="0.25rem" marginBottom="1rem">
        <Text>{formatDollarAmount(pool.tvlUSD)}</Text>
        <Text>{myLiquidity ? formatDollarAmount(Number(myLiquidity)) : '-'}</Text>
      </Flex>

      <Flex marginTop="20px" justifyContent="space-between" fontSize="14px" style={{ gap: '16px' }}>
        {hasLiquidity && (
          <ButtonOutlined
            as={Link}
            to={`${APP_PATHS.MY_POOLS}/${networkInfo.route}?tab=${VERSION.ELASTIC}&search=${pool.address}`}
            padding="10px"
            style={{ height: '36px' }}
          >
            <ViewPositionIcon />
            <Text width="max-content" fontSize="14px">
              <Trans>View Positions</Trans>
            </Text>
          </ButtonOutlined>
        )}

        <ButtonLight
          padding="10px"
          style={{ height: '36px' }}
          onClick={() => {
            const url = `/${networkInfo.route}${APP_PATHS.ELASTIC_CREATE_POOL}/${token0Slug}/${token1Slug}/${pool.feeTier}`
            navigate(url)
          }}
        >
          <Plus size={16} />
          <Text width="max-content" fontSize="14px" marginLeft="4px">
            <Trans>Add Liquidity</Trans>
          </Text>
        </ButtonLight>

        <QuickZapButton
          onClick={() => {
            setShowQuickZap(true)
            mixpanel.track('Zap - Click Quick Zap', {
              token0: token0?.symbol || '',
              token1: token1?.symbol || '',
              source: 'pool_page',
            })
          }}
        />
      </Flex>
    </Wrapper>
  )
}
