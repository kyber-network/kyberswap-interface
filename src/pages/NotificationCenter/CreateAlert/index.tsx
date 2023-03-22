import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { useGetAlertStatsQuery } from 'services/priceAlert'
import styled from 'styled-components'

import { useActiveWeb3React } from 'hooks'
import { ConfirmAlertModalData, PriceAlertStat } from 'pages/NotificationCenter/const'

import ConfirmModal from './ConfirmModal'
import CreateAlertForm from './CreateAlertForm'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  width: 100%;

  transform: translateX(-4px);
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding-left: 16px;
    padding-right: 16px;
  `}
`

const Headline = styled.div`
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
  border-top: 1px solid ${({ theme }) => theme.border};
  padding-top: 12px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding-left: 16px;
    padding-right: 16px;
  `}
`

export default function CreateAlert() {
  const { account } = useActiveWeb3React()

  const [modalData, setModalData] = useState<ConfirmAlertModalData>()
  const showModalConfirm = (data: ConfirmAlertModalData) => {
    setModalData(data)
  }
  const hideModalConfirm = () => {
    setModalData(undefined)
  }

  const { data: priceAlertStat = {} as PriceAlertStat } = useGetAlertStatsQuery(account ?? '', {
    skip: !account,
  })
  const navigate = useNavigate()
  const goBack = () => {
    navigate(-1)
  }

  return (
    <Wrapper>
      <Header style={{ cursor: 'pointer' }} onClick={goBack}>
        <ChevronLeft size={20} />
        <Text fontWeight={'500'} fontSize="14px">
          <Trans>Create Alert</Trans>
        </Text>
      </Header>

      <Headline>
        <Trans>
          We will use our Aggregator to regularly monitor price changes based on your alert conditions below. When the
          price alert is triggered, we will send you a notification
        </Trans>
      </Headline>

      <CreateAlertForm showModalConfirm={showModalConfirm} priceAlertStat={priceAlertStat} />

      {modalData && <ConfirmModal data={modalData} onDismiss={hideModalConfirm} priceAlertStat={priceAlertStat} />}
    </Wrapper>
  )
}
