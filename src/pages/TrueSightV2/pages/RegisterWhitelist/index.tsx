import KyberOauth2 from '@kybernetwork/oauth2'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import SubscribeForm from 'pages/TrueSightV2/pages/RegisterWhitelist/SubscribeForm'
import VerifyCodeModal from 'pages/TrueSightV2/pages/RegisterWhitelist/VerifyCodeModal'
import WaitListForm from 'pages/TrueSightV2/pages/RegisterWhitelist/WaitListForm'
import { ParticipantStatus } from 'pages/TrueSightV2/types'
import { useWalletModalToggle } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { useGetParticipantKyberAIInfo } from 'state/user/hooks'

const ConnectWalletButton = styled(ButtonPrimary)`
  height: 36px;
  width: 236px;
`

export default function RegisterWhitelist({ showForm = true }: { showForm?: boolean }) {
  const navigate = useNavigate()
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const { isLogin } = useSessionInfo()

  const participantInfo = useGetParticipantKyberAIInfo()

  const [verifyModalState, setVerifyModalState] = useState({ isOpen: false, email: '', referredByCode: '' })

  const showVerify = (email: string, referredByCode: string) => {
    setVerifyModalState({ isOpen: true, referredByCode, email })
  }

  const renderVerifyModal = () => (
    <VerifyCodeModal
      {...verifyModalState}
      onDismiss={() => setVerifyModalState(state => ({ ...state, isOpen: false }))}
    />
  )

  if (!account)
    return (
      <ConnectWalletButton onClick={toggleWalletModal}>
        <Trans>Connect Wallet</Trans>
      </ConnectWalletButton>
    )

  if (!isLogin)
    return (
      <ConnectWalletButton onClick={() => KyberOauth2.authenticate()}>
        <Trans>Sign-in to Continue</Trans>
      </ConnectWalletButton>
    )

  if (!showForm) return null

  if (participantInfo?.status === ParticipantStatus.WHITELISTED)
    return (
      <>
        <ConnectWalletButton onClick={() => navigate(APP_PATHS.KYBERAI_EXPLORE)}>
          <Trans>Get Started</Trans>
        </ConnectWalletButton>
        <div style={{ width: '100%', border: `1px solid ${theme.border}` }} />
        <WaitListForm
          showRanking={false}
          desc={
            <Text fontSize={20} color={theme.text} fontWeight={'500'}>
              <Trans>
                Spread the word, and get rewarded for it!{' '}
                <Text as="span" color={theme.primary} style={{ cursor: 'pointer' }}>
                  Details
                </Text>
              </Trans>
            </Text>
          }
        />
      </>
    )
  if (participantInfo?.status === ParticipantStatus.WAITLISTED)
    return (
      <>
        <WaitListForm
          desc={
            <Text fontSize={12} color={theme.subText} lineHeight={'16px'}>
              <Trans>
                Hey! You&apos;re on our waitlist but your slot hasn&apos;t opened up yet. Jump the queue by referring
                others to KyberAI.
              </Trans>
            </Text>
          }
        />
        {renderVerifyModal()}
      </>
    )

  return (
    <>
      <SubscribeForm showVerify={showVerify} />
      {renderVerifyModal()}
    </>
  )
}