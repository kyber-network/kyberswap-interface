import { Trans } from '@lingui/macro'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'

import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { APP_PATHS } from 'constants/index'

import { DropdownTextAnchor, StyledNavLink } from '../styleds'
import NavGroup from './NavGroup'

const CampaignNavGroup = () => {
  const upTo560 = useMedia('(max-width: 560px)')
  const { pathname } = useLocation()
  const isActive = [APP_PATHS.CAMPAIGN, APP_PATHS.GRANT_PROGRAMS].some(path => pathname.includes(path))

  if (upTo560) {
    return null
  }

  return (
    <NavGroup
      id={TutorialIds.CAMPAIGN_LINK}
      isActive={isActive}
      anchor={
        <DropdownTextAnchor>
          <Trans>Campaigns</Trans>
        </DropdownTextAnchor>
      }
      dropdownContent={
        <Flex
          sx={{
            flexDirection: 'column',
          }}
        >
          <StyledNavLink id="campaigns" to={APP_PATHS.CAMPAIGN}>
            <Trans>Trading Campaigns</Trans>
          </StyledNavLink>

          <StyledNavLink id="project-trading-grant" to={APP_PATHS.GRANT_PROGRAMS}>
            <Trans>Trading Grant Campaign</Trans>
          </StyledNavLink>
        </Flex>
      }
    />
  )
}

export default CampaignNavGroup
