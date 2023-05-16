import { ChainId } from '@kyberswap/ks-sdk-core'
import { Flex } from 'rebass'
import { PoolEarningWithDetails, PositionEarningWithDetails } from 'services/earning'

import SinglePool from 'pages/MyEarnings/SinglePool'

type Props = {
  chainId: ChainId
  positionEarningsByPoolId: Record<string, PositionEarningWithDetails[]>
  poolEarnings: PoolEarningWithDetails[]
}
const Pools: React.FC<Props> = ({ poolEarnings, chainId, positionEarningsByPoolId }) => {
  if (!poolEarnings.length) {
    return null
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {poolEarnings.map((poolEarning, i) => (
        <SinglePool
          poolEarning={poolEarning}
          chainId={chainId}
          key={i}
          positionEarnings={positionEarningsByPoolId[poolEarning.id]}
        />
      ))}
    </Flex>
  )
}

export default Pools