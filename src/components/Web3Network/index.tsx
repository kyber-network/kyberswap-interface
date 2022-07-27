import React, { useMemo } from 'react'
import styled from 'styled-components'

import { useActiveWeb3React } from 'hooks'
import { useModalOpen, useNetworkModalToggle } from '../../state/application/hooks'
import { NETWORKS_INFO } from '../../constants/networks'
import NetworkModal from '../NetworkModal'
import Card from 'components/Card'
import Row from 'components/Row'
import { ApplicationModal } from 'state/application/actions'
import { ReactComponent as DropdownSvg } from 'assets/svg/down.svg'
import { useETHBalances } from 'state/wallet/hooks'
import { ChainId, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { nativeOnChain } from 'constants/tokens'

const NetworkSwitchContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`

const NetworkCard = styled(Card)`
  position: relative;
  background-color: ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.text};
  border-radius: 999px;
  padding: 8px 12px;
  border: 1px solid transparent;
  min-width: 165px;

  &:hover {
    text-decoration: none;
    border: 1px solid ${({ theme }) => theme.primary};
    cursor: pointer;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0;
    margin-right: 0.5rem;
    width: initial;
    text-overflow: ellipsis;
    flex-shrink: 1;
    min-width: auto;
  `};
`

const NetworkLabel = styled.div`
  white-space: nowrap;
  font-weight: 500;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const DropdownIcon = styled(DropdownSvg)<{ open: boolean }>`
  color: ${({ theme }) => theme.text};
  transform: rotate(${({ open }) => (open ? '180deg' : '0')});
  transition: transform 300ms;
`

function Web3Network(): JSX.Element | null {
  const { chainId, account } = useActiveWeb3React()
  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModal = useNetworkModalToggle()
  const userEthBalance = useETHBalances(account ? [account] : [])?.[account ?? '']
  const labelContent = useMemo(() => {
    if (!chainId) return ''
    return userEthBalance
      ? `${
          userEthBalance?.lessThan(CurrencyAmount.fromRawAmount(nativeOnChain(chainId), (1e18).toString())) &&
          userEthBalance?.greaterThan(0)
            ? parseFloat(userEthBalance.toSignificant(4)).toFixed(4)
            : userEthBalance.toSignificant(4)
        } ${NETWORKS_INFO[chainId || ChainId.MAINNET].nativeToken.symbol}`
      : NETWORKS_INFO[chainId].name
  }, [account, userEthBalance, chainId])

  if (!chainId) return null

  return (
    <NetworkCard onClick={() => toggleNetworkModal()} role="button">
      <NetworkSwitchContainer>
        <Row flex={1}>
          <img
            src={NETWORKS_INFO[chainId].icon}
            alt="Switch Network"
            style={{ width: 20, height: 20, marginRight: '12px' }}
          />
          <NetworkLabel>{labelContent}</NetworkLabel>
        </Row>
        <DropdownIcon open={networkModalOpen} />
      </NetworkSwitchContainer>
      <NetworkModal />
    </NetworkCard>
  )
}

export default Web3Network
