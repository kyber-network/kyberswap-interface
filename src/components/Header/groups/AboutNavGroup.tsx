import { Trans } from '@lingui/macro'
import { useLocation } from 'react-router-dom'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { APP_PATHS } from 'constants/index'
import { THRESHOLD_HEADER } from 'constants/styles'

import { DropdownTextAnchor, StyledNavLink } from '../styleds'
import NavGroup from './NavGroup'

const AboutWrapper = styled.span`
  display: inline-flex;
  @media (max-width: ${THRESHOLD_HEADER.ABOUT}) {
    display: none;
  }
`

const AboutNavGroup = () => {
  const { pathname } = useLocation()
  const isActive = pathname.includes(APP_PATHS.ABOUT)

  return (
    <AboutWrapper>
      <NavGroup
        isActive={isActive}
        anchor={
          <DropdownTextAnchor>
            <Trans>About</Trans>
          </DropdownTextAnchor>
        }
        dropdownContent={
          <Flex
            sx={{
              flexDirection: 'column',
            }}
          >
            <StyledNavLink id="about-kyberswap" to={`${APP_PATHS.ABOUT}/kyberswap`}>
              <Trans>KyberSwap</Trans>
            </StyledNavLink>

            <StyledNavLink id="about-knc" to={`${APP_PATHS.ABOUT}/knc`}>
              <Trans> KNC</Trans>
            </StyledNavLink>
          </Flex>
        }
      />
    </AboutWrapper>
  )
}

export default AboutNavGroup
