import React from 'react'
import { isMobile } from 'react-device-detect'
import { Text } from 'rebass'
import styled from 'styled-components'

import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import Modal from 'components/Modal'
import Row, { RowFit } from 'components/Row'
import { ICON_ID } from 'constants/index'
import useTheme from 'hooks/useTheme'

import SimpleTooltip from './SimpleTooltip'

const MenuDropdown = styled(RowFit)`
  position: absolute;
  top: 42px;
  right: 0;
  transform: translateY(-10px);
  transition: transform 0.1s ease, visibility 0.1s ease, opacity 0.1s ease;
  visibility: hidden;
  background-color: ${({ theme }) => theme.tableHeader};
  padding: 8px;
  opacity: 0;
  border-radius: 4px;
  z-index: 100;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.32);
  &.show {
    transform: translateY(0);
    visibility: visible;
    opacity: 1;
  }
`

const StyledChainIcon = styled.div`
  border-radius: 50%;
  background-color: ${({ theme }) => theme.tableHeader};
  padding: 6px;
  :hover {
    filter: brightness(1.2);
  }
`
const StyledMobileChainIcon = styled.div`
  width: calc(50% - 6px);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 8px;
`
const ChainIcon = ({ id, name, onClick }: { id: ICON_ID; name: string; onClick: () => void }) => {
  const theme = useTheme()
  if (isMobile)
    return (
      <StyledMobileChainIcon onClick={onClick}>
        <Icon id={id} size={20} />{' '}
        <Text fontSize="12px" color={theme.subText}>
          {name}
        </Text>
      </StyledMobileChainIcon>
    )
  return (
    <SimpleTooltip text={name}>
      <StyledChainIcon onClick={onClick}>
        <Icon id={id} size={20} />
      </StyledChainIcon>
    </SimpleTooltip>
  )
}

const MultipleChainDropdown = React.forwardRef(
  (
    props: {
      show: boolean
      tokens?: Array<{ address: string; chain: string }>
      onChainClick: (chain: string, address: string) => void
      onDismiss?: () => void
    },
    ref,
  ) => {
    const { show, tokens, onChainClick, onDismiss } = props

    const renderOptions = () =>
      tokens?.map((item: { address: string; chain: string }) => {
        if (item.chain === 'ethereum')
          return (
            <ChainIcon
              key={item.address}
              id="eth-mono"
              name="Ethereum"
              onClick={() => onChainClick('ethereum', item.address)}
            />
          )
        if (item.chain === 'bsc')
          return (
            <ChainIcon
              key={item.address}
              id="bnb-mono"
              name="Binance"
              onClick={() => onChainClick('bsc', item.address)}
            />
          )
        if (item.chain === 'avalanche')
          return (
            <ChainIcon
              key={item.address}
              id="ava-mono"
              name="Avalanche"
              onClick={() => onChainClick('avalanche', item.address)}
            />
          )
        if (item.chain === 'polygon')
          return (
            <ChainIcon
              key={item.address}
              id="matic-mono"
              name="Polygon"
              onClick={() => onChainClick('polygon', item.address)}
            />
          )
        if (item.chain === 'arbitrum')
          return (
            <ChainIcon
              key={item.address}
              id="arbitrum-mono"
              name="Arbitrum"
              onClick={() => onChainClick('arbitrum', item.address)}
            />
          )
        if (item.chain === 'fantom')
          return (
            <ChainIcon
              key={item.address}
              id="fantom-mono"
              name="Fantom"
              onClick={() => onChainClick('fantom', item.address)}
            />
          )
        if (item.chain === 'optimism')
          return (
            <ChainIcon
              key={item.address}
              id="optimism-mono"
              name="Optimism"
              onClick={() => onChainClick('optimism', item.address)}
            />
          )
        return <></>
      })

    const theme = useTheme()
    if (isMobile) {
      return (
        <Modal isOpen={show} onDismiss={onDismiss}>
          <Column padding="24px" width="100%" gap="12px" onClick={e => e.stopPropagation()}>
            <Row>
              <Text fontSize="20px" fontWeight={500}>
                Select Chain
              </Text>
            </Row>
            <Row style={{ flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>{renderOptions()}</Row>
          </Column>
        </Modal>
      )
    }
    return (
      <MenuDropdown
        className={show ? 'show' : ''}
        gap="8px"
        color={theme.text}
        style={{ right: 0 }}
        ref={ref}
        onClick={e => e.stopPropagation()}
      >
        {renderOptions()}
      </MenuDropdown>
    )
  },
)

MultipleChainDropdown.displayName = 'MultipleChainDropdown'

export default MultipleChainDropdown
