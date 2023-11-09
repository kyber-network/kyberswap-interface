import { Trans } from '@lingui/macro'
import { createRef, memo, useCallback } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { Text } from 'rebass'
import { useJoinCampaignMutation } from 'services/campaign'
import styled from 'styled-components'

import { ModalCenter } from 'components/Modal'
import { GOOGLE_RECAPTCHA_KEY } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import {
  useModalOpen,
  useRegisterCampaignCaptchaModalToggle,
  useRegisterCampaignSuccessModalToggle,
} from 'state/application/hooks'
import { useRecaptchaCampaignManager } from 'state/campaigns/hooks'

const Background = styled.div`
  background-color: ${({ theme }) => theme.tableHeader};
  width: 400px;
  text-align: center;
  padding: 50px 20px;
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 25px;
  flex-direction: column;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 30px 20px;
  `}
`

const ModalRegisterCampaignCaptcha = ({ refreshListCampaign }: { refreshListCampaign: () => void }) => {
  const recaptchaRef = createRef<ReCAPTCHA>()

  const isRegisterCampaignCaptchaModalOpen = useModalOpen(ApplicationModal.REGISTER_CAMPAIGN_CAPTCHA)
  const toggleRegisterCampaignCaptchaModal = useRegisterCampaignCaptchaModalToggle()
  const toggleRegisterCampaignSuccessModal = useRegisterCampaignSuccessModalToggle()
  const [recaptchaCampaign, updateRecaptchaCampaignId, updateRecaptchaCampaignLoading] = useRecaptchaCampaignManager()
  const theme = useTheme()

  const { account } = useActiveWeb3React()
  const [joinCampaign] = useJoinCampaignMutation()
  // Create an event handler, so you can call the verification on button click event or form submit
  const handleReCaptchaVerify = useCallback(async () => {
    if (!recaptchaCampaign.id || !account) return

    if (typeof recaptchaRef === 'function') {
      console.log("recaptchaRef is a function? Something's wrong.")
      return
    }

    if (!recaptchaRef || !recaptchaRef.current) {
      console.log('Execute recaptcha not yet available')
      return
    }

    try {
      updateRecaptchaCampaignLoading(true)
      const token = await recaptchaRef.current.getValue()
      await new Promise(r => setTimeout(r, 750))
      toggleRegisterCampaignCaptchaModal()
      await joinCampaign({
        token,
        address: account,
        recaptchaId: recaptchaCampaign.id,
      }).unwrap()
      refreshListCampaign()
      toggleRegisterCampaignSuccessModal()
    } catch (err) {
      console.error(err)
    } finally {
      updateRecaptchaCampaignLoading(false)
      updateRecaptchaCampaignId(undefined)
    }
  }, [
    account,
    recaptchaCampaign.id,
    recaptchaRef,
    toggleRegisterCampaignCaptchaModal,
    toggleRegisterCampaignSuccessModal,
    updateRecaptchaCampaignId,
    updateRecaptchaCampaignLoading,
    refreshListCampaign,
    joinCampaign,
  ])

  return (
    <ModalCenter
      isOpen={isRegisterCampaignCaptchaModalOpen}
      onDismiss={() => {
        toggleRegisterCampaignCaptchaModal()
        updateRecaptchaCampaignId(undefined)
      }}
      maxWidth="calc(100vw - 32px)"
      width="fit-content"
      height="fit-content"
      bgColor="transparent"
    >
      <Background>
        <Text color={theme.text}>
          <Trans>To continue, check the box below to verify and proceed</Trans>
        </Text>
        <ReCAPTCHA
          ref={recaptchaRef}
          size="normal"
          sitekey={GOOGLE_RECAPTCHA_KEY}
          onChange={handleReCaptchaVerify}
          theme={'dark'}
          style={{ minHeight: '78px' }}
        />
      </Background>
    </ModalCenter>
  )
}

export default memo(ModalRegisterCampaignCaptcha)
