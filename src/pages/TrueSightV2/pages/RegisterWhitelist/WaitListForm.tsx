import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode } from 'react'
import { Users } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import Column from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import { ShareGroupButtons } from 'components/ShareModal'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { useSessionInfo } from 'state/authen/hooks'
import { useGetParticipantKyberAIInfo, useIsWhiteListKyberAI } from 'state/user/hooks'
import { formattedNum } from 'utils'

import { FormWrapper, Input, InputWithCopy, Label } from './styled'

const Wrapper = styled(FormWrapper)`
  flex-direction: column;
  max-width: 100%;
`

const Icon = styled.div`
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  border-radius: 30px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`

export default function EmailForm({
  style,
  desc,
  labelColor,
}: {
  style?: CSSProperties
  desc: ReactNode
  labelColor?: string
}) {
  const { userInfo } = useSessionInfo()
  const { rankNo, referralCode } = useGetParticipantKyberAIInfo()
  const { isWhiteList } = useIsWhiteListKyberAI()

  const theme = useTheme()
  const shareLink = `${window.location.origin}${APP_PATHS.KYBERAI_ABOUT}?referrer=${referralCode}`
  const color = labelColor || theme.subText
  return (
    <Wrapper style={style}>
      {desc}

      <Column gap="6px">
        <Label style={{ color }}>
          <Trans>Your Email</Trans>
        </Label>
        <Input $borderColor={theme.border} value={userInfo?.email} disabled />
      </Column>

      <RowBetween gap="12px">
        <Column gap="6px" style={{ width: '70%' }}>
          <Label style={{ color }}>
            <Trans>Your Referral Link</Trans>
          </Label>
          <InputWithCopy disabled $borderColor={theme.border} value={shareLink} />
        </Column>

        <Column gap="6px">
          <Label style={{ color }}>
            <Trans>Your Referral Code</Trans>
          </Label>
          <InputWithCopy disabled $borderColor={theme.border} value={referralCode} />
        </Column>
      </RowBetween>

      <RowBetween flexWrap={'wrap'} gap="12px">
        <Column gap="6px" flex={1}>
          {!isWhiteList && (
            <Flex fontSize={14} color={theme.text} style={{ gap: '6px' }}>
              <Users size={16} />
              {rankNo === 1 ? (
                <Trans>You&apos;re first in line!</Trans>
              ) : rankNo === 2 ? (
                <Trans>1 user is ahead of you</Trans>
              ) : (
                <Trans>
                  {rankNo && rankNo <= 101 ? formattedNum(rankNo - 1 + '') : t`Many`} users are ahead of you!
                </Trans>
              )}
            </Flex>
          )}
          <Text fontSize={12} color={theme.subText}>
            <Trans>
              Refer your friends to KyberAI, and get rewarded with our exclusive NFTs!. Learn more{' '}
              <a
                href="https://blog.kyberswap.com/journey-through-kyberium-collect-the-kyberswap-signature-nfts/"
                target="_blank"
                rel="noreferrer"
              >
                here ↗
              </a>
              .
            </Trans>
          </Text>
        </Column>
        <Row gap="12px" width={'fit-content'}>
          <ShareGroupButtons
            shareUrl={shareLink}
            showLabel={false}
            size={20}
            renderItem={({ children, color, ...props }) => <Icon {...props}>{children(color ?? '')}</Icon>}
          />
        </Row>
      </RowBetween>
    </Wrapper>
  )
}
