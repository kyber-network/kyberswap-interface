import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useState } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { Shield } from 'components/Icons'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

import AddMEVProtectionModal from './AddMEVProtectionModal'

const PriceAlertButton = styled.div`
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
`

export default function SlippageSettingGroup({
  isStablePairSwap,
  isWrapOrUnwrap,
}: {
  isStablePairSwap: boolean
  isWrapOrUnwrap: boolean
}) {
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const theme = useTheme()
  const { chainId, walletEVM } = useActiveWeb3React()
  const [showMevModal, setShowMevModal] = useState(false)
  const { mixpanelHandler } = useMixpanel()

  const addMevProtectionHandler = useCallback(() => {
    setShowMevModal(true)
    mixpanelHandler(MIXPANEL_TYPE.MEV_CLICK_ADD_MEV)
  }, [mixpanelHandler])

  const onClose = useCallback(() => {
    setShowMevModal(false)
  }, [])

  const isPartnerSwap = window.location.pathname.startsWith(APP_PATHS.PARTNER_SWAP)
  const rightButton =
    chainId === ChainId.MAINNET && walletEVM.isConnected && !isPartnerSwap ? (
      <PriceAlertButton onClick={addMevProtectionHandler}>
        <Shield size={14} color={theme.subText} />
        <Text color={theme.subText} style={{ whiteSpace: 'nowrap' }}>
          {upToXXSmall ? <Trans>MEV Protection</Trans> : <Trans>Add MEV Protection</Trans>}
        </Text>
      </PriceAlertButton>
    ) : null

  return (
    <Flex alignItems="flex-start" fontSize={12} color={theme.subText} justifyContent="space-between">
      {isWrapOrUnwrap ? (
        <>
          <div />
          {rightButton}
        </>
      ) : (
        <SlippageSetting isStablePairSwap={isStablePairSwap} rightComponent={rightButton} />
      )}
      <AddMEVProtectionModal isOpen={showMevModal} onClose={onClose} />
    </Flex>
  )
}
