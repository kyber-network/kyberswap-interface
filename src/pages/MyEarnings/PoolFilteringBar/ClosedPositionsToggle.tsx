import { Trans } from '@lingui/macro'
import { useDispatch } from 'react-redux'
import { Flex, Text } from 'rebass'

import Toggle from 'components/Toggle'
import { VERSION } from 'constants/v2'
import useTheme from 'hooks/useTheme'
import { useAppSelector } from 'state/hooks'
import { toggleShowClosedPositions } from 'state/myEarnings/actions'

const ClosedPositionsToggle = () => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const isActive = useAppSelector(state => state.myEarnings.shouldShowClosedPositions)
  const activeTab = useAppSelector(state => state.myEarnings.activeTab)

  const toggle = () => {
    dispatch(toggleShowClosedPositions())
  }

  return (
    <Flex
      sx={{
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'nowrap',
        fontWeight: 500,
        fontSize: '14px',
        lineHeight: '20px',
        color: theme.subText,
      }}
    >
      <Text
        sx={{
          whiteSpace: 'nowrap',
        }}
      >
        {activeTab === VERSION.CLASSIC ? <Trans>Removed Liquidity</Trans> : <Trans>Closed Positions</Trans>}
      </Text>
      <Toggle id="toggle-closed-positions" isActive={!!isActive} toggle={toggle} />
    </Flex>
  )
}

export default ClosedPositionsToggle
